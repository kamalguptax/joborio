<?php

namespace App\Http\Controllers\Api\V1\Publisher;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Models\PublisherCampaignAssignment;
use App\Models\PublisherCommission;
use App\Models\PublisherCommunity;
use App\Models\PublisherInvitation;
use App\Models\PublisherUser;
use App\Support\ApiResponse;
use App\Support\PublisherAccess;
use App\Support\PublisherCommissionSplit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CommunityController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $membership = PublisherAccess::membership($request->user());

        $rows = PublisherAccess::communitiesQuery($request->user())
            ->withCount(['members as members_count' => fn ($q) => $q->where('status', 'active')])
            ->with('manager:id,name,email')
            ->latest()
            ->get()
            ->map(fn (PublisherCommunity $c) => $this->serialize($c));

        return $this->success([
            'communities' => $rows,
            'membership_role' => $membership->role,
            'scope' => $membership->isOwner() ? 'all' : 'assigned',
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
        $xmlJobRefs = $this->normalizeXmlJobRefs($data['xml_job_refs'] ?? []);
        if ($programIds === [] && $xmlJobRefs === []) {
            return $this->error(
                'VALIDATION_ERROR',
                'Pick at least one campaign, manual job, or XML job for this community.',
                422,
                [
                    'program_ids' => ['Pick at least one campaign, manual job, or XML job.'],
                    'xml_job_refs' => ['Pick at least one campaign, manual job, or XML job.'],
                ],
            );
        }
        $category = $this->normalizeCategories(
            $data['categories'] ?? null,
            $data['category'] ?? null,
        );
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

        if (array_key_exists('xml_job_refs', $data)) {
            $data['xml_job_refs'] = $this->normalizeXmlJobRefs($data['xml_job_refs'] ?? []);
            if ($data['xml_job_refs'] === []) {
                $data['xml_job_refs'] = null;
            }
        }

        if (array_key_exists('categories', $data) || array_key_exists('category', $data)) {
            $data['category'] = $this->normalizeCategories(
                $data['categories'] ?? null,
                $data['category'] ?? null,
            );
            unset($data['categories']);
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
