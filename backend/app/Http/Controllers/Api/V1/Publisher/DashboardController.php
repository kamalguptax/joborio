<?php

namespace App\Http\Controllers\Api\V1\Publisher;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Models\PublisherCampaignAssignment;
use App\Models\PublisherInvitation;
use App\Services\Publishers\PublisherLedgerService;
use App\Support\ApiResponse;
use App\Support\PublisherAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use ApiResponse;

    public function __construct(private PublisherLedgerService $ledger) {}

    public function show(Request $request): JsonResponse
    {
        $membership = PublisherAccess::membership($request->user());
        $publisher = $membership->publisher;
        $scopedIds = PublisherAccess::managedCommunityIds($request->user());
        $isOwner = $membership->isOwner();

        $communitiesQuery = PublisherAccess::communitiesQuery($request->user());
        $communities = (clone $communitiesQuery)->count();
        $activeCommunities = (clone $communitiesQuery)->where('status', 'active')->count();

        $membersQuery = $publisher->networkMembers()->where('status', 'active');
        if ($scopedIds !== null) {
            if ($scopedIds === []) {
                $members = 0;
            } else {
                $members = (clone $membersQuery)->whereHas(
                    'communityMemberships',
                    fn ($q) => $q->whereIn('community_id', $scopedIds)->where('status', 'active'),
                )->count();
            }
        } else {
            $members = $membersQuery->count();
        }

        $invitesQuery = PublisherInvitation::query()
            ->where('publisher_id', $publisher->id)
            ->where('status', 'pending');
        if ($scopedIds !== null) {
            $invitesQuery->whereIn('community_id', $scopedIds);
        }
        $pendingInvites = $invitesQuery->count();

        $assignmentsQuery = PublisherCampaignAssignment::query()
            ->where('publisher_id', $publisher->id)
            ->where('status', 'active');
        if ($scopedIds !== null) {
            $assignmentsQuery->whereIn('community_id', $scopedIds);
        }
        $runningCampaigns = (clone $assignmentsQuery)->count();

        // Live = active programs on the marketplace (available to assign / promote).
        $liveCampaigns = Program::query()->where('status', 'active')->count();

        $recentCommunities = (clone $communitiesQuery)
            ->latest()
            ->limit(5)
            ->get(['id', 'code', 'name', 'category', 'status', 'created_at']);

        $balances = null;
        if ($isOwner) {
            $balances = $this->ledger->balances($publisher);
        }

        $nav = [
            ['id' => 'overview', 'label' => 'Overview', 'href' => '/publisher/dashboard'],
            ['id' => 'network', 'label' => 'My Network', 'href' => '/publisher/network'],
            ['id' => 'communities', 'label' => 'Communities', 'href' => '/publisher/communities'],
            ['id' => 'marketplace', 'label' => 'Campaign Marketplace', 'href' => '/publisher/marketplace'],
            ['id' => 'reports', 'label' => 'Performance Reports', 'href' => '/publisher/reports'],
        ];

        if ($isOwner) {
            $nav = array_merge($nav, [
                ['id' => 'earnings', 'label' => 'Publisher Earnings', 'href' => '/publisher/earnings'],
                ['id' => 'integrations', 'label' => 'API & Integration', 'href' => '/publisher/integrations'],
                ['id' => 'payments', 'label' => 'Payment History', 'href' => '/publisher/payments'],
                ['id' => 'settings', 'label' => 'Account Settings', 'href' => '/publisher/settings'],
            ]);
        } else {
            $nav[] = ['id' => 'settings', 'label' => 'Account Settings', 'href' => '/publisher/settings'];
        }

        return $this->success([
            'publisher' => [
                'id' => $publisher->id,
                'code' => $publisher->code,
                'username' => $publisher->username,
                'display_name' => $publisher->display_name,
                'country_code' => $publisher->country_code,
                'network_type' => $publisher->network_type,
                'integration_preference' => $publisher->integration_preference,
                'status' => $publisher->status,
                'status_label' => $publisher->statusLabel(),
                'is_activated' => $publisher->isActivated(),
                'social_url' => $publisher->social_url,
                'website_url' => $publisher->website_url,
                'job_preferences' => $publisher->job_preferences,
                'niche_ids' => $publisher->niche_ids,
            ],
            'membership' => [
                'role' => $membership->role,
                'scope' => $isOwner ? 'all' : 'assigned_communities',
                'can_view_financials' => $isOwner,
                'managed_community_ids' => $scopedIds,
            ],
            'overview' => [
                'communities' => $communities,
                'active_communities' => $activeCommunities,
                'members' => $members,
                'active_campaigns' => $runningCampaigns,
                'live_campaigns' => $liveCampaigns,
                'running_campaigns' => $runningCampaigns,
                'pending_invites' => $pendingInvites,
                'overall_earnings_usd' => $balances['lifetime_net_usd'] ?? null,
                'total_payout_usd' => $balances['paid_usd'] ?? null,
                'payable_usd' => $balances['payable_usd'] ?? null,
            ],
            'recent_communities' => $recentCommunities,
            'nav' => $nav,
        ]);
    }
}
