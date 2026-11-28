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
use App\Support\PublisherCommissionSplit;
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

        $assignments = PublisherCampaignAssignment::query()
            ->where('publisher_id', $publisher->id)
            ->with(['program:id,title,pricing_model', 'community:id,code,name'])
            ->get();

        $assignmentIds = $assignments->pluck('id')->all();
        $ledgerByAssignment = collect();
        if ($assignmentIds !== []) {
            $ledgerByAssignment = PublisherLedgerEntry::query()
                ->where('publisher_id', $publisher->id)
                ->whereIn('campaign_assignment_id', $assignmentIds)
                ->with(['community:id,code,name', 'campaignAssignment.program:id,title,pricing_model'])
                ->orderByDesc('id')
                ->get()
                ->groupBy('campaign_assignment_id');
        }

        $byAssignment = $assignments->map(function (PublisherCampaignAssignment $a) use ($ledgerByAssignment) {
            $entries = $ledgerByAssignment->get($a->id, collect());
            $credited = (float) $entries
                ->whereIn('entry_type', ['credit', 'adjustment'])
                ->whereIn('state', ['approved', 'payable', 'paid'])
                ->sum('net_usd');
            $reversed = (float) $entries
                ->where('entry_type', 'reversal')
                ->sum('net_usd');
            $pending = (float) $entries
                ->whereIn('entry_type', ['credit', 'adjustment'])
                ->where('state', 'pending')
                ->sum('net_usd');
            $paid = (float) $entries
                ->whereIn('entry_type', ['credit', 'adjustment'])
                ->where('state', 'paid')
                ->sum('net_usd');
            $payable = (float) $entries
                ->whereIn('entry_type', ['credit', 'adjustment'])
                ->where('state', 'payable')
                ->sum('net_usd');

            $model = strtolower((string) ($a->pricing_model ?: $a->program?->pricing_model ?: 'other'));
            if (! in_array($model, ['ppc', 'ppr', 'ppa', 'ppe'], true)) {
                $model = 'other';
            }

            return [
                'assignment_id' => $a->id,
                'program_title' => $a->program?->title,
                'community_name' => $a->community?->name ?? 'All members',
                'pricing_model' => $model,
                'accepted_rate_usd' => $a->accepted_rate_usd,
                'rate_version' => $a->rate_version,
                'status' => $a->status,
                'credited_net_usd' => round($credited - abs($reversed), 4),
                'pending_usd' => round($pending, 4),
                'payable_usd' => round($payable, 4),
                'paid_usd' => round($paid, 4),
                'entries' => $entries->take(20)->map(fn (PublisherLedgerEntry $e) => $this->serializeEntry($e))->values()->all(),
            ];
        });

        $byModel = $this->aggregateByPricingModel($byAssignment->all());

        $memberSettlementsPending = MemberSettlementRecord::query()
            ->where('publisher_id', $publisher->id)
            ->where('status', 'pending')
            ->count();

        $recent = PublisherLedgerEntry::query()
            ->where('publisher_id', $publisher->id)
            ->with([
                'community:id,code,name',
                'campaignAssignment:id,pricing_model,program_id',
                'campaignAssignment.program:id,title,pricing_model',
            ])
            ->latest('id')
            ->limit(80)
            ->get()
            ->map(fn (PublisherLedgerEntry $e) => $this->serializeEntry($e));

        $publisherPct = $commission
            ? (float) $commission->commission_percent
            : PublisherCommissionSplit::PUBLISHER_MIN_PERCENT;

        return $this->success([
            'balances' => $balances,
            'commission' => $commission ? [
                'commission_percent' => $commission->commission_percent,
                'currency' => $commission->currency,
                'version' => $commission->version,
                'status' => $commission->status,
                'effective_from' => optional($commission->effective_from)?->toIso8601String(),
            ] : null,
            'platform_fee_percent' => PublisherCommissionSplit::PLATFORM_FEE_PERCENT,
            'permitted_percentages' => PublisherCommissionSplit::permittedPublisherPercents(),
            'example_split' => PublisherCommissionSplit::split(10, $publisherPct),
            'note' => 'Earning: Upclift keeps 30% platform fee. Your commission is 10–15% of the remaining creator pool. Member/creator payouts are separate.',
            'by_model' => $byModel,
            'by_assignment' => $byAssignment,
            'member_settlements_pending' => $memberSettlementsPending,
            'recent_entries' => $recent,
        ]);
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @return list<array{pricing_model: string, label: string, credited_net_usd: float, pending_usd: float, assignment_count: int}>
     */
    private function aggregateByPricingModel(array $rows): array
    {
        $labels = [
            'ppc' => 'PPC · Pay Per Click',
            'ppr' => 'PPR · Pay Per Registration',
            'ppa' => 'PPA · Pay Per Action',
            'ppe' => 'PPE · Pay Per Engagement',
            'other' => 'Other',
        ];

        $bucket = [];
        foreach (array_keys($labels) as $key) {
            $bucket[$key] = [
                'pricing_model' => $key,
                'label' => $labels[$key],
                'credited_net_usd' => 0.0,
                'pending_usd' => 0.0,
                'assignment_count' => 0,
            ];
        }

        foreach ($rows as $row) {
            $model = strtolower((string) ($row['pricing_model'] ?? 'other'));
            if (! isset($bucket[$model])) {
                $model = 'other';
            }
            $bucket[$model]['credited_net_usd'] += (float) ($row['credited_net_usd'] ?? 0);
            $bucket[$model]['pending_usd'] += (float) ($row['pending_usd'] ?? 0);
            $bucket[$model]['assignment_count']++;
        }

        foreach ($bucket as &$item) {
            $item['credited_net_usd'] = round($item['credited_net_usd'], 4);
            $item['pending_usd'] = round($item['pending_usd'], 4);
        }
        unset($item);

        // Always return PPC/PPE/etc. so the UI can show empty cards.
        return array_values($bucket);
    }

    private function serializeEntry(PublisherLedgerEntry $e): array
    {
        $assignment = $e->relationLoaded('campaignAssignment') ? $e->campaignAssignment : null;
        $model = strtolower((string) ($assignment?->pricing_model
            ?: $assignment?->program?->pricing_model
            ?: 'other'));
        if (! in_array($model, ['ppc', 'ppr', 'ppa', 'ppe'], true)) {
            $model = $assignment ? 'other' : null;
        }

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
            'campaign_assignment_id' => $e->campaign_assignment_id,
            'program_title' => $assignment?->program?->title,
            'pricing_model' => $model,
            'reverses_ledger_id' => $e->reverses_ledger_id,
            'occurred_at' => optional($e->occurred_at)?->toIso8601String(),
            'approved_at' => optional($e->approved_at)?->toIso8601String(),
            'paid_at' => optional($e->paid_at)?->toIso8601String(),
            'created_at' => optional($e->created_at)?->toIso8601String(),
        ];
    }
}
