<?php

namespace App\Http\Controllers\Api\V1\Publisher;

use App\Http\Controllers\Controller;
use App\Services\Payments\AccountWalletService;
use App\Support\ApiResponse;
use App\Support\PublisherAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    use ApiResponse;

    public function __construct(private AccountWalletService $wallets) {}

    public function show(Request $request): JsonResponse
    {
        PublisherAccess::assertFinancialAccess($request->user());
        $publisher = PublisherAccess::publisher($request->user());

        return $this->success($this->wallets->forPublisher($publisher));
    }
}
