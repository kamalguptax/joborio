<?php

namespace App\Http\Controllers\Api\V1\Network;

use App\Http\Controllers\Controller;
use App\Models\NetworkMember;
use App\Models\PublisherCampaignAssignment;
use App\Services\Publishers\MemberActivityService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use ApiResponse;

    public function __construct(private MemberActivityService $activity) {}

    /**
     * Activity-only member dashboard. Never returns CPC, payouts, fees, or balances.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $member = NetworkMember::query()
            ->with([
                'publisher:id,code,display_name,username',
                'communityMemberships' => fn ($q) => $q->where('status', 'active'),
                'communityMemberships.community:id,code,name,status',
            ])
            ->where('user_id', $user->id)
            ->whereIn('status', ['active', 'removed'])
            ->orderByRaw("CASE status WHEN 'active' THEN 0 ELSE 1 END")
            ->first();

        if (! $member) {
            return $this->error('NOT_A_MEMBER', 'Network membership not found.', 404);
        }

        $isActive = $member->status === 'active';

        $communities = $member->communityMemberships
            ->map(fn ($cm) => [
                'id' => $cm->community?->id,
                'code' => $cm->community?->code,
                'name' => $cm->community?->name,
                'status' => $cm->community?->status,
            ])
            ->filter(fn ($c) => filled($c['name']))
            ->values();

        $communityIds = $communities->pluck('id')->filter()->all();

        $assignments = PublisherCampaignAssignment::query()
            ->where('publisher_id', $member->publisher_id)
            ->where('status', 'active')
            ->where(function ($q) use ($communityIds) {
                $q->whereNull('community_id');
                if ($communityIds) {
                    $q->orWhereIn('community_id', $communityIds);
                }
            })
            ->with('program:id,title,status,promotion_type,pricing_model')
            ->latest()
            ->get();

        // Member-safe payload: name + status only (no rates / fees / payouts).
        $assignedCampaigns = $assignments->map(fn (PublisherCampaignAssignment $a) => [
            'name' => $a->program?->title,
            'status' => $a->status === 'active' ? ($a->program?->status ?? 'active') : $a->status,
            'type' => $a->program?->pricing_model,
        ])->filter(fn ($c) => filled($c['name']))->values();

        return $this->success([
            'member' => [
                'name' => $member->display_name ?: $user->name,
                'status' => $isActive ? 'Active Member' : 'Left — awaiting release',
                'status_code' => $member->status,
                'joined_at' => optional($member->joined_at)?->toIso8601String(),
                'left_at' => optional($member->left_at)?->toIso8601String(),
                'released_at' => optional($member->released_at)?->toIso8601String(),
            ],
            'publisher' => [
                'name' => $member->publisher?->display_name,
                'code' => $member->publisher?->code,
            ],
            'communities' => $isActive ? $communities : collect(),
            'activity' => $this->activity->summaryForMember($member),
            'assigned_campaigns' => $isActive ? $assignedCampaigns : collect(),
            'lifecycle' => [
                'can_leave' => $isActive,
                'creator_eligible' => false,
                'message' => $isActive
                    ? null
                    : 'You left this network. Historical activity is preserved. Independent Creator registration stays blocked until the publisher formally releases your membership.',
            ],
        ]);
    }
}
