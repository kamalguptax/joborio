<?php

namespace App\Http\Controllers\Api\V1\Network;

use App\Http\Controllers\Controller;
use App\Models\MemberActivityEvent;
use App\Models\MemberSettlementRecord;
use App\Models\NetworkMember;
use App\Models\PublisherCampaignAssignment;
use App\Services\Publishers\MemberActivityService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    use ApiResponse;

    public function __construct(private MemberActivityService $activity) {}

    /**
     * Member dashboard: communities, join dates, own settlement earnings by community,
     * activity counts. Never returns CPC rates or publisher commercial fees.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $member = NetworkMember::query()
            ->with([
                'publisher:id,code,display_name,username',
                'communityMemberships' => fn ($q) => $q->whereIn('status', ['active', 'ended', 'released']),
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

        $memberships = $member->communityMemberships
            ->filter(fn ($cm) => $cm->community)
            ->values();

        $communityIds = $memberships->pluck('community_id')->map(fn ($id) => (int) $id)->all();

        $settlementsByCommunity = collect();
        if ($communityIds !== []) {
            $settlementsByCommunity = MemberSettlementRecord::query()
                ->where('publisher_id', $member->publisher_id)
                ->where('network_member_id', $member->id)
                ->whereIn('community_id', $communityIds)
                ->select(
                    'community_id',
                    'status',
                    DB::raw('COALESCE(SUM(amount_usd), 0) as total'),
                )
                ->groupBy('community_id', 'status')
                ->get()
                ->groupBy('community_id');
        }

        $clicksByCommunity = collect();
        $signupsByCommunity = collect();
        if ($communityIds !== []) {
            $activityRows = MemberActivityEvent::query()
                ->where('network_member_id', $member->id)
                ->where('status', 'counted')
                ->whereIn('community_id', $communityIds)
                ->select('community_id', 'activity_type', DB::raw('count(*) as total'))
                ->groupBy('community_id', 'activity_type')
                ->get();

            foreach ($activityRows as $row) {
                $cid = (int) $row->community_id;
                $type = (string) $row->activity_type;
                $total = (int) $row->total;
                if ($type === 'click' || $type === 'click_valid') {
                    $clicksByCommunity[$cid] = (int) ($clicksByCommunity[$cid] ?? 0) + $total;
                } elseif ($type === 'signup') {
                    $signupsByCommunity[$cid] = $total;
                }
            }
        }

        $campaignsByCommunity = PublisherCampaignAssignment::query()
            ->where('publisher_id', $member->publisher_id)
            ->where('status', 'active')
            ->where(function ($q) use ($communityIds) {
                $q->whereNull('community_id');
                if ($communityIds !== []) {
                    $q->orWhereIn('community_id', $communityIds);
                }
            })
            ->with('program:id,title,status,promotion_type,pricing_model')
            ->latest()
            ->get();

        $communities = $memberships->map(function ($cm) use (
            $settlementsByCommunity,
            $clicksByCommunity,
            $signupsByCommunity,
            $campaignsByCommunity,
            $member,
        ) {
            $community = $cm->community;
            $cid = (int) $community->id;
            $settled = (float) ($settlementsByCommunity->get($cid)?->firstWhere('status', 'settled')?->total ?? 0);
            $pending = (float) ($settlementsByCommunity->get($cid)?->firstWhere('status', 'pending')?->total ?? 0);

            $campaigns = $campaignsByCommunity
                ->filter(fn ($a) => $a->community_id === null || (int) $a->community_id === $cid)
                ->map(fn (PublisherCampaignAssignment $a) => [
                    'name' => $a->program?->title,
                    'status' => $a->status === 'active' ? ($a->program?->status ?? 'active') : $a->status,
                    'scope' => $a->community_id ? 'community' : 'network',
                ])
                ->filter(fn ($c) => filled($c['name']))
                ->unique('name')
                ->values();

            return [
                'id' => $cid,
                'code' => $community->code,
                'name' => $community->name,
                'status' => $cm->status === 'active' ? ($community->status ?? 'active') : $cm->status,
                'joined_at' => optional($cm->joined_at ?? $member->joined_at)?->toIso8601String(),
                'clicks_total' => (int) ($clicksByCommunity[$cid] ?? 0),
                'ppr' => (int) ($signupsByCommunity[$cid] ?? 0),
                'earning' => [
                    'settled_usd' => round($settled, 4),
                    'pending_usd' => round($pending, 4),
                    'total_usd' => round($settled + $pending, 4),
                    'currency' => 'USD',
                ],
                'campaigns' => $campaigns,
            ];
        })->values();

        // Member-safe campaign list (no rates).
        $assignedCampaigns = $campaignsByCommunity->map(fn (PublisherCampaignAssignment $a) => [
            'name' => $a->program?->title,
            'status' => $a->status === 'active' ? ($a->program?->status ?? 'active') : $a->status,
            'community_id' => $a->community_id,
            'community_name' => $a->community_id
                ? ($communities->firstWhere('id', (int) $a->community_id)['name'] ?? null)
                : 'All communities',
        ])->filter(fn ($c) => filled($c['name']))->values();

        $recent = $isActive
            ? $member->activityEvents()
                ->orderByDesc('occurred_at')
                ->limit(15)
                ->get([
                    'id',
                    'activity_type',
                    'status',
                    'tracking_id',
                    'meta',
                    'occurred_at',
                ])
                ->map(fn ($e) => [
                    'id' => $e->id,
                    'activity_type' => $e->activity_type,
                    'status' => $e->status,
                    'title' => is_array($e->meta) ? ($e->meta['title'] ?? null) : null,
                    'reference_id' => is_array($e->meta) ? ($e->meta['reference_id'] ?? null) : null,
                    'occurred_at' => optional($e->occurred_at)?->toIso8601String(),
                ])
                ->values()
            : collect();

        $totalEarning = [
            'settled_usd' => round((float) $communities->sum(fn ($c) => $c['earning']['settled_usd']), 4),
            'pending_usd' => round((float) $communities->sum(fn ($c) => $c['earning']['pending_usd']), 4),
            'total_usd' => round((float) $communities->sum(fn ($c) => $c['earning']['total_usd']), 4),
            'currency' => 'USD',
        ];

        return $this->success([
            'member' => [
                'name' => $member->display_name ?: $user->name,
                'status' => $isActive ? 'Active Member' : 'Left — awaiting release',
                'status_code' => $member->status,
                'public_code' => $user->public_code,
                'joined_at' => optional($member->joined_at)?->toIso8601String(),
                'left_at' => optional($member->left_at)?->toIso8601String(),
                'released_at' => optional($member->released_at)?->toIso8601String(),
            ],
            'publisher' => [
                'name' => $member->publisher?->display_name,
                'code' => $member->publisher?->code,
            ],
            'communities' => $isActive ? $communities : collect(),
            'earning_total' => $totalEarning,
            'activity' => $this->activity->summaryForMember($member),
            'recent_activity' => $recent,
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
