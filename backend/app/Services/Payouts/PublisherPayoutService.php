<?php

namespace App\Services\Payouts;

use App\Models\Publisher;
use App\Models\PublisherLedgerEntry;
use App\Models\PublisherUser;
use App\Models\User;
use App\Services\Notifications\UserNotificationService;
use App\Services\Payments\PaymentEvidenceService;
use App\Services\Payments\WithdrawalService;
use App\Services\Publishers\PublisherLedgerService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class PublisherPayoutService
{
    public function __construct(
        private PublisherLedgerService $ledger,
        private PaymentEvidenceService $evidence,
        private UserNotificationService $notifications,
        private WithdrawalService $withdrawals,
    ) {}

    /**
     * Publishers with payable commission ready for admin release.
     *
     * @return array{publishers: list<array<string, mixed>>, total_usd: float, count: int}
     */
    public function preview(): array
    {
        $publishers = Publisher::query()
            ->where('status', Publisher::STATUS_ACTIVATED)
            ->orderBy('display_name')
            ->get();

        $rows = [];
        $total = 0.0;

        foreach ($publishers as $publisher) {
            $balances = $this->ledger->balances($publisher);
            $payable = $this->withdrawals->availableUsd('publisher', (int) $publisher->id);
            if ($payable <= 0) {
                continue;
            }

            $owner = PublisherUser::query()
                ->where('publisher_id', $publisher->id)
                ->where('role', 'owner')
                ->where('is_active', true)
                ->with('user:id,name,email')
                ->first();

            $rows[] = [
                'publisher_id' => $publisher->id,
                'code' => $publisher->code,
                'username' => $publisher->username,
                'display_name' => $publisher->display_name,
                'payable_usd' => round($payable, 4),
                'pending_usd' => round((float) ($balances['pending_usd'] ?? 0), 4),
                'paid_usd' => round((float) ($balances['paid_usd'] ?? 0), 4),
                'owner_name' => $owner?->user?->name,
                'owner_email' => $owner?->user?->email,
            ];
            $total += $payable;
        }

        usort($rows, fn ($a, $b) => $b['payable_usd'] <=> $a['payable_usd']);

        return [
            'publishers' => $rows,
            'total_usd' => round($total, 4),
            'count' => count($rows),
        ];
    }

    /**
     * Mark publisher payable ledger credits as paid and attach payment evidence.
     *
     * @param  array{evidence_note?: string|null, external_reference?: string|null}  $meta
     * @return array<string, mixed>
     */
    public function release(
        Publisher $publisher,
        UploadedFile $evidenceFile,
        User $releasedBy,
        array $meta = [],
    ): array {
        $available = $this->withdrawals->availableUsd('publisher', (int) $publisher->id);
        if ($available <= 0) {
            throw new InvalidArgumentException(
                'This publisher has no available balance to release (payable may be held by pending withdrawals).',
            );
        }

        $entries = PublisherLedgerEntry::query()
            ->where('publisher_id', $publisher->id)
            ->whereIn('entry_type', ['credit', 'adjustment'])
            ->where('state', 'payable')
            ->orderBy('id')
            ->get();

        if ($entries->isEmpty()) {
            throw new InvalidArgumentException('This publisher has no payable balance to release.');
        }

        $stored = $this->evidence->store(
            $evidenceFile,
            'payment-evidence/publisher-payouts/'.$publisher->id,
        );

        return DB::transaction(function () use ($publisher, $entries, $stored, $releasedBy, $meta, $available) {
            $ids = [];
            $total = 0.0;
            $left = $available;
            foreach ($entries as $entry) {
                if ($left <= 0) {
                    break;
                }
                $net = (float) $entry->net_usd;
                if ($net > $left + 0.0001) {
                    continue;
                }
                $entry->update([
                    'state' => 'paid',
                    'paid_at' => now(),
                    'evidence_path' => $stored['evidence_path'],
                    'evidence_original_name' => $stored['evidence_original_name'],
                    'evidence_mime' => $stored['evidence_mime'],
                    'evidence_size' => $stored['evidence_size'],
                    'evidence_uploaded_at' => $stored['evidence_uploaded_at'],
                    'evidence_note' => $meta['evidence_note'] ?? null,
                    'released_by_user_id' => $releasedBy->id,
                    'reference' => $meta['external_reference']
                        ?? $entry->reference
                        ?? ('admin-payout-'.now()->format('YmdHis')),
                    'meta' => array_merge(is_array($entry->meta) ? $entry->meta : [], [
                        'admin_payout_released' => true,
                        'released_by_user_id' => $releasedBy->id,
                        'external_reference' => $meta['external_reference'] ?? null,
                    ]),
                ]);
                $ids[] = $entry->id;
                $total = round($total + $net, 4);
                $left = round($left - $net, 4);
            }

            if ($total <= 0) {
                throw new InvalidArgumentException('This publisher has no available balance to release.');
            }

            $ownerUser = PublisherUser::query()
                ->where('publisher_id', $publisher->id)
                ->where('role', 'owner')
                ->where('is_active', true)
                ->with('user')
                ->first()
                ?->user;

            if ($ownerUser) {
                $amount = number_format($total, 2);
                $this->notifications->notify(
                    $ownerUser,
                    'publisher_payout_completed',
                    'Publisher payout sent',
                    "Your publisher payout of \${$amount} USD has been marked paid.",
                    [
                        'publisher_id' => $publisher->id,
                        'amount_usd' => $total,
                        'ledger_ids' => $ids,
                    ],
                );
            }

            $balances = $this->ledger->balances($publisher);

            return [
                'publisher_id' => $publisher->id,
                'code' => $publisher->code,
                'display_name' => $publisher->display_name,
                'released_usd' => $total,
                'entries_paid' => count($ids),
                'ledger_ids' => $ids,
                'evidence' => $this->evidence->meta($entries->first()?->fresh()),
                'balances' => $balances,
            ];
        });
    }

    /**
     * Recent publisher payout releases (paid credits with evidence).
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function recentReleases(int $limit = 20): Collection
    {
        return PublisherLedgerEntry::query()
            ->where('entry_type', 'credit')
            ->where('state', 'paid')
            ->whereNotNull('evidence_path')
            ->with(['publisher:id,code,display_name,username'])
            ->latest('paid_at')
            ->limit($limit * 5)
            ->get()
            ->groupBy('publisher_id')
            ->take($limit)
            ->map(function (Collection $group) {
                /** @var PublisherLedgerEntry $first */
                $first = $group->first();
                $publisher = $first->publisher;

                return [
                    'publisher_id' => $first->publisher_id,
                    'code' => $publisher?->code,
                    'display_name' => $publisher?->display_name,
                    'amount_usd' => round((float) $group->sum('net_usd'), 4),
                    'entries' => $group->count(),
                    'paid_at' => optional($first->paid_at)?->toIso8601String(),
                    'evidence' => $this->evidence->meta($first),
                    'reference' => $first->reference,
                ];
            })
            ->values();
    }
}
