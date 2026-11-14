<?php

namespace App\Http\Controllers\Api\V1\Publisher;

use App\Http\Controllers\Controller;
use App\Models\NetworkMember;
use App\Services\Publishers\MemberActivityService;
use App\Services\Publishers\MembershipLifecycleService;
use App\Support\ApiResponse;
use App\Support\PublisherAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemberController extends Controller
{
    use ApiResponse;

    public function __construct(
        private MembershipLifecycleService $lifecycle,
        private MemberActivityService $activity,
    ) {}

    public function activity(Request $request, int $member): JsonResponse
    {
        $publisher = PublisherAccess::publisher($request->user());
        $row = NetworkMember::query()
            ->where('publisher_id', $publisher->id)
            ->where('id', $member)
            ->first();

        if (! $row || ! $this->inScope($request, $row)) {
            return $this->error('NOT_FOUND', 'Member not found.', 404);
        }

        return $this->success([
            'member' => $this->serialize($row),
            'activity' => $this->activity->summaryForMember($row),
            'note' => 'Activity counts only. Financial fields are not included.',
        ]);
    }

    public function remove(Request $request, int $member): JsonResponse
    {
        $publisher = PublisherAccess::publisher($request->user());
        $data = $request->validate([
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $row = NetworkMember::query()
            ->where('publisher_id', $publisher->id)
            ->where('id', $member)
            ->first();

        if (! $row || ! $this->inScope($request, $row)) {
            return $this->error('NOT_FOUND', 'Member not found.', 404);
        }

        $updated = $this->lifecycle->remove(
            $row,
            $publisher,
            $request->user(),
            $data['notes'] ?? null,
        );

        return $this->success([
            'member' => $this->serialize($updated),
            'message' => 'Member removed from the network. Formal release is still required before Creator eligibility.',
        ]);
    }

    public function release(Request $request, int $member): JsonResponse
    {
        // Formal release + settlement is owner-only (financial boundary).
        PublisherAccess::assertOwner(
            $request->user(),
            'Only the publisher owner can formally release memberships.',
        );
        $publisher = PublisherAccess::publisher($request->user());
        $data = $request->validate([
            'notes' => ['nullable', 'string', 'max:500'],
            'settle_pending' => ['sometimes', 'boolean'],
        ]);

        $row = NetworkMember::query()
            ->where('publisher_id', $publisher->id)
            ->where('id', $member)
            ->first();

        if (! $row) {
            return $this->error('NOT_FOUND', 'Member not found.', 404);
        }

        $updated = $this->lifecycle->release(
            $row,
            $publisher,
            $request->user(),
            $data['notes'] ?? null,
            (bool) ($data['settle_pending'] ?? false),
        );

        return $this->success([
            'member' => $this->serialize($updated),
            'message' => 'Membership formally released. Independent Creator registration may now be eligible.',
            'creator_eligible' => true,
        ]);
    }

    private function inScope(Request $request, NetworkMember $row): bool
    {
        $scopedIds = PublisherAccess::managedCommunityIds($request->user());
        if ($scopedIds === null) {
            return true;
        }
        if ($scopedIds === []) {
            return false;
        }

        return $row->communityMemberships()
            ->whereIn('community_id', $scopedIds)
            ->exists();
    }

    private function serialize(NetworkMember $m): array
    {
        return [
            'id' => $m->id,
            'display_name' => $m->display_name ?: $m->user?->name,
            'email' => $m->user?->email,
            'status' => $m->status,
            'joined_at' => optional($m->joined_at)?->toIso8601String(),
            'left_at' => optional($m->left_at)?->toIso8601String(),
            'released_at' => optional($m->released_at)?->toIso8601String(),
        ];
    }
}
