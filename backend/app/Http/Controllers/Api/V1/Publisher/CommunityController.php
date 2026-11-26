<?php

namespace App\Http\Controllers\Api\V1\Publisher;

use App\Http\Controllers\Controller;
use App\Models\MemberActivityEvent;
use App\Models\MemberSettlementRecord;
use App\Models\NetworkMember;
use App\Models\Program;
use App\Models\PublisherCampaignAssignment;
use App\Models\PublisherCommission;
use App\Models\PublisherCommunity;
use App\Models\PublisherInvitation;
use App\Models\PublisherLedgerEntry;
use App\Models\PublisherUser;
use App\Services\Publishers\CommunityXmlFeedSyncService;
use App\Support\ApiResponse;
use App\Support\PublisherAccess;
use App\Support\PublisherCommissionSplit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CommunityController extends Controller
{
    use ApiResponse;

    public function __construct(private CommunityXmlFeedSyncService $xmlFeedSync) {}

    public function index(Request $request): JsonResponse
    {
        $membership = PublisherAccess::membership($request->user());
        $publisher = $membership->publisher;

        $communities = PublisherAccess::communitiesQuery($request->user())
            ->withCount(['members as members_count' => fn ($q) => $q->where('status', 'active')])
            ->with('manager:id,name,email')
            ->latest()
            ->get();

        $communityIds = $communities->pluck('id')->all();
        $clicksByCommunity = collect();
        if ($communityIds !== []) {
            $clicksByCommunity = MemberActivityEvent::query()
                ->where('publisher_id', $publisher->id)
                ->whereIn('community_id', $communityIds)
                ->where('status', 'counted')
                ->whereIn('activity_type', ['click', 'click_valid'])
                ->select('community_id', DB::raw('count(*) as total'))
                ->groupBy('community_id')
                ->pluck('total', 'community_id');
        }

        $rows = $communities->map(function (PublisherCommunity $c) use ($clicksByCommunity) {
            $payload = $this->serialize($c);
            $payload['clicks_total'] = (int) ($clicksByCommunity[$c->id] ?? 0);

            return $payload;
        });

        return $this->success([
            'communities' => $rows,
            'membership_role' => $membership->role,
            'scope' => $membership->isOwner() ? 'all' : 'assigned',
        ]);
    }

    public function dashboard(Request $request, int $community): JsonResponse
    {
        $row = PublisherAccess::assertCanAccessCommunity($request->user(), $community);
        $publisher = PublisherAccess::publisher($request->user());
        $isOwner = PublisherAccess::membership($request->user())->isOwner();

        $row->loadCount([
            'members as members_count' => fn ($q) => $q->where('status', 'active'),
        ]);
        $row->load('manager:id,name,email');

        $activityByType = MemberActivityEvent::query()
            ->where('publisher_id', $publisher->id)
            ->where('community_id', $row->id)
            ->where('status', 'counted')
            ->select('activity_type', DB::raw('count(*) as total'))
            ->groupBy('activity_type')
            ->pluck('total', 'activity_type');

        $clicks = (int) ($activityByType['click'] ?? 0) + (int) ($activityByType['click_valid'] ?? 0);
        $signups = (int) ($activityByType['signup'] ?? 0);
        $applications = (int) ($activityByType['application'] ?? 0);
        $conversions = (int) ($activityByType['conversion'] ?? 0);

        $members = NetworkMember::query()
            ->where('publisher_id', $publisher->id)
            ->whereHas('communityMemberships', function ($q) use ($row) {
                $q->where('community_id', $row->id)
                    ->whereIn('status', ['active', 'ended', 'released']);
            })
            ->with([
                'user:id,name,email',
                'communityMemberships' => fn ($q) => $q
                    ->where('community_id', $row->id)
                    ->with('community:id,code,name'),
            ])
            ->latest()
            ->limit(200)
            ->get();

        $memberIds = $members->pluck('id')->all();
        $activityByMember = [];
        if ($memberIds !== []) {
            $activityRows = MemberActivityEvent::query()
                ->where('publisher_id', $publisher->id)
                ->where('community_id', $row->id)
                ->whereIn('network_member_id', $memberIds)
                ->where('status', 'counted')
                ->selectRaw('network_member_id, activity_type, COUNT(*) as total')
                ->groupBy('network_member_id', 'activity_type')
                ->get();

            foreach ($activityRows as $event) {
                $id = (int) $event->network_member_id;
                if (! isset($activityByMember[$id])) {
                    $activityByMember[$id] = [
                        'clicks_total' => 0,
                        'clicks_valid' => 0,
                        'signups' => 0,
                        'applications' => 0,
                        'leads' => 0,
                        'conversions' => 0,
                    ];
                }
                $type = (string) $event->activity_type;
                $total = (int) $event->total;
                if ($type === 'click' || $type === 'click_valid') {
                    $activityByMember[$id]['clicks_total'] += $total;
                    if ($type === 'click_valid') {
                        $activityByMember[$id]['clicks_valid'] += $total;
                    }
                } elseif ($type === 'signup') {
                    $activityByMember[$id]['signups'] = $total;
                } elseif ($type === 'application') {
                    $activityByMember[$id]['applications'] = $total;
                } elseif ($type === 'lead') {
                    $activityByMember[$id]['leads'] = $total;
                } elseif ($type === 'conversion') {
                    $activityByMember[$id]['conversions'] = $total;
                }
            }
        }

        $earningsByMember = [];
        $settledUsd = 0.0;
        $pendingUsd = 0.0;
        if ($isOwner && $memberIds !== []) {
            $settlements = MemberSettlementRecord::query()
                ->where('publisher_id', $publisher->id)
                ->where('community_id', $row->id)
                ->whereIn('network_member_id', $memberIds)
                ->whereIn('status', ['pending', 'settled'])
                ->selectRaw('network_member_id, status, COALESCE(SUM(amount_usd), 0) as total')
                ->groupBy('network_member_id', 'status')
                ->get();

            foreach ($settlements as $s) {
                $id = (int) $s->network_member_id;
                if (! isset($earningsByMember[$id])) {
                    $earningsByMember[$id] = ['settled_usd' => 0.0, 'pending_usd' => 0.0];
                }
                if ($s->status === 'settled') {
                    $earningsByMember[$id]['settled_usd'] = round((float) $s->total, 4);
                    $settledUsd += (float) $s->total;
                } else {
                    $earningsByMember[$id]['pending_usd'] = round((float) $s->total, 4);
                    $pendingUsd += (float) $s->total;
                }
            }
        }

        $memberRows = $members->map(function (NetworkMember $m) use ($isOwner, $activityByMember, $earningsByMember) {
            $activity = $activityByMember[$m->id] ?? [
                'clicks_total' => 0,
                'clicks_valid' => 0,
                'signups' => 0,
                'applications' => 0,
                'leads' => 0,
                'conversions' => 0,
            ];
            if ($activity['clicks_valid'] === 0 && $activity['clicks_total'] > 0) {
                $activity['clicks_valid'] = $activity['clicks_total'];
            }
            $earn = $earningsByMember[$m->id] ?? ['settled_usd' => 0.0, 'pending_usd' => 0.0];
            $membership = $m->communityMemberships->first();

            return [
                'id' => $m->id,
                'display_name' => $m->display_name ?: $m->user?->name,
                'email' => $m->user?->email,
                'status' => $m->status,
                'community_status' => $membership?->status,
                'joined_at' => optional($m->joined_at)?->toIso8601String(),
                'activity' => $activity,
                'earnings' => $isOwner ? [
                    'settled_usd' => $earn['settled_usd'],
                    'pending_usd' => $earn['pending_usd'],
                    'total_usd' => round($earn['settled_usd'] + $earn['pending_usd'], 4),
                    'currency' => 'USD',
                ] : null,
            ];
        })->values();

        $assignmentModels = PublisherCampaignAssignment::query()
            ->where('publisher_id', $publisher->id)
            ->where(function ($q) use ($row) {
                $q->where('community_id', $row->id)->orWhereNull('community_id');
            })
            ->with('program:id,title,pricing_model,promotion_type,status')
            ->latest()
            ->limit(40)
            ->get();

        $assignmentIds = $assignmentModels->pluck('id')->all();
        $earnedByAssignment = [];
        $pendingByAssignment = [];
        if ($isOwner && $assignmentIds !== []) {
            // Only count ledger rows attributed to this community
            // (network-wide campaigns still break out per community).
            $ledgerRows = PublisherLedgerEntry::query()
                ->where('publisher_id', $publisher->id)
                ->where('community_id', $row->id)
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

        $campaignsEarnedTotal = 0.0;
        $campaignsPendingTotal = 0.0;
        $assignments = $assignmentModels->map(function (PublisherCampaignAssignment $a) use (
            $isOwner,
            $earnedByAssignment,
            $pendingByAssignment,
            &$campaignsEarnedTotal,
            &$campaignsPendingTotal,
        ) {
            $earned = round((float) ($earnedByAssignment[$a->id] ?? 0), 4);
            $pending = round((float) ($pendingByAssignment[$a->id] ?? 0), 4);
            $campaignsEarnedTotal += $earned;
            $campaignsPendingTotal += $pending;

            return [
                'id' => $a->id,
                'status' => $a->status,
                'pricing_model' => $isOwner ? ($a->program?->pricing_model ?? $a->pricing_model) : null,
                'accepted_rate_usd' => $isOwner ? $a->accepted_rate_usd : null,
                'program_title' => $a->program?->title,
                'scope' => $a->community_id ? 'community' : 'network',
                'earned_usd' => $isOwner ? $earned : null,
                'pending_usd' => $isOwner ? $pending : null,
                'total_usd' => $isOwner ? round($earned + $pending, 4) : null,
            ];
        })->values();

        $recent = MemberActivityEvent::query()
            ->where('publisher_id', $publisher->id)
            ->where('community_id', $row->id)
            ->where('status', 'counted')
            ->with(['networkMember:id,display_name,user_id', 'networkMember.user:id,name'])
            ->orderByDesc('occurred_at')
            ->limit(25)
            ->get()
            ->map(function (MemberActivityEvent $e) {
                $member = $e->networkMember;

                return [
                    'id' => $e->id,
                    'activity_type' => $e->activity_type,
                    'title' => is_array($e->meta) ? ($e->meta['title'] ?? null) : null,
                    'member_name' => $member?->display_name ?: $member?->user?->name,
                    'occurred_at' => optional($e->occurred_at)?->toIso8601String(),
                ];
            })
            ->values();

        $publisherEarnings = null;
        if ($isOwner) {
            $publisherEarnings = round((float) PublisherLedgerEntry::query()
                ->where('publisher_id', $publisher->id)
                ->where('community_id', $row->id)
                ->whereIn('entry_type', ['credit', 'adjustment'])
                ->whereIn('state', ['approved', 'payable', 'paid'])
                ->sum('net_usd'), 4);
        }

        $pendingInvites = PublisherInvitation::query()
            ->where('publisher_id', $publisher->id)
            ->where('community_id', $row->id)
            ->where('status', 'pending')
            ->count();

        $payload = $this->serialize($row);
        $payload['clicks_total'] = $clicks;

        return $this->success([
            'community' => $payload,
            'summary' => [
                'members_active' => (int) $row->members_count,
                'members_total' => $memberRows->count(),
                'clicks' => $clicks,
                'signups' => $signups,
                'applications' => $applications,
                'conversions' => $conversions,
                'pending_invites' => $pendingInvites,
                'xml_jobs_count' => is_array($row->xml_job_refs) ? count($row->xml_job_refs) : 0,
                'publisher_earnings_usd' => $publisherEarnings,
                'campaigns_earned_usd' => $isOwner ? round($campaignsEarnedTotal, 4) : null,
                'campaigns_pending_usd' => $isOwner ? round($campaignsPendingTotal, 4) : null,
                'campaigns_total_usd' => $isOwner
                    ? round($campaignsEarnedTotal + $campaignsPendingTotal, 4)
                    : null,
                'member_settled_usd' => $isOwner ? round($settledUsd, 4) : null,
                'member_pending_usd' => $isOwner ? round($pendingUsd, 4) : null,
            ],
            'members' => $memberRows,
            'assignments' => $assignments,
            'recent_activity' => $recent,
            'can_view_financials' => $isOwner,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        PublisherAccess::assertOwner($request->user(), 'Only the publisher owner can create communities.');
        $publisher = PublisherAccess::publisher($request->user());

        $data = $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'category' => ['nullable', 'string', 'max:1000'],
            'categories' => ['nullable', 'array', 'max:40'],
            'categories.*' => ['string', 'max:120'],
            'commission_percent' => [
                'required',
                'numeric',
                Rule::in(PublisherCommissionSplit::permittedPublisherPercents()),
            ],
            'description' => ['nullable', 'string', 'max:2000'],
            'country_code' => ['nullable', 'string', 'in:IN,AE,US'],
            'campaign_access' => ['nullable', 'string', 'in:all_eligible,selected'],
            'status' => ['nullable', 'string', 'in:active,paused'],
            'manager_user_id' => ['nullable', 'integer'],
            'program_ids' => ['nullable', 'array'],
            'program_ids.*' => ['integer', 'exists:programs,id'],
            'xml_job_refs' => ['nullable', 'array', 'max:500'],
            'xml_job_refs.*' => ['string', 'max:191'],
        ]);

        $managerId = $this->resolveManagerId($publisher->id, $data['manager_user_id'] ?? null);
        $programIds = array_values(array_unique(array_map('intval', $data['program_ids'] ?? [])));
        $category = $this->normalizeCategories(
            $data['categories'] ?? null,
            $data['category'] ?? null,
        );
        $categoryList = $category
            ? array_values(array_filter(array_map('trim', preg_split('/\s*,\s*/', $category) ?: [])))
            : [];
        // Live XML jobs matching niches are attached automatically (and stay in sync on feed refresh).
        $xmlJobRefs = $this->xmlFeedSync->resolveRefsForCreate(
            $categoryList,
            $this->normalizeXmlJobRefs($data['xml_job_refs'] ?? []),
        );
        if ($programIds === [] && $xmlJobRefs === []) {
            return $this->error(
                'VALIDATION_ERROR',
                'Pick at least one campaign/job, or choose niches that match live feed jobs.',
                422,
                [
                    'program_ids' => ['Pick at least one campaign or job.'],
                    'categories' => ['Or choose niches that match live feed jobs.'],
                    'xml_job_refs' => ['No matching feed jobs for the selected niches yet.'],
                ],
            );
        }
        $commissionPercent = PublisherCommissionSplit::clampPublisherPercent(
            (float) $data['commission_percent'],
        );

        $community = $publisher->communities()->create([
            'code' => $this->uniqueCode($publisher->id),
            'name' => trim($data['name']),
            'category' => $category,
            'commission_percent' => $commissionPercent,
            'description' => $data['description'] ?? null,
            'country_code' => $data['country_code'] ?? $publisher->country_code,
            'campaign_access' => $data['campaign_access'] ?? 'selected',
            'xml_job_refs' => $xmlJobRefs !== [] ? $xmlJobRefs : null,
            'status' => $data['status'] ?? 'active',
            'manager_user_id' => $managerId,
        ]);

        $this->syncPublisherCommission(
            (int) $publisher->id,
            $commissionPercent,
            (int) $request->user()->id,
            'Set when creating community '.$community->code,
        );

        $this->ensureCommunityJoinInvite($community, $request->user()->id);

        // Same campaign can be linked to many communities for this publisher.
        $assigned = $this->assignProgramsToCommunity(
            $publisher->id,
            $community->id,
            $programIds,
            (int) $request->user()->id,
        );

        return $this->success([
            'community' => $this->serialize($community->load('manager:id,name,email')),
            'assigned_program_ids' => $assigned,
            'xml_job_refs' => $xmlJobRefs,
        ], 201);
    }

    public function update(Request $request, PublisherCommunity $community): JsonResponse
    {
        $membership = PublisherAccess::membership($request->user());
        $publisher = $membership->publisher;

        if ((int) $community->publisher_id !== (int) $publisher->id) {
            return $this->error('FORBIDDEN', 'Community not found for this publisher.', 404);
        }

        if (! $membership->isOwner() && (int) $community->manager_user_id !== (int) $request->user()->id) {
            return $this->error('FORBIDDEN', 'Community is outside your managed scope.', 403);
        }

        $rules = [
            'name' => ['sometimes', 'string', 'max:160'],
            'category' => ['nullable', 'string', 'max:1000'],
            'categories' => ['nullable', 'array', 'max:40'],
            'categories.*' => ['string', 'max:120'],
            'commission_percent' => [
                'sometimes',
                'numeric',
                Rule::in(PublisherCommissionSplit::permittedPublisherPercents()),
            ],
            'description' => ['nullable', 'string', 'max:2000'],
            'country_code' => ['nullable', 'string', 'in:IN,AE,US'],
            'campaign_access' => ['nullable', 'string', 'in:all_eligible,selected'],
            'xml_job_refs' => ['sometimes', 'nullable', 'array', 'max:500'],
            'xml_job_refs.*' => ['string', 'max:191'],
            'status' => ['nullable', 'string', 'in:active,paused'],
        ];

        if ($membership->isOwner()) {
            $rules['manager_user_id'] = ['nullable', 'integer'];
        }

        $data = $request->validate($rules);

        if (array_key_exists('categories', $data) || array_key_exists('category', $data)) {
            $data['category'] = $this->normalizeCategories(
                $data['categories'] ?? null,
                $data['category'] ?? null,
            );
            unset($data['categories']);
        }

        $categoriesChanged = array_key_exists('category', $data);
        $manualXmlProvided = array_key_exists('xml_job_refs', $data);
        if ($manualXmlProvided) {
            $data['xml_job_refs'] = $this->normalizeXmlJobRefs($data['xml_job_refs'] ?? []);
            if ($data['xml_job_refs'] === []) {
                $data['xml_job_refs'] = null;
            }
        }

        if ($membership->isOwner() && array_key_exists('manager_user_id', $data)) {
            $data['manager_user_id'] = $this->resolveManagerId(
                $publisher->id,
                $data['manager_user_id'],
            );
        } else {
            unset($data['manager_user_id']);
        }

        if (array_key_exists('commission_percent', $data)) {
            $data['commission_percent'] = PublisherCommissionSplit::clampPublisherPercent(
                (float) $data['commission_percent'],
            );
            if ($membership->isOwner()) {
                $this->syncPublisherCommission(
                    (int) $publisher->id,
                    (float) $data['commission_percent'],
                    (int) $request->user()->id,
                    'Updated from community '.$community->code,
                );
            }
        }

        $community->fill($data)->save();

        // Keep community job feed aligned with niches whenever categories change
        // (or when the publisher did not send a manual xml_job_refs override).
        if ($categoriesChanged || ! $manualXmlProvided) {
            $this->xmlFeedSync->syncCommunity($community->fresh());
        }

        return $this->success([
            'community' => $this->serialize($community->fresh()->load('manager:id,name,email')),
        ]);
    }

    /**
     * @param  list<int>  $programIds
     * @return list<int>
     */
    private function assignProgramsToCommunity(
        int $publisherId,
        int $communityId,
        array $programIds,
        int $assignedByUserId,
    ): array {
        if ($programIds === []) {
            return [];
        }

        $programs = Program::query()
            ->whereIn('id', $programIds)
            ->where('status', 'active')
            ->get()
            ->keyBy('id');

        $assigned = [];
        foreach ($programIds as $programId) {
            $program = $programs->get($programId);
            if (! $program) {
                continue;
            }

            $row = PublisherCampaignAssignment::query()->firstOrNew([
                'publisher_id' => $publisherId,
                'community_id' => $communityId,
                'program_id' => $program->id,
            ]);

            $row->fill([
                'status' => 'active',
                'pricing_model' => $program->pricing_model,
                'accepted_rate_usd' => $row->accepted_rate_usd ?? $program->rate_usd,
                'rate_version' => $row->exists ? ($row->rate_version ?: 1) : 1,
                'accepted_at' => $row->accepted_at ?? now(),
                'assigned_by_user_id' => $row->assigned_by_user_id ?? $assignedByUserId,
            ]);
            $row->save();
            $assigned[] = (int) $program->id;
        }

        return $assigned;
    }

    private function resolveManagerId(int $publisherId, mixed $managerUserId): ?int
    {
        if ($managerUserId === null || $managerUserId === '') {
            return null;
        }

        $id = (int) $managerUserId;
        $ok = PublisherUser::query()
            ->where('publisher_id', $publisherId)
            ->where('user_id', $id)
            ->where('is_active', true)
            ->whereIn('role', ['manager', 'owner'])
            ->exists();

        if (! $ok) {
            throw ValidationException::withMessages([
                'manager_user_id' => ['Manager must be an active publisher team member.'],
            ]);
        }

        return $id;
    }

    private function uniqueCode(int $publisherId): string
    {
        do {
            $code = 'COM'.strtoupper(Str::random(5));
        } while (
            PublisherCommunity::query()
                ->where('publisher_id', $publisherId)
                ->where('code', $code)
                ->exists()
        );

        return $code;
    }

    private function ensureCommunityJoinInvite(PublisherCommunity $community, ?int $createdByUserId = null): PublisherInvitation
    {
        $invite = PublisherInvitation::query()
            ->where('publisher_id', $community->publisher_id)
            ->where('community_id', $community->id)
            ->where('channel', 'community_link')
            ->where('status', 'pending')
            ->latest('id')
            ->first();

        if ($invite) {
            return $invite->load(['publisher:id,code', 'community:id,code,name']);
        }

        $invite = PublisherInvitation::create([
            'publisher_id' => $community->publisher_id,
            'community_id' => $community->id,
            'token' => PublisherInvitation::makeToken(),
            'email' => null,
            'channel' => 'community_link',
            'status' => 'pending',
            'created_by_user_id' => $createdByUserId,
            'expires_at' => null,
        ]);

        return $invite->load(['publisher:id,code', 'community:id,code,name']);
    }

    private function joinUrl(PublisherInvitation $invite): string
    {
        $frontend = rtrim((string) config('joborio.frontend_url', 'https://joborio.com'), '/');

        return $frontend.$invite->invitePath();
    }

    private function syncPublisherCommission(
        int $publisherId,
        float $percent,
        int $userId,
        ?string $notes = null,
    ): void {
        $percent = PublisherCommissionSplit::clampPublisherPercent($percent);

        $latestVersion = (int) PublisherCommission::query()
            ->where('publisher_id', $publisherId)
            ->max('version');

        PublisherCommission::query()
            ->where('publisher_id', $publisherId)
            ->where('status', 'active')
            ->update([
                'status' => 'superseded',
                'effective_to' => now(),
            ]);

        PublisherCommission::create([
            'publisher_id' => $publisherId,
            'commission_percent' => $percent,
            'currency' => 'USD',
            'status' => 'active',
            'version' => $latestVersion + 1,
            'effective_from' => now(),
            'approved_by_user_id' => $userId,
            'notes' => $notes,
        ]);
    }

    /**
     * @param  mixed  $refs
     * @return list<string>
     */
    private function normalizeXmlJobRefs(mixed $refs): array
    {
        if (! is_array($refs)) {
            return [];
        }

        $out = [];
        foreach ($refs as $ref) {
            $value = trim((string) $ref);
            if ($value === '') {
                continue;
            }
            $out[] = mb_substr($value, 0, 191);
        }

        return array_values(array_unique($out));
    }

    /**
     * @param  list<string>|null  $categories
     */
    private function normalizeCategories(?array $categories, ?string $category): ?string
    {
        $parts = [];
        if (is_array($categories)) {
            foreach ($categories as $item) {
                $value = trim((string) $item);
                if ($value !== '') {
                    $parts[] = $value;
                }
            }
        } elseif (is_string($category) && trim($category) !== '') {
            foreach (preg_split('/\s*,\s*/', $category) ?: [] as $item) {
                $value = trim((string) $item);
                if ($value !== '') {
                    $parts[] = $value;
                }
            }
        }

        $parts = array_values(array_unique($parts));
        if ($parts === []) {
            return null;
        }

        return implode(', ', $parts);
    }

    private function serialize(PublisherCommunity $c): array
    {
        $invite = $this->ensureCommunityJoinInvite($c);
        $categories = array_values(array_filter(array_map(
            'trim',
            preg_split('/\s*,\s*/', (string) ($c->category ?? '')) ?: [],
        )));

        return [
            'id' => $c->id,
            'code' => $c->code,
            'name' => $c->name,
            'category' => $c->category,
            'categories' => $categories,
            'commission_percent' => $c->commission_percent !== null
                ? (float) $c->commission_percent
                : null,
            'description' => $c->description,
            'country_code' => $c->country_code,
            'campaign_access' => $c->campaign_access,
            'xml_job_refs' => array_values(array_filter(array_map(
                'strval',
                is_array($c->xml_job_refs) ? $c->xml_job_refs : [],
            ))),
            'xml_jobs_count' => is_array($c->xml_job_refs) ? count($c->xml_job_refs) : 0,
            'status' => $c->status,
            'manager_user_id' => $c->manager_user_id,
            'members_count' => (int) ($c->members_count ?? $c->members()->where('status', 'active')->count()),
            'clicks_total' => (int) ($c->clicks_total ?? 0),
            'join_url' => $this->joinUrl($invite),
            'join_path' => $invite->invitePath(),
            'manager' => $c->manager ? [
                'id' => $c->manager->id,
                'name' => $c->manager->name,
                'email' => $c->manager->email,
            ] : null,
            'created_at' => optional($c->created_at)?->toIso8601String(),
        ];
    }
}
