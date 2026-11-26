<?php

namespace App\Http\Controllers\Api\V1\Creator;

use App\Http\Controllers\Controller;
use App\Services\Referrals\ReferralService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReferralController extends Controller
{
    use ApiResponse;

    public function __construct(private ReferralService $referrals) {}

    public function show(Request $request): JsonResponse
    {
        $creator = $request->user()->creator;
        if (! $creator) {
            return $this->error('NOT_A_CREATOR', 'Creator profile not found.', 404);
        }

        return $this->success($this->referrals->dashboard($creator));
    }

    /** One-time attach if signup created the creator before referral was applied. */
    public function claim(Request $request): JsonResponse
    {
        $creator = $request->user()->creator;
        if (! $creator) {
            return $this->error('NOT_A_CREATOR', 'Creator profile not found.', 404);
        }

        $data = $request->validate([
            'referral_code' => ['required', 'string', 'max:32'],
        ]);

        if ($creator->referred_by_creator_id) {
            return $this->success([
                'attached' => true,
                'already' => true,
                'referred_by_creator_id' => $creator->referred_by_creator_id,
            ]);
        }

        $this->referrals->attachReferrerOnSignup($creator, $data['referral_code']);
        $creator->refresh();

        return $this->success([
            'attached' => (bool) $creator->referred_by_creator_id,
            'already' => false,
            'referred_by_creator_id' => $creator->referred_by_creator_id,
        ]);
    }

    public function notify(Request $request): JsonResponse
    {
        $creator = $request->user()->creator;
        if (! $creator) {
            return $this->error('NOT_A_CREATOR', 'Creator profile not found.', 404);
        }

        $data = $request->validate([
            'creator_ids' => ['required', 'array', 'min:1', 'max:50'],
            'creator_ids.*' => ['integer', 'min:1'],
            'message' => ['nullable', 'string', 'max:500'],
        ]);

        $result = $this->referrals->notifyReferred(
            $creator,
            $data['creator_ids'],
            $data['message'] ?? null,
        );

        return $this->success($result);
    }

    public function share(Request $request): JsonResponse
    {
        $creator = $request->user()->creator;
        if (! $creator) {
            return $this->error('NOT_A_CREATOR', 'Creator profile not found.', 404);
        }

        $count = $this->referrals->recordShare($creator);

        return $this->success(['shares' => $count]);
    }
}
