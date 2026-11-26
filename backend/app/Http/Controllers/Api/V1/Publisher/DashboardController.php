<?php

namespace App\Http\Controllers\Api\V1\Publisher;

use App\Http\Controllers\Controller;
use App\Models\MemberActivityEvent;
use App\Models\MemberSettlementRecord;
use App\Models\Program;
use App\Models\PublisherCampaignAssignment;
use App\Models\PublisherCommunity;
use App\Models\PublisherInvitation;
use App\Models\PublisherLedgerEntry;
use App\Services\Publishers\PublisherLedgerService;
use App\Support\ApiResponse;
use App\Support\PublisherAccess;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
        [$rangeKey, $rangeStart, $rangeEnd] = $this->resolveRange(
            (string) $request->query('range', '1d'),
        );

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

        $balances = null;
        $periodEarnings = null;
        $periodPaid = null;
        if ($isOwner) {
            $balances = $this->ledger->balances($publisher);
            $periodEarnings = $this->ledgerSumInRange(
                $publisher->id,
                $rangeStart,
                $rangeEnd,
                ['credit', 'adjustment'],
                null,
            );
            $periodPaid = $this->ledgerSumInRange(
                $publisher->id,
                $rangeStart,
                $rangeEnd,
                ['credit', 'adjustment'],
                'paid',
            );
        }

        $communityRows = $this->communityDashboardRows(
            $request,
            $publisher->id,
            $isOwner,
            $rangeStart,
            $rangeEnd,
        );

        $networkEarnings = $this->networkEarningsSummary(
            $publisher->id,
            $scopedIds,
            $isOwner,
            $balances,
            $rangeStart,
            $rangeEnd,
            $periodEarnings,
        );

        $recentActivity = $this->recentActivityFeed(
            $publisher->id,
            $scopedIds,
            $isOwner,
            $rangeStart,
            $rangeEnd,
        );

        $nav = [
            ['id' => 'overview', 'label' => 'Overview', 'href' => '/publisher/dashboard'],
            ['id' => 'network', 'label' => 'Performance Team', 'href' => '/publisher/network'],
            ['id' => 'communities', 'label' => 'Communities', 'href' => '/publisher/communities'],
            ['id' => 'marketplace', 'label' => 'Campaign Marketplace', 'href' => '/publisher/marketplace'],
            ['id' => 'reports', 'label' => 'Performance Reports', 'href' => '/publisher/reports'],
        ];

        if ($isOwner) {
            $nav = array_merge($nav, [
                ['id' => 'earnings', 'label' => 'Publisher Earnings', 'href' => '/publisher/earnings'],
                ['id' => 'integrations', 'label' => 'API & Integration', 'href' => '/publisher/integrations'],
                ['id' => 'payments', 'label' => 'Payment History', 'href' => '/publisher/payments'],
            ]);
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
            'range' => [
                'key' => $rangeKey,
                'label' => $this->rangeLabel($rangeKey),
                'start' => $rangeStart?->toIso8601String(),
                'end' => $rangeEnd?->toIso8601String(),
            ],
            'overview' => [
                'communities' => $communities,
                'active_communities' => $activeCommunities,
                'members' => $members,
                'active_campaigns' => $runningCampaigns,
                'live_campaigns' => $liveCampaigns,
                'running_campaigns' => $runningCampaigns,
                'pending_invites' => $pendingInvites,
                'overall_earnings_usd' => $periodEarnings ?? ($balances['lifetime_net_usd'] ?? null),
                'total_payout_usd' => $periodPaid ?? ($balances['paid_usd'] ?? null),
                'payable_usd' => $balances['payable_usd'] ?? null,
            ],
            'network' => $networkEarnings,
            'communities' => $communityRows,
            'recent_communities' => collect($communityRows)->take(8)->values(),
            'recent_activity' => $recentActivity,
            'nav' => $nav,
        ]);
    }

    /**
     * @return array{0: string, 1: ?Carbon, 2: ?Carbon}
     */
    private function resolveRange(string $raw): array
    {
        $key = strtolower(trim($raw));
        if (! in_array($key, ['1d', 'yesterday', '3d', '7d', '30d', 'all'], true)) {
            $key = '1d';
        }

        $now = now();

        return match ($key) {
            'yesterday' => [
                $key,
                $now->copy()->subDay()->startOfDay(),
                $now->copy()->startOfDay(),
            ],
            '3d' => [$key, $now->copy()->subDays(3), null],
            '7d' => [$key, $now->copy()->subDays(7), null],
            '30d' => [$key, $now->copy()->subDays(30), null],
            'all' => [$key, null, null],
            default => [$key, $now->copy()->startOfDay(), null], // today
        };
    }

    private function rangeLabel(string $key): string
    {
        return match ($key) {
            'yesterday' => 'Yesterday',
            '3d' => 'Last 3 days',
            '7d' => 'Last 7 days',
            '30d' => 'Last 30 days',
            'all' => 'All time',
            default => 'Today',
        };
    }

    /**
     * @param  list<string>  $entryTypes
     */
    private function ledgerSumInRange(
        int $publisherId,
        ?Carbon $start,
        ?Carbon $end,
        array $entryTypes,
        ?string $state,
    ): float {
        $q = PublisherLedgerEntry::query()
            ->where('publisher_id', $publisherId)
            ->whereIn('entry_type', $entryTypes);

        if ($state) {
            $q->where('state', $state);
        } else {
            $q->whereIn('state', ['approved', 'payable', 'paid']);
        }

        $this->applyOccurredRange($q, $start, $end, 'occurred_at', 'created_at');

        return round((float) $q->sum('net_usd'), 4);
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<\Illuminate\Database\Eloquent\Model>|\Illuminate\Database\Query\Builder  $query
     */
    private function applyOccurredRange($query, ?Carbon $start, ?Carbon $end, string $primary, string $fallback): void
    {
        if ($start) {
            $query->where(function ($q) use ($start, $primary, $fallback) {
                $q->where($primary, '>=', $start)
                    ->orWhere(function ($inner) use ($start, $primary, $fallback) {
                        $inner->whereNull($primary)->where($fallback, '>=', $start);
                    });
            });
        }
        if ($end) {
            $query->where(function ($q) use ($end, $primary, $fallback) {
                $q->where($primary, '<', $end)
                    ->orWhere(function ($inner) use ($end, $primary, $fallback) {
                        $inner->whereNull($primary)->where($fallback, '<', $end);
                    });
            });
        }
    }

    /**
     * Mixed feed of recent network member actions + invites (+ ledger for owners).
     *
     * @param  list<int>|null  $scopedIds
     * @return list<array<string, mixed>>
     */
    private function recentActivityFeed(
        int $publisherId,
        ?array $scopedIds,
        bool $isOwner,
        ?Carbon $rangeStart,
        ?Carbon $rangeEnd,
    ): array {
        $items = collect();

        $activityQuery = MemberActivityEvent::query()
            ->where('publisher_id', $publisherId)
            ->where('status', 'counted')
            ->with([
                'networkMember:id,display_name,user_id',
                'networkMember.user:id,name',
            ])
            ->orderByDesc('occurred_at')
            ->limit(25);

        $this->applyOccurredRange($activityQuery, $rangeStart, $rangeEnd, 'occurred_at', 'created_at');

        if ($scopedIds !== null) {
            if ($scopedIds === []) {
                $activityQuery->whereRaw('1 = 0');
            } else {
                $activityQuery->where(function ($q) use ($scopedIds) {
                    $q->whereIn('community_id', $scopedIds)->orWhereNull('community_id');
                });
            }
        }

        $communityNames = PublisherCommunity::query()
            ->where('publisher_id', $publisherId)
            ->when(
                $scopedIds !== null,
                fn ($q) => $q->whereIn('id', $scopedIds === [] ? [-1] : $scopedIds),
            )
            ->pluck('name', 'id');

        foreach ($activityQuery->get() as $event) {
            $member = $event->networkMember;
            $title = is_array($event->meta) ? ($event->meta['title'] ?? null) : null;
            $type = (string) $event->activity_type;
            $label = match ($type) {
                'click', 'click_valid' => 'Click',
                'signup' => 'PPR / signup',
                'application' => 'Application',
                'lead' => 'Lead',
                'conversion' => 'Conversion',
                'action_approved' => 'Action approved',
                'action_pending' => 'Action pending',
                'action_rejected' => 'Action rejected',
                default => ucfirst(str_replace('_', ' ', $type)),
            };

            $items->push([
                'id' => 'act-'.$event->id,
                'kind' => 'member_activity',
                'activity_type' => $type,
                'label' => $label,
                'title' => $title,
                'member_name' => $member?->display_name ?: $member?->user?->name,
                'community_name' => $event->community_id
                    ? ($communityNames[$event->community_id] ?? null)
                    : null,
                'occurred_at' => optional($event->occurred_at)?->toIso8601String(),
            ]);
        }

        $inviteQuery = PublisherInvitation::query()
            ->where('publisher_id', $publisherId)
            ->whereNotNull('accepted_at')
            ->with(['community:id,code,name'])
            ->orderByDesc('accepted_at')
            ->limit(10);

        if ($rangeStart) {
            $inviteQuery->where('accepted_at', '>=', $rangeStart);
        }
        if ($rangeEnd) {
            $inviteQuery->where('accepted_at', '<', $rangeEnd);
        }

        if ($scopedIds !== null) {
            $inviteQuery->whereIn('community_id', $scopedIds === [] ? [-1] : $scopedIds);
        }

        foreach ($inviteQuery->get() as $invite) {
            $items->push([
                'id' => 'inv-'.$invite->id,
                'kind' => 'invite_accepted',
                'activity_type' => 'invite_accepted',
                'label' => 'Invite accepted',
                'title' => $invite->email ?: 'Member joined',
                'member_name' => $invite->email,
                'community_name' => $invite->community?->name,
                'occurred_at' => optional($invite->accepted_at)?->toIso8601String(),
            ]);
        }

        if ($isOwner) {
            $ledgerRows = PublisherLedgerEntry::query()
                ->where('publisher_id', $publisherId)
                ->with(['community:id,code,name'])
                ->latest('id')
                ->limit(8);

            $this->applyOccurredRange($ledgerRows, $rangeStart, $rangeEnd, 'occurred_at', 'created_at');

            foreach ($ledgerRows->get() as $entry) {
                $when = $entry->occurred_at ?? $entry->created_at;
                $items->push([
                    'id' => 'led-'.$entry->id,
                    'kind' => 'ledger',
                    'activity_type' => (string) $entry->entry_type,
                    'label' => 'Ledger · '.ucfirst((string) $entry->entry_type),
                    'title' => $entry->reference ?: ($entry->state ?? 'entry'),
                    'member_name' => null,
                    'community_name' => $entry->community?->name,
                    'amount_usd' => round((float) $entry->net_usd, 4),
                    'occurred_at' => optional($when)?->toIso8601String(),
                ]);
            }
        }

        return $items
            ->filter(fn ($row) => filled($row['occurred_at'] ?? null))
            ->sortByDesc('occurred_at')
            ->take(20)
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>|null  $balances
     * @param  list<int>|null  $scopedIds
     * @return array<string, mixed>
     */
    private function networkEarningsSummary(
        int $publisherId,
        ?array $scopedIds,
        bool $isOwner,
        ?array $balances,
        ?Carbon $rangeStart,
        ?Carbon $rangeEnd,
        ?float $periodEarnings,
    ): array {
        $activityQuery = MemberActivityEvent::query()
            ->where('publisher_id', $publisherId)
            ->where('status', 'counted');
        $this->applyOccurredRange($activityQuery, $rangeStart, $rangeEnd, 'occurred_at', 'created_at');

        if ($scopedIds !== null) {
            if ($scopedIds === []) {
                $activityByType = collect();
            } else {
                $activityByType = (clone $activityQuery)
                    ->whereIn('community_id', $scopedIds)
                    ->select('activity_type', DB::raw('count(*) as total'))
                    ->groupBy('activity_type')
                    ->pluck('total', 'activity_type');
            }
        } else {
            $activityByType = (clone $activityQuery)
                ->select('activity_type', DB::raw('count(*) as total'))
                ->groupBy('activity_type')
                ->pluck('total', 'activity_type');
        }

        $clicks = (int) ($activityByType['click'] ?? 0) + (int) ($activityByType['click_valid'] ?? 0);
        $signups = (int) ($activityByType['signup'] ?? 0);
        $applications = (int) ($activityByType['application'] ?? 0);
        $conversions = (int) ($activityByType['conversion'] ?? 0);

        $settlementQuery = MemberSettlementRecord::query()->where('publisher_id', $publisherId);
        if ($scopedIds !== null) {
            $settlementQuery->whereIn('community_id', $scopedIds === [] ? [-1] : $scopedIds);
        }
        if ($rangeStart || $rangeEnd) {
            $settlementQuery->where(function ($q) use ($rangeStart, $rangeEnd) {
                if ($rangeStart) {
                    $q->where(function ($inner) use ($rangeStart) {
                        $inner->where('settled_at', '>=', $rangeStart)
                            ->orWhere(function ($fallback) use ($rangeStart) {
                                $fallback->whereNull('settled_at')->where('created_at', '>=', $rangeStart);
                            });
                    });
                }
                if ($rangeEnd) {
                    $q->where(function ($inner) use ($rangeEnd) {
                        $inner->where('settled_at', '<', $rangeEnd)
                            ->orWhere(function ($fallback) use ($rangeEnd) {
                                $fallback->whereNull('settled_at')->where('created_at', '<', $rangeEnd);
                            });
                    });
                }
            });
        }

        $memberSettled = (clone $settlementQuery)->where('status', 'settled')->sum('amount_usd');
        $memberPending = (clone $settlementQuery)->where('status', 'pending')->sum('amount_usd');

        return [
            'publisher_earnings_usd' => $isOwner
                ? ($periodEarnings ?? ($balances['lifetime_net_usd'] ?? 0))
                : null,
            'publisher_payable_usd' => $isOwner ? ($balances['payable_usd'] ?? 0) : null,
            'publisher_paid_usd' => $isOwner ? ($balances['paid_usd'] ?? 0) : null,
            'member_settled_usd' => $isOwner ? round((float) $memberSettled, 4) : null,
            'member_pending_usd' => $isOwner ? round((float) $memberPending, 4) : null,
            'clicks' => $clicks,
            'signups' => $signups,
            'applications' => $applications,
            'conversions' => $conversions,
            'financials_visible' => $isOwner,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function communityDashboardRows(
        Request $request,
        int $publisherId,
        bool $isOwner,
        ?Carbon $rangeStart,
        ?Carbon $rangeEnd,
    ): array {
        $communities = PublisherAccess::communitiesQuery($request->user())
            ->withCount([
                'members as active_members_count' => fn ($q) => $q->where('status', 'active'),
            ])
            ->with([
                'members' => fn ($q) => $q
                    ->where('status', 'active')
                    ->with(['networkMember:id,display_name,user_id,status', 'networkMember.user:id,name'])
                    ->limit(40),
            ])
            ->latest()
            ->get();

        $communityIds = $communities->pluck('id')->all();

        $assignments = PublisherCampaignAssignment::query()
            ->where('publisher_id', $publisherId)
            ->where('status', 'active')
            ->where(function ($q) use ($communityIds) {
                $q->whereNull('community_id');
                if ($communityIds !== []) {
                    $q->orWhereIn('community_id', $communityIds);
                }
            })
            ->with('program:id,title,pricing_model,promotion_type,status')
            ->get();

        $assignmentsByCommunity = $assignments
            ->filter(fn ($a) => $a->community_id !== null)
            ->groupBy('community_id');
        $globalAssignments = $assignments->filter(fn ($a) => $a->community_id === null)->values();

        $ledgerByCommunity = collect();
        $settlementByCommunity = collect();
        if ($isOwner && $communityIds !== []) {
            $ledgerQuery = PublisherLedgerEntry::query()
                ->where('publisher_id', $publisherId)
                ->whereIn('community_id', $communityIds)
                ->whereIn('entry_type', ['credit', 'adjustment'])
                ->whereIn('state', ['approved', 'payable', 'paid']);
            $this->applyOccurredRange($ledgerQuery, $rangeStart, $rangeEnd, 'occurred_at', 'created_at');
            $ledgerByCommunity = $ledgerQuery
                ->select('community_id', DB::raw('COALESCE(SUM(net_usd), 0) as total'))
                ->groupBy('community_id')
                ->pluck('total', 'community_id');

            $settlementQuery = MemberSettlementRecord::query()
                ->where('publisher_id', $publisherId)
                ->whereIn('community_id', $communityIds);
            if ($rangeStart) {
                $settlementQuery->where(function ($q) use ($rangeStart) {
                    $q->where('settled_at', '>=', $rangeStart)
                        ->orWhere(function ($fallback) use ($rangeStart) {
                            $fallback->whereNull('settled_at')->where('created_at', '>=', $rangeStart);
                        });
                });
            }
            if ($rangeEnd) {
                $settlementQuery->where(function ($q) use ($rangeEnd) {
                    $q->where('settled_at', '<', $rangeEnd)
                        ->orWhere(function ($fallback) use ($rangeEnd) {
                            $fallback->whereNull('settled_at')->where('created_at', '<', $rangeEnd);
                        });
                });
            }
            $settlementByCommunity = $settlementQuery
                ->select(
                    'community_id',
                    'status',
                    DB::raw('COALESCE(SUM(amount_usd), 0) as total'),
                )
                ->groupBy('community_id', 'status')
                ->get()
                ->groupBy('community_id');
        }

        $activityByCommunity = collect();
        if ($communityIds !== []) {
            $activityQuery = MemberActivityEvent::query()
                ->where('publisher_id', $publisherId)
                ->whereIn('community_id', $communityIds)
                ->where('status', 'counted')
                ->whereIn('activity_type', ['click', 'click_valid']);
            $this->applyOccurredRange($activityQuery, $rangeStart, $rangeEnd, 'occurred_at', 'created_at');
            $activityByCommunity = $activityQuery
                ->select('community_id', DB::raw('count(*) as total'))
                ->groupBy('community_id')
                ->pluck('total', 'community_id');
        }

        // Members with recent share activity, keyed by member id → community ids from events.
        $promotingMemberIds = MemberActivityEvent::query()
            ->where('publisher_id', $publisherId)
            ->where('status', 'counted')
            ->whereIn('activity_type', ['click', 'click_valid', 'signup', 'application', 'conversion'])
            ->where('occurred_at', '>=', now()->subDays(90))
            ->when($communityIds !== [], fn ($q) => $q->where(function ($inner) use ($communityIds) {
                $inner->whereIn('community_id', $communityIds)->orWhereNull('community_id');
            }))
            ->distinct()
            ->pluck('network_member_id')
            ->flip();

        return $communities->map(function ($c) use (
            $assignmentsByCommunity,
            $globalAssignments,
            $ledgerByCommunity,
            $settlementByCommunity,
            $activityByCommunity,
            $promotingMemberIds,
            $isOwner,
        ) {
            $assigned = collect($assignmentsByCommunity->get($c->id, collect()))
                ->concat($globalAssignments)
                ->unique('id')
                ->values();

            $promoting = $assigned->map(fn (PublisherCampaignAssignment $a) => [
                'assignment_id' => $a->id,
                'title' => $a->program?->title,
                'pricing_model' => $a->program?->pricing_model ?? $a->pricing_model,
                'promotion_type' => $a->program?->promotion_type,
                'scope' => $a->community_id ? 'community' : 'network',
            ])->filter(fn ($row) => filled($row['title']))->values();

            $xmlCount = is_array($c->xml_job_refs) ? count($c->xml_job_refs) : 0;

            $members = $c->members
                ->map(function ($cm) use ($promotingMemberIds) {
                    $member = $cm->networkMember;
                    if (! $member || $member->status !== 'active') {
                        return null;
                    }
                    $name = $member->display_name ?: $member->user?->name ?: 'Member';

                    return [
                        'id' => $member->id,
                        'name' => $name,
                        'is_promoting' => $promotingMemberIds->has($member->id),
                    ];
                })
                ->filter()
                ->values();

            $promotingMembers = $members->where('is_promoting', true)->values();
            // If nobody has activity yet, still list active members as the promoting roster.
            $displayPromoters = $promotingMembers->isNotEmpty()
                ? $promotingMembers
                : $members->take(8)->map(fn ($m) => array_merge($m, ['is_promoting' => false]));

            $settled = 0.0;
            $pending = 0.0;
            if ($isOwner) {
                $settled = (float) ($settlementByCommunity->get($c->id)?->firstWhere('status', 'settled')?->total ?? 0);
                $pending = (float) ($settlementByCommunity->get($c->id)?->firstWhere('status', 'pending')?->total ?? 0);
            }

            return [
                'id' => $c->id,
                'code' => $c->code,
                'name' => $c->name,
                'category' => $c->category,
                'status' => $c->status,
                'active_members' => (int) $c->active_members_count,
                'xml_jobs_count' => $xmlCount,
                'clicks' => (int) ($activityByCommunity[$c->id] ?? 0),
                'earnings_usd' => $isOwner
                    ? round((float) ($ledgerByCommunity[$c->id] ?? 0), 4)
                    : null,
                'member_settled_usd' => $isOwner ? round($settled, 4) : null,
                'member_pending_usd' => $isOwner ? round($pending, 4) : null,
                'promoting' => $promoting,
                'promoting_members' => $displayPromoters->take(12)->values(),
                'promoting_members_total' => $members->count(),
            ];
        })->values()->all();
    }
}
