<?php

namespace App\Http\Controllers\Api\V1\Publisher;

use App\Http\Controllers\Controller;
use App\Models\MemberSettlementRecord;
use App\Models\PublisherLedgerEntry;
use App\Services\Payments\PaymentEvidenceService;
use App\Services\Payments\WithdrawalService;
use App\Services\Publishers\MemberSettlementService;
use App\Support\ApiResponse;
use App\Support\PublisherAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentHistoryController extends Controller
{
    use ApiResponse;

    public function __construct(
        private PaymentEvidenceService $evidence,
        private MemberSettlementService $settlements,
        private WithdrawalService $withdrawals,
    ) {}

    public function show(Request $request): JsonResponse
    {
        PublisherAccess::assertFinancialAccess($request->user());
        $publisher = PublisherAccess::publisher($request->user());
        $walletAvailable = $this->settlements->availableWalletUsd($publisher);

        $settlements = PublisherLedgerEntry::query()
            ->where('publisher_id', $publisher->id)
            ->where(function ($q) {
                $q->where('entry_type', 'debit')
                    ->orWhere('source', 'settlement')
                    ->orWhere('state', 'paid');
            })
            ->with(['community:id,code,name'])
            ->latest('id')
            ->limit(100)
            ->get()
            ->map(fn (PublisherLedgerEntry $e) => [
                'id' => $e->id,
                'kind' => 'publisher_settlement',
                'entry_type' => $e->entry_type,
                'state' => $e->state,
                'amount_usd' => $e->net_usd,
                'currency' => $e->currency,
                'reference' => $e->reference,
                'community_name' => $e->community?->name,
                'reverses_ledger_id' => $e->reverses_ledger_id,
                'occurred_at' => optional($e->occurred_at ?? $e->paid_at ?? $e->created_at)?->toIso8601String(),
                'evidence' => $this->evidence->meta($e),
            ]);

        $memberSettlements = MemberSettlementRecord::query()
            ->where('publisher_id', $publisher->id)
            ->with([
                'networkMember:id,display_name,user_id,payout_method,payout_holder_name,payout_upi_id,payout_paypal_email,payout_bank_name,payout_account_number,payout_ifsc',
                'networkMember.user:id,email,name',
                'community:id,code,name',
            ])
            ->latest('id')
            ->limit(100)
            ->get()
            ->map(function (MemberSettlementRecord $r) use ($walletAvailable) {
                $amount = round((float) $r->amount_usd, 4);
                $pending = $r->status === 'pending';
                $payoutAccount = $this->withdrawals->defaultAccountPayload($r->networkMember);
                $hasPayoutAccount = (bool) ($payoutAccount['has_default'] ?? false);

                return [
                    'id' => $r->id,
                    'kind' => 'member_settlement',
                    'status' => $r->status,
                    'amount_usd' => $r->amount_usd,
                    'currency' => $r->currency,
                    'period_label' => $r->period_label,
                    'member_name' => $r->networkMember?->display_name
                        ?: $r->networkMember?->user?->name,
                    'member_email' => $r->networkMember?->user?->email,
                    'community_name' => $r->community?->name,
                    'settled_at' => optional($r->settled_at)?->toIso8601String(),
                    'created_at' => optional($r->created_at)?->toIso8601String(),
                    'notes' => $r->notes,
                    'evidence' => $this->evidence->meta($r),
                    'payout_account' => $payoutAccount,
                    'has_payout_account' => $hasPayoutAccount,
                    'can_release' => $pending
                        && $hasPayoutAccount
                        && $amount > 0
                        && $amount <= $walletAvailable,
                    'wallet_shortfall_usd' => $pending && $amount > $walletAvailable
                        ? round($amount - $walletAvailable, 4)
                        : 0,
                    'release_block_reason' => ! $pending
                        ? null
                        : (! $hasPayoutAccount
                            ? 'Member has not added bank / UPI payout details yet.'
                            : ($amount > $walletAvailable
                                ? 'Insufficient publisher wallet balance.'
                                : null)),
                ];
            });

        $paidTotal = PublisherLedgerEntry::query()
            ->where('publisher_id', $publisher->id)
            ->where('state', 'paid')
            ->whereIn('entry_type', ['credit', 'adjustment'])
            ->sum('net_usd');

        $debitTotal = PublisherLedgerEntry::query()
            ->where('publisher_id', $publisher->id)
            ->where('entry_type', 'debit')
            ->sum('net_usd');

        $memberPendingUsd = (float) MemberSettlementRecord::query()
            ->where('publisher_id', $publisher->id)
            ->where('status', 'pending')
            ->sum('amount_usd');

        return $this->success([
            'summary' => [
                'publisher_paid_credits_usd' => round((float) $paidTotal, 4),
                'publisher_settlement_debits_usd' => round((float) $debitTotal, 4),
                'member_settlements_count' => $memberSettlements->count(),
                'wallet_available_usd' => $walletAvailable,
                'member_pending_usd' => round($memberPendingUsd, 4),
            ],
            'publisher_settlements' => $settlements,
            'member_settlements' => $memberSettlements,
            'note' => 'Pay to the member’s saved bank/UPI account, then upload evidence. Released funds land in the member wallet for withdrawal.',
        ]);
    }
}
