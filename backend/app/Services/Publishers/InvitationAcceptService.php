<?php

namespace App\Services\Publishers;

use App\Models\CommunityMember;
use App\Models\NetworkMember;
use App\Models\PublisherInvitation;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InvitationAcceptService
{
    public function findUsable(string $token): PublisherInvitation
    {
        $invite = PublisherInvitation::query()
            ->with(['publisher:id,code,display_name,username,status', 'community:id,code,name,status,publisher_id'])
            ->where('token', $token)
            ->first();

        if (! $invite) {
            throw ValidationException::withMessages([
                'token' => ['Invitation not found.'],
            ]);
        }

        if ($invite->expires_at && $invite->expires_at->isPast() && $invite->status === 'pending') {
            $invite->update(['status' => 'expired']);
        }

        if (! $invite->isUsable()) {
            throw ValidationException::withMessages([
                'token' => ['This invitation is no longer valid.'],
            ]);
        }

        return $invite;
    }

    /**
     * Accept invite as a private network member (not a public creator).
     * Members may join multiple communities under the same publisher via separate invites.
     *
     * @return array{
     *   member: NetworkMember,
     *   invitation: PublisherInvitation,
     *   added_community: bool,
     *   already_in_community: bool,
     *   is_returning_member: bool,
     *   communities_count: int
     * }
     */
    public function accept(User $user, string $token): array
    {
        return DB::transaction(function () use ($user, $token) {
            $invite = PublisherInvitation::query()
                ->where('token', $token)
                ->lockForUpdate()
                ->first();

            if (! $invite || ! $invite->isUsable()) {
                throw ValidationException::withMessages([
                    'token' => ['This invitation is no longer valid.'],
                ]);
            }

            if ($invite->email && strcasecmp((string) $invite->email, (string) $user->email) !== 0) {
                throw ValidationException::withMessages([
                    'email' => ['Sign in with the invited email address to accept this invite.'],
                ]);
            }

            // One active parent publisher per member (initial version).
            $existingOther = NetworkMember::query()
                ->where('user_id', $user->id)
                ->where('status', 'active')
                ->where('publisher_id', '!=', $invite->publisher_id)
                ->exists();

            if ($existingOther) {
                throw ValidationException::withMessages([
                    'publisher' => ['You already belong to another publisher network.'],
                ]);
            }

            $existingMember = NetworkMember::query()
                ->where('user_id', $user->id)
                ->where('publisher_id', $invite->publisher_id)
                ->first();

            $isReturningMember = $existingMember !== null
                && $existingMember->status === 'active';

            $member = $existingMember ?? new NetworkMember([
                'user_id' => $user->id,
                'publisher_id' => $invite->publisher_id,
            ]);

            $member->fill([
                'display_name' => $user->name,
                'status' => 'active',
                'joined_at' => $member->joined_at ?? now(),
                'left_at' => null,
                'released_at' => null,
            ])->save();

            $addedCommunity = false;
            $alreadyInCommunity = false;

            if ($invite->community_id) {
                $cm = CommunityMember::query()
                    ->where('community_id', $invite->community_id)
                    ->where('network_member_id', $member->id)
                    ->first();

                if ($cm && $cm->status === 'active') {
                    $alreadyInCommunity = true;
                } else {
                    CommunityMember::query()->updateOrCreate(
                        [
                            'community_id' => $invite->community_id,
                            'network_member_id' => $member->id,
                        ],
                        [
                            'status' => 'active',
                            // Keep original join date when reactivating the same community.
                            'joined_at' => $cm?->joined_at ?? now(),
                        ],
                    );
                    $addedCommunity = true;
                }
            }

            if (! $user->hasRole('network_member')) {
                $user->assignRole('network_member');
            }

            // Community share links stay reusable; one-off email/link invites are single-use.
            if ($invite->channel === 'community_link') {
                $invite->update([
                    'accepted_by_user_id' => $user->id,
                    'accepted_at' => now(),
                ]);
            } else {
                $invite->update([
                    'status' => 'accepted',
                    'accepted_by_user_id' => $user->id,
                    'accepted_at' => now(),
                ]);
            }

            $member->load([
                'publisher:id,code,display_name,username',
                'communityMemberships' => fn ($q) => $q->where('status', 'active'),
                'communityMemberships.community:id,code,name,status',
            ]);

            return [
                'member' => $member,
                'invitation' => $invite->fresh(['community:id,code,name', 'publisher:id,code']),
                'added_community' => $addedCommunity,
                'already_in_community' => $alreadyInCommunity,
                'is_returning_member' => $isReturningMember,
                'communities_count' => $member->communityMemberships->count(),
            ];
        });
    }
}
