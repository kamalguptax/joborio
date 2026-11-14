<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Niche;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Schema;

class NicheController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $query = Niche::query();
        if (Schema::hasColumn('niches', 'sort_order')) {
            $query->orderBy('sort_order');
        }

        return $this->success($query->orderBy('name')->get());
    }
}
