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

            $member = NetworkMember::query()->firstOrNew([
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

            if ($invite->community_id) {
                CommunityMember::query()->updateOrCreate(
                    [
                        'community_id' => $invite->community_id,
                        'network_member_id' => $member->id,
                    ],
                    [
                        'status' => 'active',
                        'joined_at' => now(),
                    ],
                );
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
                'communityMemberships.community:id,code,name,status',
            ]);

            return [
                'member' => $member,
                'invitation' => $invite->fresh(['community:id,code,name', 'publisher:id,code']),
            ];
        });
    }
}
