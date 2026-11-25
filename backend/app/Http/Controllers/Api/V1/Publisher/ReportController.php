<?php

namespace App\Http\Controllers\Api\V1\Publisher;

use App\Http\Controllers\Controller;
use App\Models\MemberActivityEvent;
use App\Models\PublisherCampaignAssignment;
use App\Models\PublisherInvitation;
use App\Models\PublisherLedgerEntry;
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

        $communityIds = $communities->pluck('id')->all();

        $clicksByCommunity = collect();
        $earningsByCommunity = collect();
        if ($communityIds !== []) {
            $clicksByCommunity = MemberActivityEvent::query()
                ->where('publisher_id', $publisher->id)
                ->whereIn('community_id', $communityIds)
                ->whereIn('activity_type', ['click', 'click_valid'])
                ->where('status', 'counted')
                ->select('community_id', DB::raw('count(*) as total'))
                ->groupBy('community_id')
                ->pluck('total', 'community_id');

            if ($isOwner) {
                $earningsByCommunity = PublisherLedgerEntry::query()
                    ->where('publisher_id', $publisher->id)
                    ->whereIn('community_id', $communityIds)
                    ->whereIn('entry_type', ['credit', 'adjustment'])
                    ->whereIn('state', ['approved', 'payable', 'paid', 'pending'])
                    ->select('community_id', DB::raw('COALESCE(SUM(net_usd), 0) as total'))
                    ->groupBy('community_id')
                    ->pluck('total', 'community_id');
            }
        }

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
            ->limit(100)
            ->get();

        $assignmentIds = $assignments->pluck('id')->all();
        $clicksByAssignment = collect();
        $membersByAssignment = collect();
        $earnedByAssignment = [];
        $pendingByAssignment = [];

        if ($assignmentIds !== []) {
            $clicksByAssignment = MemberActivityEvent::query()
                ->where('publisher_id', $publisher->id)
                ->whereIn('campaign_assignment_id', $assignmentIds)
                ->whereIn('activity_type', ['click', 'click_valid'])
                ->where('status', 'counted')
                ->select('campaign_assignment_id', DB::raw('count(*) as total'))
                ->groupBy('campaign_assignment_id')
                ->pluck('total', 'campaign_assignment_id');

            $membersByAssignment = MemberActivityEvent::query()
                ->where('publisher_id', $publisher->id)
                ->whereIn('campaign_assignment_id', $assignmentIds)
                ->where('status', 'counted')
                ->whereNotNull('network_member_id')
                ->select('campaign_assignment_id', DB::raw('count(DISTINCT network_member_id) as total'))
                ->groupBy('campaign_assignment_id')
                ->pluck('total', 'campaign_assignment_id');

            if ($isOwner) {
                $ledgerRows = PublisherLedgerEntry::query()
                    ->where('publisher_id', $publisher->id)
                    ->whereIn('campaign_assignment_id', $assignmentIds)
                    ->selectRaw(
                        'campaign_assignment_id,
                         entry_type,
                         state,
                         COALESCE(SUM(net_usd), 0) as total'
                    )
                    ->groupBy('campaign_assignment_id', 'entry_type', 'state')
                    ->get();

                foreach ($ledgerRows as $ledger) {
                    $aid = (int) $ledger->campaign_assignment_id;
                    $total = (float) $ledger->total;
                    if (! isset($earnedByAssignment[$aid])) {
                        $earnedByAssignment[$aid] = 0.0;
                        $pendingByAssignment[$aid] = 0.0;
                    }
                    if ($ledger->entry_type === 'reversal') {
                        $earnedByAssignment[$aid] -= abs($total);
                        continue;
                    }
                    if (! in_array($ledger->entry_type, ['credit', 'adjustment'], true)) {
                        continue;
                    }
                    if ($ledger->state === 'pending') {
                        $pendingByAssignment[$aid] += $total;
                    } elseif (in_array($ledger->state, ['approved', 'payable', 'paid'], true)) {
                        $earnedByAssignment[$aid] += $total;
                    }
                }
            }
        }

        $communityActiveMembers = $communities->mapWithKeys(
            fn ($c) => [(int) $c->id => (int) $c->active_members_count],
        );

        $assignmentRows = $assignments->map(function (PublisherCampaignAssignment $a) use (
            $isOwner,
            $clicksByAssignment,
            $membersByAssignment,
            $communityActiveMembers,
            $earnedByAssignment,
            $pendingByAssignment,
        ) {
            $earned = round((float) ($earnedByAssignment[$a->id] ?? 0), 4);
            $pending = round((float) ($pendingByAssignment[$a->id] ?? 0), 4);
            $communityId = $a->community_id ? (int) $a->community_id : null;
            $members = $communityId !== null
                ? (int) ($communityActiveMembers[$communityId] ?? 0)
                : (int) ($membersByAssignment[$a->id] ?? 0);

            return [
                'id' => $a->id,
                'status' => $a->status,
                'pricing_model' => $isOwner ? $a->pricing_model : null,
                'accepted_rate_usd' => $isOwner ? $a->accepted_rate_usd : null,
                'program_title' => $a->program?->title,
                'community_id' => $communityId,
                'community_name' => $a->community?->name ?? 'All members',
                'clicks' => (int) ($clicksByAssignment[$a->id] ?? 0),
                'members' => $members,
                'earned_usd' => $isOwner ? $earned : null,
                'pending_usd' => $isOwner ? $pending : null,
                'earnings_usd' => $isOwner ? round($earned + $pending, 4) : null,
            ];
        });

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
                'members' => (int) $c->active_members_count,
                'clicks' => (int) ($clicksByCommunity[$c->id] ?? 0),
                'earnings_usd' => $isOwner
                    ? round((float) ($earningsByCommunity[$c->id] ?? 0), 4)
                    : null,
            ]),
            'assignments' => $assignmentRows,
            'membership_role' => $membership->role,
            'financials_visible' => $isOwner,
        ]);
    }
}
