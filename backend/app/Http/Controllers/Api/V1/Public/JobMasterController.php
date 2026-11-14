<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Services\JobMasters\JobMasterService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class JobMasterController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly JobMasterService $masters) {}

    public function filters(): JsonResponse
    {
        return $this->success($this->masters->publicFilters());
    }
}
