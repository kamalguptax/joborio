<?php

namespace App\Services\Creators;

use App\Models\Creator;
use App\Models\EarningLedger;
use Illuminate\Support\Facades\DB;

class TopPerformersService
{
    /**
     * Rank creators by earnings (not clicks) so the dashboard shows a performers list.
     *
     * @return array{
     *   period_days: int,
     *   leaders: list<array{rank: int, handle: string, trust_tier: string|null, verified_clicks: int, earnings_usd: float, is_you?: bool}>,
     *   your_rank: int|null,
     *   your_clicks: int,
     *   your_earnings_usd: float
     * }
     */
    public function forPeriod(int $days = 30, ?int $viewerCreatorId = null, int $limit = 10): array
    {
        $since = now()->subDays(max(1, $days));

        $earnQuery = EarningLedger::query()
            ->select('creator_id', DB::raw('COALESCE(SUM(net_usd), 0) as earnings_usd'))
            ->whereIn('state', ['pending', 'approved', 'payable', 'paid'])
            ->whereNotIn('earning_type', ['ref_bonus', 'ref_override'])
            ->groupBy('creator_id')
            ->orderByDesc('earnings_usd')
            ->limit(max($limit * 5, 50));

        $periodRows = (clone $earnQuery)
            ->where('created_at', '>=', $since)
            ->get();

        // Fall back to all-time earnings so the board is not empty.
        $usingAllTime = $periodRows->isEmpty();
        $earnRows = $usingAllTime
            ? $earnQuery->get()->keyBy('creator_id')
            : $periodRows->keyBy('creator_id');

        $creatorIds = $earnRows->keys()->values();

        $creators = Creator::query()
            ->whereIn('id', $creatorIds)
            ->whereNotNull('onboarding_completed_at')
            ->get(['id', 'handle', 'trust_tier'])
            ->keyBy('id');

        $scored = [];
        foreach ($creatorIds as $id) {
            $creator = $creators->get($id);
            if (! $creator?->handle) {
                continue;
            }
            $earnings = round((float) ($earnRows->get($id)?->earnings_usd ?? 0), 2);
            if ($earnings <= 0) {
                continue;
            }
            $scored[] = [
                'creator_id' => (int) $id,
                'handle' => $creator->handle,
                'trust_tier' => $creator->trust_tier,
                'earnings_usd' => $earnings,
            ];
        }

        usort($scored, fn ($a, $b) => $b['earnings_usd'] <=> $a['earnings_usd']);

        $ranked = [];
        $yourRank = null;
        foreach ($scored as $index => $row) {
            $rank = $index + 1;
            if ($viewerCreatorId !== null && (int) $row['creator_id'] === $viewerCreatorId) {
                $yourRank = $rank;
            }
            if ($rank <= $limit) {
                $ranked[] = [
                    'rank' => $rank,
                    'handle' => $row['handle'],
                    'trust_tier' => $row['trust_tier'],
                    'verified_clicks' => 0,
                    'earnings_usd' => $row['earnings_usd'],
                    'is_you' => $viewerCreatorId !== null && (int) $row['creator_id'] === $viewerCreatorId,
                ];
            }
        }

        $yourEarnings = 0.0;
        if ($viewerCreatorId) {
            $yourEarnings = round((float) ($earnRows->get($viewerCreatorId)?->earnings_usd ?? 0), 2);
            if ($yourRank === null) {
                foreach ($scored as $index => $row) {
                    if ((int) $row['creator_id'] === $viewerCreatorId) {
                        $yourRank = $index + 1;
                        break;
                    }
                }
            }
        }

        return [
            'period_days' => $usingAllTime ? 0 : $days,
            'leaders' => $ranked,
            'your_rank' => $yourRank,
            'your_clicks' => 0,
            'your_earnings_usd' => $yourEarnings,
        ];
    }
}
