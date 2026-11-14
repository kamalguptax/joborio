<?php

namespace App\Support;

use App\Models\Publisher;
use App\Models\PublisherCommunity;
use App\Models\PublisherUser;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class PublisherAccess
{
    public static function membership(User $user): PublisherUser
    {
        $membership = $user->publisherUsers()
            ->where('is_active', true)
            ->with('publisher')
            ->first();

        if (! $membership || ! $membership->publisher) {
            throw ValidationException::withMessages([
                'publisher' => ['Publisher profile not found.'],
            ]);
        }

        return $membership;
    }

    public static function publisher(User $user): Publisher
    {
        return self::membership($user)->publisher;
    }

    public static function isOwner(User $user): bool
    {
        return self::membership($user)->isOwner();
    }

    public static function isManager(User $user): bool
    {
        $m = self::membership($user);

        return $m->role === 'manager';
    }

    /**
     * Community IDs a manager may access. Owners get null (= all).
     *
     * @return list<int>|null
     */
    public static function managedCommunityIds(User $user): ?array
    {
        $membership = self::membership($user);
        if ($membership->isOwner()) {
            return null;
        }

        return PublisherCommunity::query()
            ->where('publisher_id', $membership->publisher_id)
            ->where('manager_user_id', $user->id)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    public static function communitiesQuery(User $user): Builder
    {
        $membership = self::membership($user);
        $q = PublisherCommunity::query()->where('publisher_id', $membership->publisher_id);

        if (! $membership->isOwner()) {
            $q->where('manager_user_id', $user->id);
        }

        return $q;
    }

    public static function assertCanAccessCommunity(User $user, int $communityId): PublisherCommunity
    {
        $community = self::communitiesQuery($user)->where('id', $communityId)->first();
        if (! $community) {
            throw ValidationException::withMessages([
                'community_id' => ['Community not found or outside your managed scope.'],
            ]);
        }

        return $community;
    }

    public static function assertOwner(User $user, string $message = 'Only the publisher owner can perform this action.'): PublisherUser
    {
        $membership = self::membership($user);
        if (! $membership->isOwner()) {
            throw ValidationException::withMessages([
                'role' => [$message],
            ]);
        }

        return $membership;
    }

    /**
     * Managers may not access publisher financial / credential / account-admin APIs
     * unless explicitly authorized later.
     */
    public static function assertFinancialAccess(User $user): PublisherUser
    {
        return self::assertOwner(
            $user,
            'Publisher financial and credential APIs are restricted to the owner.',
        );
    }

    /**
     * @return Collection<int, int>
     */
    public static function scopedCommunityIdCollection(User $user): Collection
    {
        $ids = self::managedCommunityIds($user);

        return collect($ids ?? []);
    }
}
