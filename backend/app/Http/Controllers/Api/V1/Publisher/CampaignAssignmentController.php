<?php

namespace App\Http\Controllers\Api\V1\Publisher;

use App\Http\Controllers\Controller;
use App\Models\CommunityMember;
use App\Models\Program;
use App\Models\PublisherCampaignAssignment;
use App\Models\PublisherCommunity;
use App\Models\User;
use App\Services\Notifications\UserNotificationService;
use App\Support\ApiResponse;
use App\Support\PublisherAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CampaignAssignmentController extends Controller
{
    use ApiResponse;

    public function __construct(private UserNotificationService $notifications) {}

    /** Eligible live programs for the marketplace (publisher commercial view includes rates). */
    public function marketplace(Request $request): JsonResponse
    {
        $membership = PublisherAccess::membership($request->user());
        $publisher = $membership->publisher;
        $showRates = $membership->isOwner();

        $typeFilter = strtolower(trim((string) $request->query('type', 'all')));
        if (! in_array($typeFilter, ['all', 'job', 'campaign'], true)) {
            $typeFilter = 'all';
        }

        $programsQuery = Program::query()
            ->where('status', 'active')
            ->with([
                'employer:id,company_name',
                'listing:id,title,category,country_code,company_name,type',
            ]);

        if ($typeFilter === 'job') {
            $programsQuery->where('promotion_type', 'job');
        } elseif ($typeFilter === 'campaign') {
            $programsQuery->where(function ($q) {
                $q->whereNull('promotion_type')
                    ->orWhere('promotion_type', '!=', 'job');
            });
        }

        $programs = $programsQuery
            ->latest()
            ->limit(200)
            ->get();

        $filterCommunityId = $request->filled('community_id')
            ? (int) $request->integer('community_id')
            : null;

        $assignmentRows = PublisherCampaignAssignment::query()
            ->where('publisher_id', $publisher->id)
            ->where('status', 'active')
            ->get(['program_id', 'community_id']);

        $assignedByProgram = $assignmentRows->groupBy('program_id');

        return $this->success([
            'campaigns' => $programs->map(function (Program $p) use ($showRates, $assignedByProgram, $filterCommunityId) {
                $rows = $assignedByProgram->get($p->id) ?? collect();
                $communityIds = $rows
                    ->pluck('community_id')
                    ->filter()
                    ->map(fn ($id) => (int) $id)
                    ->unique()
                    ->values()
                    ->all();
                $alreadyForCommunity = $filterCommunityId
                    ? $rows->contains(fn ($row) => (int) $row->community_id === $filterCommunityId)
                    : $rows->isNotEmpty();
                $listing = $p->listing;
                $promo = strtolower((string) ($p->promotion_type ?? 'other'));

                $destination = trim((string) ($p->post_url ?: $listing?->destination_url ?: ''));

                return [
                    'id' => $p->id,
                    'title' => $p->title,
                    'pricing_model' => $showRates ? $p->pricing_model : null,
                    'promotion_type' => $p->promotion_type,
                    'source_kind' => $promo === 'job' ? 'job' : 'campaign',
                    'rate_usd' => $showRates ? $p->rate_usd : null,
                    'budget_total_usd' => $showRates ? $p->budget_total_usd : null,
                    'status' => $p->status,
                    'employer' => $p->employer?->company_name ?? $listing?->company_name,
                    'category' => $listing?->category,
                    'country_code' => $listing?->country_code,
                    'listing_title' => $listing?->title,
                    'destination_url' => $destination !== '' ? $destination : null,
                    // Same campaign may be used on multiple communities.
                    'already_assigned' => $alreadyForCommunity,
                    'assigned_community_ids' => $communityIds,
                    'assigned_community_count' => count($communityIds),
                ];
            }),
            'type_filter' => $typeFilter,
            'rates_visible' => $showRates,
            'membership_role' => $membership->role,
            'shares_allowed' => true,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $publisher = PublisherAccess::publisher($request->user());
        $scopedIds = PublisherAccess::managedCommunityIds($request->user());

        $query = PublisherCampaignAssignment::query()
            ->where('publisher_id', $publisher->id)
            ->with([
                'program:id,title,pricing_model,promotion_type,status,rate_usd,post_url,listing_id',
                'program.listing:id,destination_url,status',
                'community:id,code,name',
            ]);

        if ($scopedIds !== null) {
            $query->whereIn('community_id', $scopedIds);
        }

        $showRates = PublisherAccess::isOwner($request->user());
        $rows = $query->latest()
            ->get()
            ->map(fn (PublisherCampaignAssignment $a) => $this->serializePublisher($a, $showRates));

        return $this->success(['assignments' => $rows]);
    }

    public function store(Request $request): JsonResponse
    {
        $membership = PublisherAccess::membership($request->user());
        $publisher = $membership->publisher;

        $data = $request->validate([
            'program_id' => ['required', 'integer', 'exists:programs,id'],
            'community_id' => ['nullable', 'integer'],
            'community_ids' => ['nullable', 'array', 'max:50'],
            'community_ids.*' => ['integer', 'min:1'],
            'notify_members' => ['nullable', 'boolean'],
        ]);

        $program = Program::query()->where('id', $data['program_id'])->where('status', 'active')->first();
        if (! $program) {
            return $this->error('INVALID_PROGRAM', 'Campaign is not available.', 422);
        }

        $communityIds = [];
        if (! empty($data['community_ids']) && is_array($data['community_ids'])) {
            $communityIds = array_values(array_unique(array_map('intval', $data['community_ids'])));
        } elseif (! empty($data['community_id'])) {
            $communityIds = [(int) $data['community_id']];
        }

        if ($communityIds === [] && ! $membership->isOwner()) {
            return $this->error('COMMUNITY_REQUIRED', 'Managers must assign campaigns to a community.', 422);
        }

        if ($communityIds === []) {
            // Owner may still assign network-wide (null community).
            $assignment = $this->upsertAssignment(
                $publisher->id,
                $program,
                null,
                (int) $request->user()->id,
            );
            $showRates = $membership->isOwner();

            return $this->success([
                'assignment' => $this->serializePublisher($assignment, $showRates),
                'assignments' => [$this->serializePublisher($assignment, $showRates)],
                'notified_members' => 0,
            ], 201);
        }

        $liveCommunities = PublisherCommunity::query()
            ->where('publisher_id', $publisher->id)
            ->where('status', 'active')
            ->whereIn('id', $communityIds)
            ->get()
            ->keyBy('id');

        $assignments = [];
        $notified = 0;
        $notify = array_key_exists('notify_members', $data)
            ? (bool) $data['notify_members']
            : true;

        foreach ($communityIds as $communityId) {
            $community = $liveCommunities->get($communityId);
            if (! $community) {
                return $this->error(
                    'INVALID_COMMUNITY',
                    'Pick only live communities you manage.',
                    422,
                );
            }
            PublisherAccess::assertCanAccessCommunity($request->user(), $communityId);

            $assignment = $this->upsertAssignment(
                $publisher->id,
                $program,
                $communityId,
                (int) $request->user()->id,
            );
            $assignments[] = $assignment;

            if ($notify) {
                $notified += $this->notifyCommunityMembers($community, $program);
            }
        }

        $showRates = $membership->isOwner();
        $serialized = array_map(
            fn (PublisherCampaignAssignment $a) => $this->serializePublisher($a, $showRates),
            $assignments,
        );

        return $this->success([
            'assignment' => $serialized[0] ?? null,
            'assignments' => $serialized,
            'notified_members' => $notified,
        ], 201);
    }

    private function upsertAssignment(
        int $publisherId,
        Program $program,
        ?int $communityId,
        int $assignedByUserId,
    ): PublisherCampaignAssignment {
        $existing = PublisherCampaignAssignment::query()
            ->where('publisher_id', $publisherId)
            ->where('program_id', $program->id)
            ->where(function ($q) use ($communityId) {
                if ($communityId) {
                    $q->where('community_id', $communityId);
                } else {
                    $q->whereNull('community_id');
                }
            })
            ->first();

        if ($existing) {
            $existing->update([
                'status' => 'active',
                'pricing_model' => $program->pricing_model,
                'accepted_rate_usd' => $existing->accepted_rate_usd ?? $program->rate_usd,
                'accepted_at' => $existing->accepted_at ?? now(),
            ]);

            return $existing->fresh(['program', 'community']);
        }

        return PublisherCampaignAssignment::create([
            'publisher_id' => $publisherId,
            'community_id' => $communityId,
            'program_id' => $program->id,
            'status' => 'active',
            'pricing_model' => $program->pricing_model,
            'accepted_rate_usd' => $program->rate_usd,
            'rate_version' => 1,
            'accepted_at' => now(),
            'assigned_by_user_id' => $assignedByUserId,
        ])->load(['program', 'community']);
    }

    private function notifyCommunityMembers(PublisherCommunity $community, Program $program): int
    {
        $userIds = CommunityMember::query()
            ->where('community_id', $community->id)
            ->where('status', 'active')
            ->with('networkMember:id,user_id,status')
            ->get()
            ->map(fn (CommunityMember $m) => (int) ($m->networkMember?->user_id ?? 0))
            ->filter(fn (int $id) => $id > 0)
            ->unique()
            ->values()
            ->all();

        if ($userIds === []) {
            return 0;
        }

        $users = User::query()->whereIn('id', $userIds)->get();
        $title = 'New campaign assigned';
        $body = sprintf(
            '"%s" was assigned to %s. Open Opportunities to start promoting.',
            $program->title,
            $community->name,
        );
        $sent = 0;
        foreach ($users as $user) {
            $this->notifications->notify(
                $user,
                'campaign_assigned',
                $title,
                $body,
                [
                    'program_id' => $program->id,
                    'community_id' => $community->id,
                    'community_name' => $community->name,
                ],
            );
            $sent++;
        }

        return $sent;
    }

    public function pause(Request $request, PublisherCampaignAssignment $assignment): JsonResponse
    {
        $publisher = PublisherAccess::publisher($request->user());
        if ((int) $assignment->publisher_id !== (int) $publisher->id) {
            return $this->error('FORBIDDEN', 'Assignment not found.', 404);
        }

        $scopedIds = PublisherAccess::managedCommunityIds($request->user());
        if ($scopedIds !== null) {
            if (! $assignment->community_id || ! in_array((int) $assignment->community_id, $scopedIds, true)) {
                return $this->error('FORBIDDEN', 'Assignment is outside your managed scope.', 403);
            }
        }

        $assignment->update(['status' => 'paused']);
        $showRates = PublisherAccess::isOwner($request->user());

        return $this->success([
            'assignment' => $this->serializePublisher(
                $assignment->fresh(['program', 'community']),
                $showRates,
            ),
        ]);
    }

    private function serializePublisher(PublisherCampaignAssignment $a, bool $showRates = true): array
    {
        $destination = trim((string) (
            $a->program?->post_url
            ?: $a->program?->listing?->destination_url
            ?: ''
        ));

        return [
            'id' => $a->id,
            'status' => $a->status,
            'pricing_model' => $showRates ? $a->pricing_model : null,
            'accepted_rate_usd' => $showRates ? $a->accepted_rate_usd : null,
            'rate_version' => $showRates ? $a->rate_version : null,
            'accepted_at' => optional($a->accepted_at)?->toIso8601String(),
            'destination_url' => $destination !== '' ? $destination : null,
            'program' => $a->program ? [
                'id' => $a->program->id,
                'title' => $a->program->title,
                'pricing_model' => $showRates ? $a->program->pricing_model : null,
                'status' => $a->program->status,
            ] : null,
            'community' => $a->community ? [
                'id' => $a->community->id,
                'code' => $a->community->code,
                'name' => $a->community->name,
            ] : null,
        ];
    }
}
