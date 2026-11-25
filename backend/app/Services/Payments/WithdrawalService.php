<?php

namespace App\Services\Payments;

use App\Models\Creator;
use App\Models\EarningLedger;
use App\Models\MemberSettlementRecord;
use App\Models\NetworkMember;
use App\Models\Publisher;
use App\Models\PublisherLedgerEntry;
use App\Models\User;
use App\Models\WithdrawalRequest;
use App\Services\Notifications\UserNotificationService;
use App\Services\Platform\PlatformSettingsService;
use App\Services\Publishers\PublisherLedgerService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class WithdrawalService
{
    public function __construct(
        private PlatformSettingsService $settings,
        private PublisherLedgerService $publisherLedger,
        private PaymentEvidenceService $evidence,
        private UserNotificationService $notifications,
    ) {}

    public function minPayoutUsd(): float
    {
        return (float) ($this->settings->payoutStructure()['min_payout_usd'] ?? 10);
    }

    public function availableUsd(string $role, int $accountId): float
    {
        $pendingHolds = (float) WithdrawalRequest::query()
            ->where('role', $role)
            ->where('account_id', $accountId)
            ->whereIn('status', ['pending', 'approved'])
            ->sum('amount_usd');

        $raw = match ($role) {
            'creator' => (float) EarningLedger::query()
                ->where('creator_id', $accountId)
                ->where('state', 'payable')
                ->sum('net_usd'),
            'publisher' => (float) ($this->publisherLedger->balances(
                Publisher::query()->findOrFail($accountId),
            )['payable_usd'] ?? 0),
            'network_member' => (float) MemberSettlementRecord::query()
                ->where('network_member_id', $accountId)
                ->where('status', 'settled')
                ->sum('amount_usd')
                - (float) WithdrawalRequest::query()
                    ->where('role', 'network_member')
                    ->where('account_id', $accountId)
                    ->where('status', 'paid')
                    ->sum('amount_usd'),
            default => 0.0,
        };

        // Creator/publisher: subtract pending/approved holds from payable.
        // Network: settled settlements minus paid withdrawals, then also hold pending.
        if ($role === 'network_member') {
            return max(0.0, round($raw - $pendingHolds, 4));
        }

        return max(0.0, round($raw - $pendingHolds, 4));
    }

    /**
     * @param  array<string, mixed>  $payoutDetails
     */
    public function request(
        User $user,
        string $role,
        int $accountId,
        float $amount,
        string $payoutMethod,
        array $payoutDetails,
        ?string $userNote = null,
    ): WithdrawalRequest {
        if (! in_array($role, WithdrawalRequest::ROLES, true)) {
            throw new InvalidArgumentException('Invalid withdrawal role.');
        }

        $amount = round($amount, 4);
        $min = $this->minPayoutUsd();
        if ($amount < $min) {
            throw new InvalidArgumentException('Minimum withdrawal is $'.number_format($min, 2).' USD.');
        }

        $available = $this->availableUsd($role, $accountId);
        if ($amount > $available) {
            throw new InvalidArgumentException(
                'Insufficient available balance. Available $'.number_format($available, 2).' USD.',
            );
        }

        if (! in_array($payoutMethod, ['upi', 'bank_transfer', 'paypal'], true)) {
            throw new InvalidArgumentException('Choose UPI, bank transfer, or PayPal.');
        }

        $this->assertPayoutDetails($payoutMethod, $payoutDetails);

        $row = WithdrawalRequest::create([
            'user_id' => $user->id,
            'role' => $role,
            'account_id' => $accountId,
            'amount_usd' => $amount,
            'currency' => 'USD',
            'status' => 'pending',
            'payout_method' => $payoutMethod,
            'payout_details' => $payoutDetails,
            'user_note' => $userNote,
        ]);

        return $row;
    }

    /**
     * Persist payout details as the account's default withdrawal destination.
     *
     * @param  array<string, mixed>  $payoutDetails
     */
    public function saveDefaultAccount(string $role, int $accountId, string $payoutMethod, array $payoutDetails): array
    {
        $this->assertPayoutDetails($payoutMethod, $payoutDetails);

        $fields = [
            'payout_method' => $payoutMethod,
            'payout_holder_name' => $payoutDetails['holder_name'] ?? null,
            'payout_upi_id' => $payoutDetails['upi_id'] ?? null,
            'payout_paypal_email' => $payoutDetails['paypal_email'] ?? null,
            'payout_bank_name' => $payoutDetails['bank_name'] ?? null,
            'payout_account_number' => $payoutDetails['account_number'] ?? null,
            'payout_ifsc' => isset($payoutDetails['ifsc'])
                ? strtoupper((string) $payoutDetails['ifsc'])
                : null,
        ];

        $model = match ($role) {
            'creator' => Creator::query()->findOrFail($accountId),
            'publisher' => Publisher::query()->findOrFail($accountId),
            'network_member' => NetworkMember::query()->findOrFail($accountId),
            default => throw new InvalidArgumentException('Invalid withdrawal role.'),
        };

        $model->update($fields);

        return $this->defaultAccountPayload($model->fresh());
    }

    /**
     * @return array<string, mixed>
     */
    public function defaultAccountPayload(?object $model): array
    {
        if (! $model) {
            return [
                'payout_method' => null,
                'payout_holder_name' => null,
                'payout_upi_id' => null,
                'payout_paypal_email' => null,
                'payout_bank_name' => null,
                'payout_account_number' => null,
                'payout_ifsc' => null,
                'has_default' => false,
                'summary' => null,
            ];
        }

        $method = $model->payout_method ?? null;
        $summary = match ($method) {
            'upi' => trim(($model->payout_holder_name ?? '').' · '.($model->payout_upi_id ?? '')),
            'paypal' => (string) ($model->payout_paypal_email ?? ''),
            'bank_transfer' => trim(
                ($model->payout_holder_name ?? '')
                .' · '.($model->payout_bank_name ?? '')
                .' · ****'.substr((string) ($model->payout_account_number ?? ''), -4)
                .' · '.($model->payout_ifsc ?? ''),
            ),
            default => null,
        };

        $complete = match ($method) {
            'upi' => filled($model->payout_holder_name ?? null) && filled($model->payout_upi_id ?? null),
            'paypal' => filled($model->payout_paypal_email ?? null),
            'bank_transfer' => filled($model->payout_holder_name ?? null)
                && filled($model->payout_bank_name ?? null)
                && filled($model->payout_account_number ?? null)
                && filled($model->payout_ifsc ?? null),
            default => false,
        };

        return [
            'payout_method' => $method,
            'payout_holder_name' => $model->payout_holder_name ?? null,
            'payout_upi_id' => $model->payout_upi_id ?? null,
            'payout_paypal_email' => $model->payout_paypal_email ?? null,
            'payout_bank_name' => $model->payout_bank_name ?? null,
            'payout_account_number' => $model->payout_account_number ?? null,
            'payout_ifsc' => $model->payout_ifsc ?? null,
            'has_default' => $complete,
            'summary' => $summary ?: null,
        ];
    }

    public function cancel(WithdrawalRequest $request, User $user): WithdrawalRequest
    {
        if ((int) $request->user_id !== (int) $user->id) {
            throw new InvalidArgumentException('Withdrawal not found.');
        }
        if ($request->status !== 'pending') {
            throw new InvalidArgumentException('Only pending withdrawals can be cancelled.');
        }
        $request->update(['status' => 'cancelled']);

        return $request->fresh();
    }

    /**
     * @param  array{admin_note?: string|null}  $meta
     */
    public function reject(WithdrawalRequest $request, User $admin, array $meta = []): WithdrawalRequest
    {
        if (! in_array($request->status, ['pending', 'approved'], true)) {
            throw new InvalidArgumentException('This withdrawal cannot be rejected.');
        }
        $request->update([
            'status' => 'rejected',
            'admin_note' => $meta['admin_note'] ?? $request->admin_note,
            'reviewed_by_user_id' => $admin->id,
            'reviewed_at' => now(),
        ]);

        if ($request->user) {
            $this->notifications->notify(
                $request->user,
                'withdrawal_rejected',
                'Withdrawal rejected',
                'Your withdrawal request of $'.number_format((float) $request->amount_usd, 2).' was rejected.',
                ['withdrawal_id' => $request->id],
            );
        }

        return $request->fresh();
    }

    /**
     * Approve + mark paid with evidence (admin release).
     *
     * @param  array{admin_note?: string|null, evidence_note?: string|null, external_reference?: string|null}  $meta
     */
    public function pay(
        WithdrawalRequest $request,
        User $admin,
        UploadedFile $evidenceFile,
        array $meta = [],
    ): WithdrawalRequest {
        if (! in_array($request->status, ['pending', 'approved'], true)) {
            throw new InvalidArgumentException('This withdrawal cannot be paid.');
        }

        $stored = $this->evidence->store(
            $evidenceFile,
            'payment-evidence/withdrawals/'.$request->id,
        );

        return DB::transaction(function () use ($request, $admin, $stored, $meta) {
            if ($request->role === 'creator') {
                $this->markCreatorPayableAsPaid((int) $request->account_id, (float) $request->amount_usd);
            } elseif ($request->role === 'publisher') {
                $this->markPublisherPayableAsPaid((int) $request->account_id, (float) $request->amount_usd);
            }
            // network_member: settled settlements already belong to member; paid withdrawals track outflow.

            $request->update([
                'status' => 'paid',
                'admin_note' => $meta['admin_note'] ?? $request->admin_note,
                'evidence_path' => $stored['evidence_path'],
                'evidence_original_name' => $stored['evidence_original_name'],
                'evidence_mime' => $stored['evidence_mime'],
                'evidence_size' => $stored['evidence_size'],
                'evidence_uploaded_at' => $stored['evidence_uploaded_at'],
                'evidence_note' => $meta['evidence_note'] ?? null,
                'external_reference' => $meta['external_reference'] ?? null,
                'reviewed_by_user_id' => $admin->id,
                'reviewed_at' => now(),
                'paid_at' => now(),
            ]);

            if ($request->user) {
                $this->notifications->notify(
                    $request->user,
                    'withdrawal_paid',
                    'Withdrawal paid',
                    'Your withdrawal of $'.number_format((float) $request->amount_usd, 2).' has been paid.',
                    ['withdrawal_id' => $request->id],
                );
            }

            return $request->fresh();
        });
    }

    /**
     * Unified statement rows for an account.
     *
     * @return list<array<string, mixed>>
     */
    public function statement(string $role, int $accountId, int $limit = 50): array
    {
        $rows = collect();

        if ($role === 'creator') {
            EarningLedger::query()
                ->where('creator_id', $accountId)
                ->latest('id')
                ->limit($limit)
                ->get()
                ->each(function (EarningLedger $e) use ($rows) {
                    $rows->push([
                        'id' => 'earn-'.$e->id,
                        'kind' => 'earning',
                        'label' => strtoupper((string) $e->earning_type).' earning',
                        'direction' => 'credit',
                        'amount_usd' => round((float) $e->net_usd, 4),
                        'status' => $e->state,
                        'occurred_at' => optional($e->paid_at ?? $e->approved_at ?? $e->created_at)?->toIso8601String(),
                    ]);
                });
        }

        if ($role === 'publisher') {
            PublisherLedgerEntry::query()
                ->where('publisher_id', $accountId)
                ->latest('id')
                ->limit($limit)
                ->get()
                ->each(function (PublisherLedgerEntry $e) use ($rows) {
                    $rows->push([
                        'id' => 'pled-'.$e->id,
                        'kind' => 'ledger',
                        'label' => 'Publisher '.$e->entry_type,
                        'direction' => in_array($e->entry_type, ['debit', 'reversal'], true) ? 'debit' : 'credit',
                        'amount_usd' => round((float) $e->net_usd, 4),
                        'status' => $e->state,
                        'reference' => $e->reference,
                        'occurred_at' => optional($e->paid_at ?? $e->occurred_at ?? $e->created_at)?->toIso8601String(),
                    ]);
                });
        }

        if ($role === 'network_member') {
            MemberSettlementRecord::query()
                ->where('network_member_id', $accountId)
                ->latest('id')
                ->limit($limit)
                ->get()
                ->each(function (MemberSettlementRecord $r) use ($rows) {
                    $rows->push([
                        'id' => 'ms-'.$r->id,
                        'kind' => 'settlement',
                        'label' => 'Member settlement',
                        'direction' => 'credit',
                        'amount_usd' => round((float) $r->amount_usd, 4),
                        'status' => $r->status,
                        'reference' => $r->period_label,
                        'occurred_at' => optional($r->settled_at ?? $r->created_at)?->toIso8601String(),
                    ]);
                });
        }

        WithdrawalRequest::query()
            ->where('role', $role)
            ->where('account_id', $accountId)
            ->latest('id')
            ->limit($limit)
            ->get()
            ->each(function (WithdrawalRequest $w) use ($rows) {
                $rows->push([
                    'id' => 'wd-'.$w->id,
                    'kind' => 'withdrawal',
                    'label' => 'Withdrawal · '.($w->payout_method ?? 'payout'),
                    'direction' => 'debit',
                    'amount_usd' => round((float) $w->amount_usd, 4),
                    'status' => $w->status,
                    'reference' => $w->external_reference,
                    'occurred_at' => optional($w->paid_at ?? $w->created_at)?->toIso8601String(),
                ]);
            });

        return $rows
            ->sortByDesc('occurred_at')
            ->take($limit)
            ->values()
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function serializeList($queryLimit = 30, ?string $status = null): array
    {
        $q = WithdrawalRequest::query()->with(['user:id,name,email'])->latest('id')->limit($queryLimit);
        if ($status) {
            $q->where('status', $status);
        }

        return $q->get()->map(fn (WithdrawalRequest $w) => $this->serialize($w))->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function serialize(WithdrawalRequest $w): array
    {
        return [
            'id' => $w->id,
            'role' => $w->role,
            'account_id' => $w->account_id,
            'amount_usd' => round((float) $w->amount_usd, 4),
            'currency' => $w->currency,
            'status' => $w->status,
            'payout_method' => $w->payout_method,
            'payout_details' => $w->payout_details,
            'user_note' => $w->user_note,
            'admin_note' => $w->admin_note,
            'external_reference' => $w->external_reference,
            'evidence' => $this->evidence->meta($w),
            'user' => $w->relationLoaded('user') ? [
                'id' => $w->user?->id,
                'name' => $w->user?->name,
                'email' => $w->user?->email,
            ] : null,
            'created_at' => optional($w->created_at)?->toIso8601String(),
            'reviewed_at' => optional($w->reviewed_at)?->toIso8601String(),
            'paid_at' => optional($w->paid_at)?->toIso8601String(),
        ];
    }

    /**
     * @param  array<string, mixed>  $details
     */
    private function assertPayoutDetails(string $method, array $details): void
    {
        $missing = match ($method) {
            'upi' => blank($details['holder_name'] ?? null) || blank($details['upi_id'] ?? null)
                ? 'Add holder name and UPI ID.'
                : null,
            'paypal' => blank($details['paypal_email'] ?? null)
                ? 'Add PayPal email.'
                : null,
            'bank_transfer' => blank($details['holder_name'] ?? null)
                || blank($details['bank_name'] ?? null)
                || blank($details['account_number'] ?? null)
                || blank($details['ifsc'] ?? null)
                ? 'Add holder, bank name, account number, and IFSC.'
                : null,
            default => 'Invalid payout method.',
        };

        if ($missing) {
            throw new InvalidArgumentException($missing);
        }
    }

    private function markCreatorPayableAsPaid(int $creatorId, float $amount): void
    {
        $left = $amount;
        $rows = EarningLedger::query()
            ->where('creator_id', $creatorId)
            ->where('state', 'payable')
            ->orderBy('id')
            ->lockForUpdate()
            ->get();

        foreach ($rows as $row) {
            if ($left <= 0) {
                break;
            }
            $net = (float) $row->net_usd;
            if ($net <= $left + 0.0001) {
                $row->update(['state' => 'paid', 'paid_at' => now()]);
                $left = round($left - $net, 4);
            }
        }
    }

    private function markPublisherPayableAsPaid(int $publisherId, float $amount): void
    {
        $left = $amount;
        $rows = PublisherLedgerEntry::query()
            ->where('publisher_id', $publisherId)
            ->whereIn('entry_type', ['credit', 'adjustment'])
            ->where('state', 'payable')
            ->orderBy('id')
            ->lockForUpdate()
            ->get();

        foreach ($rows as $row) {
            if ($left <= 0) {
                break;
            }
            $net = (float) $row->net_usd;
            if ($net <= $left + 0.0001) {
                $row->update(['state' => 'paid', 'paid_at' => now()]);
                $left = round($left - $net, 4);
            }
        }
    }
}
