<?php

namespace App\Http\Controllers\Api\V1\Network;

use App\Http\Controllers\Controller;
use App\Models\NetworkMember;
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
        $member = NetworkMember::query()
            ->where('user_id', $request->user()->id)
            ->latest('id')
            ->first();

        if (! $member) {
            return $this->error('NOT_A_MEMBER', 'Network member profile not found.', 404);
        }

        return $this->success($this->wallets->forNetworkMember($member));
    }
}
