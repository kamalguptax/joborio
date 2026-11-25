<?php

namespace App\Http\Controllers\Api\V1\Creator;

use App\Http\Controllers\Controller;
use App\Services\Payments\AccountWalletService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    use ApiResponse;

    public function __construct(private AccountWalletService $wallets) {}

    public function show(Request $request): JsonResponse
    {
        $creator = $request->user()->creator;
        if (! $creator) {
            return $this->error('NOT_A_CREATOR', 'Creator profile not found.', 404);
        }

        return $this->success($this->wallets->forCreator($creator));
    }
}
