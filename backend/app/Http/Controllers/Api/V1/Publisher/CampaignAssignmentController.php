<?php

namespace App\Http\Controllers\Api\V1\Publisher;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Models\PublisherCampaignAssignment;
use App\Support\ApiResponse;
use App\Support\PublisherAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CampaignAssignmentController extends Controller
{
    use ApiResponse;

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
                'program:id,title,pricing_model,promotion_type,status,rate_usd',
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
            'community_id' => [$membership->isOwner() ? 'nullable' : 'required', 'integer'],
        ]);

        $program = Program::query()->where('id', $data['program_id'])->where('status', 'active')->first();
        if (! $program) {
            return $this->error('INVALID_PROGRAM', 'Campaign is not available.', 422);
        }

        $communityId = null;
        if (! empty($data['community_id'])) {
            PublisherAccess::assertCanAccessCommunity($request->user(), (int) $data['community_id']);
            $communityId = (int) $data['community_id'];
        } elseif (! $membership->isOwner()) {
            return $this->error('COMMUNITY_REQUIRED', 'Managers must assign campaigns to an assigned community.', 422);
        }

        $existing = PublisherCampaignAssignment::query()
            ->where('publisher_id', $publisher->id)
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
                // Keep locked accepted rate if already set.
                'accepted_rate_usd' => $existing->accepted_rate_usd ?? $program->rate_usd,
                'accepted_at' => $existing->accepted_at ?? now(),
            ]);
            $assignment = $existing->fresh(['program', 'community']);
        } else {
            $assignment = PublisherCampaignAssignment::create([
                'publisher_id' => $publisher->id,
                'community_id' => $communityId,
                'program_id' => $program->id,
                'status' => 'active',
                'pricing_model' => $program->pricing_model,
                'accepted_rate_usd' => $program->rate_usd,
                'rate_version' => 1,
                'accepted_at' => now(),
                'assigned_by_user_id' => $request->user()->id,
            ])->load(['program', 'community']);
        }

        $showRates = $membership->isOwner();

        return $this->success([
            'assignment' => $this->serializePublisher($assignment, $showRates),
        ], 201);
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
        return [
            'id' => $a->id,
            'status' => $a->status,
            'pricing_model' => $showRates ? $a->pricing_model : null,
            'accepted_rate_usd' => $showRates ? $a->accepted_rate_usd : null,
            'rate_version' => $showRates ? $a->rate_version : null,
            'accepted_at' => optional($a->accepted_at)?->toIso8601String(),
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
