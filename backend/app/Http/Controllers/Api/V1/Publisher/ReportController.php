<?php

namespace App\Http\Controllers\Api\V1\Publisher;

use App\Http\Controllers\Controller;
use App\Models\PublisherCampaignAssignment;
use App\Models\PublisherInvitation;
use App\Services\Publishers\PublisherLedgerService;
use App\Support\ApiResponse;
use App\Support\PublisherAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    use ApiResponse;

    public function __construct(private PublisherLedgerService $ledger) {}

    public function show(Request $request): JsonResponse
    {
        $membership = PublisherAccess::membership($request->user());
        $publisher = $membership->publisher;
        $isOwner = $membership->isOwner();
        $scopedIds = PublisherAccess::managedCommunityIds($request->user());

        $balances = $isOwner
            ? $this->ledger->balances($publisher)
            : [
                'entry_count' => 0,
                'lifetime_net_usd' => 0,
            ];

        $communities = PublisherAccess::communitiesQuery($request->user())
            ->withCount(['members as active_members_count' => fn ($q) => $q->where('status', 'active')])
            ->get(['id', 'code', 'name', 'status', 'category']);

        $membersQuery = $publisher->networkMembers();
        if ($scopedIds !== null) {
            if ($scopedIds === []) {
                $membersByStatus = collect();
            } else {
                $membersByStatus = $membersQuery
                    ->whereHas('communityMemberships', fn ($q) => $q->whereIn('community_id', $scopedIds))
                    ->select('status', DB::raw('count(*) as total'))
                    ->groupBy('status')
                    ->pluck('total', 'status');
            }
        } else {
            $membersByStatus = $membersQuery
                ->select('status', DB::raw('count(*) as total'))
                ->groupBy('status')
                ->pluck('total', 'status');
        }

        $invitesQuery = PublisherInvitation::query()->where('publisher_id', $publisher->id);
        if ($scopedIds !== null) {
            $invitesQuery->whereIn('community_id', $scopedIds);
        }
        $invitesByStatus = $invitesQuery
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $assignmentsQuery = PublisherCampaignAssignment::query()
            ->where('publisher_id', $publisher->id)
            ->with(['program:id,title,pricing_model,status', 'community:id,code,name']);
        if ($scopedIds !== null) {
            $assignmentsQuery->whereIn('community_id', $scopedIds);
        }

        $assignments = $assignmentsQuery
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn (PublisherCampaignAssignment $a) => [
                'id' => $a->id,
                'status' => $a->status,
                'pricing_model' => $isOwner ? $a->pricing_model : null,
                'accepted_rate_usd' => $isOwner ? $a->accepted_rate_usd : null,
                'program_title' => $a->program?->title,
                'community_name' => $a->community?->name ?? 'All members',
            ]);

        $activeAssignmentsQuery = PublisherCampaignAssignment::query()
            ->where('publisher_id', $publisher->id)
            ->where('status', 'active');
        if ($scopedIds !== null) {
            $activeAssignmentsQuery->whereIn('community_id', $scopedIds);
        }

        return $this->success([
            'summary' => [
                'communities_total' => $communities->count(),
                'communities_active' => $communities->where('status', 'active')->count(),
                'members_active' => (int) ($membersByStatus['active'] ?? 0),
                'members_total' => (int) $membersByStatus->sum(),
                'invites_pending' => (int) ($invitesByStatus['pending'] ?? 0),
                'invites_accepted' => (int) ($invitesByStatus['accepted'] ?? 0),
                'campaigns_assigned_active' => $activeAssignmentsQuery->count(),
                'confirmed_actions' => $isOwner ? $balances['entry_count'] : 0,
                'estimated_publisher_revenue_usd' => $isOwner ? $balances['lifetime_net_usd'] : 0,
            ],
            'members_by_status' => $membersByStatus,
            'invites_by_status' => $invitesByStatus,
            'communities' => $communities->map(fn ($c) => [
                'id' => $c->id,
                'code' => $c->code,
                'name' => $c->name,
                'status' => $c->status,
                'category' => $c->category,
                'active_members' => (int) $c->active_members_count,
            ]),
            'assignments' => $assignments,
            'membership_role' => $membership->role,
            'financials_visible' => $isOwner,
        ]);
    }
}
