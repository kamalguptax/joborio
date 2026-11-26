<?php

namespace App\Services\Payments;

use App\Models\Creator;
use App\Models\EarningLedger;
use App\Models\MemberSettlementRecord;
use App\Models\NetworkMember;
use App\Models\PayoutLine;
use App\Models\Publisher;
use App\Models\PublisherLedgerEntry;
use App\Models\WithdrawalRequest;
use App\Services\Publishers\PublisherLedgerService;

class AccountWalletService
{
    public function __construct(
        private PublisherLedgerService $publisherLedger,
        private PaymentEvidenceService $evidence,
        private WithdrawalService $withdrawals,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function forCreator(Creator $creator): array
    {
        $totals = EarningLedger::query()->where('creator_id', $creator->id);
        $pending = (float) (clone $totals)->where('state', 'pending')->sum('net_usd');
        $approved = (float) (clone $totals)->where('state', 'approved')->sum('net_usd');
        $payable = (float) (clone $totals)->where('state', 'payable')->sum('net_usd');
        $paid = (float) (clone $totals)->where('state', 'paid')->sum('net_usd');
        $available = $this->withdrawals->availableUsd('creator', (int) $creator->id);

        $releases = PayoutLine::query()
            ->where('creator_id', $creator->id)
            ->where('status', 'paid')
            ->with('batch')
            ->latest('id')
            ->limit(20)
            ->get()
            ->map(function (PayoutLine $line) {
                $batch = $line->batch;
                $meta = $this->evidence->meta($batch);

                return [
                    'id' => 'payout-line-'.$line->id,
                    'kind' => 'payout_release',
                    'label' => 'Payout released',
                    'amount_usd' => round((float) $line->amount_usd, 4),
                    'status' => $line->status,
                    'method' => $line->method,
                    'reference' => $line->external_reference,
                    'occurred_at' => optional($line->updated_at)?->toIso8601String(),
                    'evidence' => $meta,
                    'batch_id' => $line->payout_batch_id,
                ];
            })
            ->values()
            ->all();

        return [
            'role' => 'creator',
            'currency' => 'USD',
            'balances' => [
                'available_usd' => round($available, 4),
                'pending_usd' => round($pending + $approved, 4),
                'payable_usd' => round($payable, 4),
                'approved_usd' => round($approved, 4),
                'on_hold_usd' => round($pending, 4),
                'paid_usd' => round($paid, 4),
                'lifetime_earned_usd' => round($pending + $approved + $payable + $paid, 4),
            ],
            'account' => array_merge(
                $this->withdrawals->defaultAccountPayload($creator),
                ['payout_currency' => $creator->payout_currency ?? 'USD'],
            ),
            'min_payout_usd' => $this->withdrawals->minPayoutUsd(),
            'withdrawals' => WithdrawalRequest::query()
                ->where('role', 'creator')
                ->where('account_id', $creator->id)
                ->latest('id')
                ->limit(10)
                ->get()
                ->map(fn ($w) => $this->withdrawals->serialize($w))
                ->all(),
            'statement' => $this->withdrawals->statement('creator', (int) $creator->id, 30),
            'releases' => $releases,
            'note' => 'Available can be withdrawn now. Pending includes hold and approved earnings.',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function forNetworkMember(NetworkMember $member): array
    {
        $pending = (float) MemberSettlementRecord::query()
            ->where('network_member_id', $member->id)
            ->where('status', 'pending')
            ->sum('amount_usd');
        $settled = (float) MemberSettlementRecord::query()
            ->where('network_member_id', $member->id)
            ->where('status', 'settled')
            ->sum('amount_usd');
        $withdrawn = (float) WithdrawalRequest::query()
            ->where('role', 'network_member')
            ->where('account_id', $member->id)
            ->where('status', 'paid')
            ->sum('amount_usd');
        $available = $this->withdrawals->availableUsd('network_member', (int) $member->id);

        $releases = MemberSettlementRecord::query()
            ->where('network_member_id', $member->id)
            ->with(['community:id,name,code'])
            ->latest('id')
            ->limit(30)
            ->get()
            ->map(fn (MemberSettlementRecord $r) => [
                'id' => 'member-settle-'.$r->id,
                'kind' => 'member_settlement',
                'label' => $r->status === 'settled' ? 'Payment settled' : 'Pending settlement',
                'amount_usd' => round((float) $r->amount_usd, 4),
                'status' => $r->status,
                'period_label' => $r->period_label,
                'community_name' => $r->community?->name,
                'occurred_at' => optional($r->settled_at ?? $r->created_at)?->toIso8601String(),
                'evidence' => $this->evidence->meta($r),
                'notes' => $r->notes,
            ])
            ->values()
            ->all();

        return [
            'role' => 'network_member',
            'currency' => 'USD',
            'balances' => [
                'available_usd' => round($available, 4),
                'pending_usd' => round($pending, 4),
                'paid_usd' => round($withdrawn, 4),
                'lifetime_earned_usd' => round($pending + $settled, 4),
            ],
            'account' => array_merge(
                $this->withdrawals->defaultAccountPayload($member),
                [
                    'publisher_id' => $member->publisher_id,
                    'status' => $member->status,
                ],
            ),
            'min_payout_usd' => $this->withdrawals->minPayoutUsd(),
            'withdrawals' => WithdrawalRequest::query()
                ->where('role', 'network_member')
                ->where('account_id', $member->id)
                ->latest('id')
                ->limit(10)
                ->get()
                ->map(fn ($w) => $this->withdrawals->serialize($w))
                ->all(),
            'statement' => $this->withdrawals->statement('network_member', (int) $member->id, 30),
            'releases' => $releases,
            'note' => 'Available is settled funds you can withdraw. Pending waits on your publisher. Paid is already withdrawn.',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function forPublisher(Publisher $publisher): array
    {
        $balances = $this->publisherLedger->balances($publisher);
        $available = $this->withdrawals->availableUsd('publisher', (int) $publisher->id);

        $memberPending = (float) MemberSettlementRecord::query()
            ->where('publisher_id', $publisher->id)
            ->where('status', 'pending')
            ->sum('amount_usd');
        $memberSettled = (float) MemberSettlementRecord::query()
            ->where('publisher_id', $publisher->id)
            ->where('status', 'settled')
            ->sum('amount_usd');

        $releases = PublisherLedgerEntry::query()
            ->where('publisher_id', $publisher->id)
            ->where(function ($q) {
                $q->where('state', 'paid')
                    ->orWhere('entry_type', 'debit')
                    ->orWhereNotNull('evidence_path');
            })
            ->with(['community:id,name,code'])
            ->latest('id')
            ->limit(20)
            ->get()
            ->map(fn (PublisherLedgerEntry $e) => [
                'id' => 'pub-ledger-'.$e->id,
                'kind' => 'publisher_ledger',
                'label' => 'Ledger · '.$e->entry_type,
                'amount_usd' => round((float) $e->net_usd, 4),
                'status' => $e->state,
                'reference' => $e->reference,
                'community_name' => $e->community?->name,
                'occurred_at' => optional($e->paid_at ?? $e->occurred_at ?? $e->created_at)?->toIso8601String(),
                'evidence' => $this->evidence->meta($e),
            ])
            ->values()
            ->all();

        $memberReleases = MemberSettlementRecord::query()
            ->where('publisher_id', $publisher->id)
            ->with([
                'networkMember:id,display_name',
                'community:id,name',
            ])
            ->latest('id')
            ->limit(20)
            ->get()
            ->map(fn (MemberSettlementRecord $r) => [
                'id' => 'member-settle-'.$r->id,
                'kind' => 'member_settlement',
                'label' => $r->status === 'settled' ? 'Member payment released' : 'Member payment pending',
                'amount_usd' => round((float) $r->amount_usd, 4),
                'status' => $r->status,
                'member_name' => $r->networkMember?->display_name,
                'community_name' => $r->community?->name,
                'period_label' => $r->period_label,
                'occurred_at' => optional($r->settled_at ?? $r->created_at)?->toIso8601String(),
                'evidence' => $this->evidence->meta($r),
            ])
            ->values()
            ->all();

        return [
            'role' => 'publisher',
            'currency' => 'USD',
            'balances' => [
                'available_usd' => round($available, 4),
                'pending_usd' => round((float) (($balances['pending_usd'] ?? 0) + ($balances['approved_usd'] ?? 0)), 4),
                'payable_usd' => round((float) ($balances['payable_usd'] ?? 0), 4),
                'paid_usd' => round((float) ($balances['paid_usd'] ?? 0), 4),
                'lifetime_earned_usd' => round((float) ($balances['lifetime_net_usd'] ?? 0), 4),
                'member_pending_usd' => round($memberPending, 4),
                'member_paid_usd' => round($memberSettled, 4),
            ],
            'account' => array_merge(
                $this->withdrawals->defaultAccountPayload($publisher),
                [
                    'code' => $publisher->code,
                    'status' => $publisher->status,
                ],
            ),
            'min_payout_usd' => $this->withdrawals->minPayoutUsd(),
            'withdrawals' => WithdrawalRequest::query()
                ->where('role', 'publisher')
                ->where('account_id', $publisher->id)
                ->latest('id')
                ->limit(10)
                ->get()
                ->map(fn ($w) => $this->withdrawals->serialize($w))
                ->all(),
            'statement' => $this->withdrawals->statement('publisher', (int) $publisher->id, 30),
            'releases' => $releases,
            'member_releases' => $memberReleases,
            'pending_member_settlements' => MemberSettlementRecord::query()
                ->where('publisher_id', $publisher->id)
                ->where('status', 'pending')
                ->with([
                    'networkMember:id,display_name',
                    'community:id,name',
                ])
                ->latest('id')
                ->limit(30)
                ->get()
                ->map(function (MemberSettlementRecord $r) use ($available) {
                    $amount = round((float) $r->amount_usd, 4);

                    return [
                        'id' => $r->id,
                        'amount_usd' => $amount,
                        'member_name' => $r->networkMember?->display_name,
                        'community_name' => $r->community?->name,
                        'period_label' => $r->period_label,
                        'created_at' => optional($r->created_at)?->toIso8601String(),
                        'can_release' => $amount > 0 && $amount <= $available,
                        'wallet_shortfall_usd' => $amount > $available
                            ? round($amount - $available, 4)
                            : 0,
                    ];
                })
                ->values()
                ->all(),
            'note' => 'Available can be withdrawn or used to release member payments (with evidence). Pending is not yet payable.',
        ];
    }
}
