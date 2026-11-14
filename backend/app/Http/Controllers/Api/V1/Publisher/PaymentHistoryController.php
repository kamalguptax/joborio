<?php

namespace App\Http\Controllers\Api\V1\Publisher;

use App\Http\Controllers\Controller;
use App\Models\MemberSettlementRecord;
use App\Models\PublisherLedgerEntry;
use App\Support\ApiResponse;
use App\Support\PublisherAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentHistoryController extends Controller
{
    use ApiResponse;

    public function show(Request $request): JsonResponse
    {
        PublisherAccess::assertFinancialAccess($request->user());
        $publisher = PublisherAccess::publisher($request->user());

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
            ]);

        $memberSettlements = MemberSettlementRecord::query()
            ->where('publisher_id', $publisher->id)
            ->with([
                'networkMember:id,display_name,user_id',
                'networkMember.user:id,email',
                'community:id,code,name',
            ])
            ->latest('id')
            ->limit(100)
            ->get()
            ->map(fn (MemberSettlementRecord $r) => [
                'id' => $r->id,
                'kind' => 'member_settlement',
                'status' => $r->status,
                'amount_usd' => $r->amount_usd,
                'currency' => $r->currency,
                'period_label' => $r->period_label,
                'member_name' => $r->networkMember?->display_name,
                'member_email' => $r->networkMember?->user?->email,
                'community_name' => $r->community?->name,
                'settled_at' => optional($r->settled_at)?->toIso8601String(),
                'created_at' => optional($r->created_at)?->toIso8601String(),
                'notes' => $r->notes,
            ]);

        $paidTotal = PublisherLedgerEntry::query()
            ->where('publisher_id', $publisher->id)
            ->where('state', 'paid')
            ->whereIn('entry_type', ['credit', 'adjustment'])
            ->sum('net_usd');

        $debitTotal = PublisherLedgerEntry::query()
            ->where('publisher_id', $publisher->id)
            ->where('entry_type', 'debit')
            ->sum('net_usd');

        return $this->success([
            'summary' => [
                'publisher_paid_credits_usd' => round((float) $paidTotal, 4),
                'publisher_settlement_debits_usd' => round((float) $debitTotal, 4),
                'member_settlements_count' => $memberSettlements->count(),
            ],
            'publisher_settlements' => $settlements,
            'member_settlements' => $memberSettlements,
            'note' => 'Publisher settlement and member payment reconciliation are kept separate.',
        ]);
    }
}
