<?php

namespace App\Http\Controllers\Api\V1\Publisher;

use App\Http\Controllers\Controller;
use App\Models\PublisherCommunity;
use App\Models\PublisherInvitation;
use App\Models\PublisherUser;
use App\Support\ApiResponse;
use App\Support\PublisherAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
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
            'category' => ['nullable', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:2000'],
            'country_code' => ['nullable', 'string', 'in:IN,AE,US'],
            'campaign_access' => ['nullable', 'string', 'in:all_eligible,selected'],
            'status' => ['nullable', 'string', 'in:active,paused'],
            'manager_user_id' => ['nullable', 'integer'],
        ]);

        $managerId = $this->resolveManagerId($publisher->id, $data['manager_user_id'] ?? null);

        $community = $publisher->communities()->create([
            'code' => $this->uniqueCode($publisher->id),
            'name' => trim($data['name']),
            'category' => $data['category'] ?? null,
            'description' => $data['description'] ?? null,
            'country_code' => $data['country_code'] ?? $publisher->country_code,
            'campaign_access' => $data['campaign_access'] ?? 'all_eligible',
            'status' => $data['status'] ?? 'active',
            'manager_user_id' => $managerId,
        ]);

        $this->ensureCommunityJoinInvite($community, $request->user()->id);

        return $this->success([
            'community' => $this->serialize($community->load('manager:id,name,email')),
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
            'category' => ['nullable', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:2000'],
            'country_code' => ['nullable', 'string', 'in:IN,AE,US'],
            'campaign_access' => ['nullable', 'string', 'in:all_eligible,selected'],
            'status' => ['nullable', 'string', 'in:active,paused'],
        ];

        if ($membership->isOwner()) {
            $rules['manager_user_id'] = ['nullable', 'integer'];
        }

        $data = $request->validate($rules);

        if ($membership->isOwner() && array_key_exists('manager_user_id', $data)) {
            $data['manager_user_id'] = $this->resolveManagerId(
                $publisher->id,
                $data['manager_user_id'],
            );
        } else {
            unset($data['manager_user_id']);
        }

        $community->fill($data)->save();

        return $this->success([
            'community' => $this->serialize($community->fresh()->load('manager:id,name,email')),
        ]);
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

    private function serialize(PublisherCommunity $c): array
    {
        $invite = $this->ensureCommunityJoinInvite($c);

        return [
            'id' => $c->id,
            'code' => $c->code,
            'name' => $c->name,
            'category' => $c->category,
            'description' => $c->description,
            'country_code' => $c->country_code,
            'campaign_access' => $c->campaign_access,
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
