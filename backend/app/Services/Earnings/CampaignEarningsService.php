<?php

namespace App\Services\Earnings;

use App\Models\EarningLedger;
use App\Models\Program;
use App\Services\Platform\PlatformSettingsService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CampaignEarningsService
{
    public function __construct(private PlatformSettingsService $settings) {}

    /**
     * @return array{campaigns: list<array<string, mixed>>, organic: array<string, mixed>, totals: array<string, mixed>, currency: string, currency_symbol: string}
     */
    public function adminOverview(): array
    {
        $money = $this->settings->moneyMeta();
        $byProgram = $this->aggregateQuery(null);
        $programs = Program::query()
            ->with(['employer.user:id,name', 'employer:id,user_id,company_name'])
            ->get()
            ->keyBy('id');

        $campaigns = [];
        foreach ($programs as $program) {
            $row = $byProgram->get($program->id);
            $campaigns[] = $this->formatCampaignRow($program, $row);
        }

        usort($campaigns, fn ($a, $b) => $b['gross_usd'] <=> $a['gross_usd']);

        $organic = $this->emptyBucket();
        foreach ($byProgram as $programId => $row) {
            if ($programId === null || $programId === '' || (int) $programId === 0) {
                $organic = $this->mergeBucket($organic, $row);
            }
        }

        $totals = $this->emptyBucket();
        foreach ($campaigns as $campaign) {
            $totals = $this->mergeBucket($totals, $campaign);
        }
        $totals = $this->mergeBucket($totals, $organic);

        return [
            'campaigns' => $campaigns,
            'organic' => [
                'id' => null,
                'title' => 'Organic / XML jobs',
                'pricing_model' => 'ppc',
                'status' => 'n/a',
                'employer' => null,
                'budget_total_usd' => null,
                'budget_spent_usd' => null,
                ...$organic,
            ],
            'totals' => $totals,
            'currency' => $money['code'],
            'currency_symbol' => $money['symbol'],
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function forCreator(int $creatorId): array
    {
        $byProgram = $this->aggregateQuery($creatorId);
        $programIds = $byProgram->keys()->filter(fn ($id) => $id !== null && (int) $id > 0)->all();
        $programs = Program::query()->whereIn('id', $programIds)->get()->keyBy('id');

        $rows = [];
        foreach ($byProgram as $programId => $bucket) {
            if ($programId === null || (int) $programId === 0) {
                $rows[] = [
                    'id' => null,
                    'title' => 'Organic / XML jobs',
                    'pricing_model' => 'ppc',
                    'status' => 'n/a',
                    ...$this->normalizeBucket($bucket),
                ];
                continue;
            }
            $program = $programs->get((int) $programId);
            $rows[] = [
                'id' => (int) $programId,
                'title' => $program?->title ?? "Campaign #{$programId}",
                'pricing_model' => $program?->pricing_model ?? 'ppc',
                'status' => $program?->status ?? 'unknown',
                ...$this->normalizeBucket($bucket),
            ];
        }

        usort($rows, fn ($a, $b) => $b['gross_usd'] <=> $a['gross_usd']);

        return $rows;
    }

    /**
     * @return Collection<int|string|null, object>
     */
    private function aggregateQuery(?int $creatorId): Collection
    {
        $query = EarningLedger::query()
            ->leftJoin('attribution_events', 'attribution_events.id', '=', 'earning_ledgers.attribution_event_id')
            ->leftJoin('listings', 'listings.id', '=', 'attribution_events.listing_id')
            ->selectRaw('listings.program_id as program_id')
            ->selectRaw('COUNT(earning_ledgers.id) as earning_count')
            ->selectRaw('COALESCE(SUM(earning_ledgers.gross_usd), 0) as gross_usd')
            ->selectRaw('COALESCE(SUM(earning_ledgers.platform_fee_usd), 0) as platform_fee_usd')
            ->selectRaw('COALESCE(SUM(earning_ledgers.net_usd), 0) as net_usd')
            ->selectRaw("COALESCE(SUM(CASE WHEN earning_ledgers.state = 'pending' THEN earning_ledgers.net_usd ELSE 0 END), 0) as pending_usd")
            ->selectRaw("COALESCE(SUM(CASE WHEN earning_ledgers.state = 'approved' THEN earning_ledgers.net_usd ELSE 0 END), 0) as approved_usd")
            ->selectRaw("COALESCE(SUM(CASE WHEN earning_ledgers.state = 'payable' THEN earning_ledgers.net_usd ELSE 0 END), 0) as payable_usd")
            ->selectRaw("COALESCE(SUM(CASE WHEN earning_ledgers.state = 'paid' THEN earning_ledgers.net_usd ELSE 0 END), 0) as paid_usd")
            ->selectRaw("COALESCE(SUM(CASE WHEN earning_ledgers.earning_type = 'ppc' THEN earning_ledgers.net_usd ELSE 0 END), 0) as ppc_usd")
            ->selectRaw("COALESCE(SUM(CASE WHEN earning_ledgers.earning_type = 'ppr' THEN earning_ledgers.net_usd ELSE 0 END), 0) as ppr_usd")
            ->selectRaw("COALESCE(SUM(CASE WHEN earning_ledgers.earning_type = 'ppa' THEN earning_ledgers.net_usd ELSE 0 END), 0) as ppa_usd")
            ->groupBy('listings.program_id');

        if ($creatorId !== null) {
            $query->where('earning_ledgers.creator_id', $creatorId);
        }

        return $query->get()->keyBy(fn ($row) => $row->program_id);
    }

    /**
     * @param  object|array<string, mixed>|null  $row
     * @return array<string, mixed>
     */
    private function formatCampaignRow(Program $program, $row): array
    {
        $bucket = $this->normalizeBucket($row);

        return [
            'id' => $program->id,
            'title' => $program->title,
            'pricing_model' => $program->pricing_model,
            'status' => $program->status,
            'trial_without_ip' => $program->isTrialWithoutIp(),
            'employer' => $program->employer?->company_name
                ?? $program->employer?->user?->name
                ?? null,
            'budget_total_usd' => (float) $program->budget_total_usd,
            'budget_spent_usd' => (float) $program->budget_spent_usd,
            ...$bucket,
        ];
    }

    /**
     * @param  object|array<string, mixed>|null  $row
     * @return array<string, float|int>
     */
    private function normalizeBucket($row): array
    {
        $get = function (string $key) use ($row): float {
            if (is_array($row)) {
                return (float) ($row[$key] ?? 0);
            }
            if (is_object($row)) {
                return (float) ($row->{$key} ?? 0);
            }

            return 0.0;
        };

        return [
            'earning_count' => (int) $get('earning_count'),
            'gross_usd' => round($get('gross_usd'), 4),
            'platform_fee_usd' => round($get('platform_fee_usd'), 4),
            'net_usd' => round($get('net_usd'), 4),
            'pending_usd' => round($get('pending_usd'), 4),
            'approved_usd' => round($get('approved_usd'), 4),
            'payable_usd' => round($get('payable_usd'), 4),
            'paid_usd' => round($get('paid_usd'), 4),
            'ppc_usd' => round($get('ppc_usd'), 4),
            'ppr_usd' => round($get('ppr_usd'), 4),
            'ppa_usd' => round($get('ppa_usd'), 4),
        ];
    }

    /**
     * @return array<string, float|int>
     */
    private function emptyBucket(): array
    {
        return $this->normalizeBucket(null);
    }

    /**
     * @param  array<string, float|int>  $a
     * @param  array<string, mixed>  $b
     * @return array<string, float|int>
     */
    private function mergeBucket(array $a, $b): array
    {
        $n = $this->normalizeBucket($b);

        return [
            'earning_count' => (int) $a['earning_count'] + (int) $n['earning_count'],
            'gross_usd' => round((float) $a['gross_usd'] + (float) $n['gross_usd'], 4),
            'platform_fee_usd' => round((float) $a['platform_fee_usd'] + (float) $n['platform_fee_usd'], 4),
            'net_usd' => round((float) $a['net_usd'] + (float) $n['net_usd'], 4),
            'pending_usd' => round((float) $a['pending_usd'] + (float) $n['pending_usd'], 4),
            'approved_usd' => round((float) $a['approved_usd'] + (float) $n['approved_usd'], 4),
            'payable_usd' => round((float) $a['payable_usd'] + (float) $n['payable_usd'], 4),
            'paid_usd' => round((float) $a['paid_usd'] + (float) $n['paid_usd'], 4),
            'ppc_usd' => round((float) $a['ppc_usd'] + (float) $n['ppc_usd'], 4),
            'ppr_usd' => round((float) $a['ppr_usd'] + (float) $n['ppr_usd'], 4),
            'ppa_usd' => round((float) $a['ppa_usd'] + (float) $n['ppa_usd'], 4),
        ];
    }
}
