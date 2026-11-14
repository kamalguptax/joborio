<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Services\Creators\TopPerformersService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class LeaderboardController extends Controller
{
    use ApiResponse;

    public function index(TopPerformersService $topPerformers): JsonResponse
    {
        $board = $topPerformers->forPeriod(30, null, 25);

        $leaderboard = collect($board['leaders'])->map(fn (array $row) => [
            'rank' => $row['rank'],
            'handle' => $row['handle'],
            'trust_tier' => $row['trust_tier'],
            'verified_clicks_30d' => $row['verified_clicks'],
            'earnings_usd_30d' => $row['earnings_usd'],
        ])->values();

        return $this->success([
            'period_days' => $board['period_days'],
            'leaderboard' => $leaderboard,
        ]);
    }
}
