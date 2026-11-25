<?php

namespace App\Http\Controllers\Api\V1\Publisher;

use App\Http\Controllers\Controller;
use App\Models\MemberSettlementRecord;
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

        $row->loadMissing([
            'user:id,name,email',
            'communityMemberships' => fn ($q) => $q->whereIn('status', ['active', 'ended', 'released']),
            'communityMemberships.community:id,code,name',
        ]);

        $recent = $row->activityEvents()
            ->orderByDesc('occurred_at')
            ->limit(25)
            ->get([
                'id',
                'activity_type',
                'status',
                'tracking_id',
                'campaign_assignment_id',
                'meta',
                'occurred_at',
            ])
            ->map(fn ($e) => [
                'id' => $e->id,
                'activity_type' => $e->activity_type,
                'status' => $e->status,
                'tracking_id' => $e->tracking_id,
                'campaign_assignment_id' => $e->campaign_assignment_id,
                'title' => is_array($e->meta) ? ($e->meta['title'] ?? null) : null,
                'reference_id' => is_array($e->meta) ? ($e->meta['reference_id'] ?? null) : null,
                'source' => is_array($e->meta) ? ($e->meta['source'] ?? null) : null,
                'occurred_at' => optional($e->occurred_at)?->toIso8601String(),
            ])
            ->values();

        $activity = $this->activity->summaryForMember($row);
        $canViewEarnings = PublisherAccess::membership($request->user())->isOwner();
        $earnings = null;
        $settlements = [];
        if ($canViewEarnings) {
            $settlementRows = MemberSettlementRecord::query()
                ->where('publisher_id', $publisher->id)
                ->where('network_member_id', $row->id)
                ->whereIn('status', ['pending', 'settled'])
                ->with('community:id,code,name')
                ->latest('id')
                ->limit(40)
                ->get();

            $settled = (float) MemberSettlementRecord::query()
                ->where('publisher_id', $publisher->id)
                ->where('network_member_id', $row->id)
                ->where('status', 'settled')
                ->sum('amount_usd');
            $pending = (float) MemberSettlementRecord::query()
                ->where('publisher_id', $publisher->id)
                ->where('network_member_id', $row->id)
                ->where('status', 'pending')
                ->sum('amount_usd');
            $earnings = [
                'settled_usd' => round($settled, 4),
                'pending_usd' => round($pending, 4),
                'total_usd' => round($settled + $pending, 4),
                'currency' => 'USD',
            ];
            $settlements = $settlementRows->map(fn (MemberSettlementRecord $s) => [
                'id' => $s->id,
                'status' => $s->status,
                'amount_usd' => round((float) $s->amount_usd, 4),
                'currency' => $s->currency ?? 'USD',
                'period_label' => $s->period_label,
                'community_name' => $s->community?->name,
                'settled_at' => optional($s->settled_at)?->toIso8601String(),
                'created_at' => optional($s->created_at)?->toIso8601String(),
                'notes' => $s->notes,
            ])->values()->all();
        }

        $byCommunity = [];
        foreach ($row->communityMemberships as $cm) {
            if (! $cm->community) {
                continue;
            }
            $cid = (int) $cm->community_id;
            $communitySettled = 0.0;
            $communityPending = 0.0;
            if ($canViewEarnings) {
                $communitySettled = (float) MemberSettlementRecord::query()
                    ->where('publisher_id', $publisher->id)
                    ->where('network_member_id', $row->id)
                    ->where('community_id', $cid)
                    ->where('status', 'settled')
                    ->sum('amount_usd');
                $communityPending = (float) MemberSettlementRecord::query()
                    ->where('publisher_id', $publisher->id)
                    ->where('network_member_id', $row->id)
                    ->where('community_id', $cid)
                    ->where('status', 'pending')
                    ->sum('amount_usd');
            }
            $byCommunity[] = [
                'id' => $cm->community->id,
                'code' => $cm->community->code,
                'name' => $cm->community->name,
                'status' => $cm->status,
                'settled_usd' => $canViewEarnings ? round($communitySettled, 4) : null,
                'pending_usd' => $canViewEarnings ? round($communityPending, 4) : null,
                'total_usd' => $canViewEarnings
                    ? round($communitySettled + $communityPending, 4)
                    : null,
            ];
        }

        return $this->success([
            'member' => array_merge($this->serialize($row), [
                'communities' => $row->communityMemberships
                    ->filter(fn ($cm) => $cm->community)
                    ->map(fn ($cm) => [
                        'id' => $cm->community->id,
                        'code' => $cm->community->code,
                        'name' => $cm->community->name,
                        'status' => $cm->status,
                    ])
                    ->values()
                    ->all(),
            ]),
            'activity' => $activity,
            'dashboard' => [
                'total_clicks' => $activity['clicks_total'],
                'valid_clicks' => $activity['clicks_valid'],
                'ppr' => $activity['signups'],
                'applications' => $activity['applications'],
                'leads' => $activity['leads'],
                'conversions' => $activity['conversions'],
                'actions_approved' => $activity['actions_approved'],
                'actions_pending' => $activity['actions_pending'],
                'total_earning_usd' => $earnings['total_usd'] ?? null,
                'settled_usd' => $earnings['settled_usd'] ?? null,
                'pending_usd' => $earnings['pending_usd'] ?? null,
            ],
            'earnings' => $earnings,
            'settlements' => $settlements,
            'by_community' => $byCommunity,
            'recent' => $recent,
            'can_view_earnings' => $canViewEarnings,
            'note' => $canViewEarnings
                ? 'Member dashboard with activity and settlement earnings.'
                : 'Activity counts only. Financial fields are hidden for managers.',
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
