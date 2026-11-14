<?php

namespace App\Http\Controllers\Api\V1\Network;

use App\Http\Controllers\Controller;
use App\Models\NetworkMember;
use App\Services\Publishers\MembershipLifecycleService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MembershipController extends Controller
{
    use ApiResponse;

    public function __construct(private MembershipLifecycleService $lifecycle) {}

    public function leave(Request $request): JsonResponse
    {
        $data = $request->validate([
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $member = NetworkMember::query()
            ->where('user_id', $request->user()->id)
            ->where('status', 'active')
            ->first();

        if (! $member) {
            return $this->error('NOT_A_MEMBER', 'No active network membership to leave.', 404);
        }

        $updated = $this->lifecycle->leave(
            $member,
            $request->user(),
            $data['notes'] ?? null,
        );

        return $this->success([
            'member' => [
                'id' => $updated->id,
                'status' => $updated->status,
                'left_at' => optional($updated->left_at)?->toIso8601String(),
                'released_at' => optional($updated->released_at)?->toIso8601String(),
                'publisher' => [
                    'name' => $updated->publisher?->display_name,
                    'code' => $updated->publisher?->code,
                ],
            ],
            'message' => 'You left the publisher network. Historical activity is preserved. Independent Creator registration stays blocked until the publisher formally releases your membership.',
            'creator_eligible' => false,
        ]);
    }
}
