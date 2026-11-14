<?php

namespace App\Http\Controllers\Api\V1\Creator;

use App\Http\Controllers\Controller;
use App\Models\EarningLedger;
use App\Services\Payouts\TransactionHistoryService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    use ApiResponse;

    public function __construct(private TransactionHistoryService $history) {}

    public function index(Request $request): JsonResponse
    {
        $creator = $request->user()->creator;
        if (! $creator) {
            return $this->error('NOT_A_CREATOR', 'Creator profile not found.', 404);
        }

        $page = $this->history->paginate(
            $this->history->forCreator($creator->id),
            (int) $request->input('page', 1),
            (int) $request->input('per_page', 40),
        );

        $totals = EarningLedger::query()->where('creator_id', $creator->id);

        return $this->success($page['items'], 200, [
            'current_page' => $page['current_page'],
            'last_page' => $page['last_page'],
            'total' => $page['total'],
            'pending_usd' => round((float) (clone $totals)->where('state', 'pending')->sum('net_usd'), 4),
            'approved_usd' => round((float) (clone $totals)->where('state', 'approved')->sum('net_usd'), 4),
            'payable_usd' => round((float) (clone $totals)->where('state', 'payable')->sum('net_usd'), 4),
            'paid_usd' => round((float) (clone $totals)->where('state', 'paid')->sum('net_usd'), 4),
        ]);
    }
}
