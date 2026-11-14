<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\Earnings\CampaignEarningsService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class CampaignEarningsController extends Controller
{
    use ApiResponse;

    public function __construct(private CampaignEarningsService $earnings) {}

    public function index(): JsonResponse
    {
        return $this->success($this->earnings->adminOverview());
    }
}
