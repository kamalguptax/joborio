<?php

namespace App\Http\Controllers\Api\V1\Publisher;

use App\Http\Controllers\Controller;
use App\Models\MemberSettlementRecord;
use App\Models\PublisherCampaignAssignment;
use App\Models\PublisherCommission;
use App\Models\PublisherLedgerEntry;
use App\Services\Publishers\PublisherLedgerService;
use App\Support\ApiResponse;
use App\Support\PublisherAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EarningsController extends Controller
{
    use ApiResponse;

    public function __construct(private PublisherLedgerService $ledger) {}

    public function show(Request $request): JsonResponse
    {
        PublisherAccess::assertFinancialAccess($request->user());
        $publisher = PublisherAccess::publisher($request->user());
        $balances = $this->ledger->balances($publisher);

        $commission = PublisherCommission::query()
            ->where('publisher_id', $publisher->id)
            ->where('status', 'active')
            ->orderByDesc('version')
            ->first();

        $byAssignment = PublisherCampaignAssignment::query()
            ->where('publisher_id', $publisher->id)
            ->with(['program:id,title,pricing_model', 'community:id,code,name'])
            ->get()
            ->map(function (PublisherCampaignAssignment $a) {
                $credited = PublisherLedgerEntry::query()
                    ->where('campaign_assignment_id', $a->id)
                    ->whereIn('entry_type', ['credit', 'adjustment'])
                    ->whereIn('state', ['approved', 'payable', 'paid'])
                    ->sum('net_usd');
                $reversed = PublisherLedgerEntry::query()
                    ->where('campaign_assignment_id', $a->id)
                    ->where('entry_type', 'reversal')
                    ->sum('net_usd');

                return [
                    'assignment_id' => $a->id,
                    'program_title' => $a->program?->title,
                    'community_name' => $a->community?->name ?? 'All members',
                    'pricing_model' => $a->pricing_model,
                    'accepted_rate_usd' => $a->accepted_rate_usd,
                    'rate_version' => $a->rate_version,
                    'status' => $a->status,
                    'credited_net_usd' => round((float) $credited - abs((float) $reversed), 4),
                ];
            });

        $memberSettlementsPending = MemberSettlementRecord::query()
            ->where('publisher_id', $publisher->id)
            ->where('status', 'pending')
            ->count();

        $recent = PublisherLedgerEntry::query()
            ->where('publisher_id', $publisher->id)
            ->with(['community:id,code,name'])
            ->latest('id')
            ->limit(15)
            ->get()
            ->map(fn (PublisherLedgerEntry $e) => $this->serializeEntry($e));

        return $this->success([
            'balances' => $balances,
            'commission' => $commission ? [
                'commission_percent' => $commission->commission_percent,
                'currency' => $commission->currency,
                'version' => $commission->version,
                'status' => $commission->status,
                'effective_from' => optional($commission->effective_from)?->toIso8601String(),
            ] : null,
            'note' => 'Publisher commercial earnings only. Member/creator payouts are not included here.',
            'by_assignment' => $byAssignment,
            'member_settlements_pending' => $memberSettlementsPending,
            'recent_entries' => $recent,
        ]);
    }

    private function serializeEntry(PublisherLedgerEntry $e): array
    {
        return [
            'id' => $e->id,
            'entry_type' => $e->entry_type,
            'source' => $e->source,
            'state' => $e->state,
            'gross_usd' => $e->gross_usd,
            'platform_fee_usd' => $e->platform_fee_usd,
            'net_usd' => $e->net_usd,
            'currency' => $e->currency,
            'reference' => $e->reference,
            'community_name' => $e->community?->name,
            'reverses_ledger_id' => $e->reverses_ledger_id,
            'occurred_at' => optional($e->occurred_at)?->toIso8601String(),
            'approved_at' => optional($e->approved_at)?->toIso8601String(),
            'paid_at' => optional($e->paid_at)?->toIso8601String(),
            'created_at' => optional($e->created_at)?->toIso8601String(),
        ];
    }
}
