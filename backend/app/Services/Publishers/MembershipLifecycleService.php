<?php

namespace App\Services\Publishers;

use App\Models\CommunityMember;
use App\Models\MemberSettlementRecord;
use App\Models\MembershipLifecycleEvent;
use App\Models\NetworkMember;
use App\Models\Publisher;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MembershipLifecycleService
{
    /**
     * Member-initiated leave. Distinct from publisher remove and formal release.
     * Historical activity is preserved; Creator onboarding remains blocked until release.
     */
    public function leave(NetworkMember $member, User $actor, ?string $notes = null): NetworkMember
    {
        if ($member->user_id !== $actor->id) {
            throw ValidationException::withMessages([
                'member' => ['You can only leave your own membership.'],
            ]);
        }

        if ($member->status !== 'active') {
            throw ValidationException::withMessages([
                'member' => ['Only active memberships can leave the network.'],
            ]);
        }

        return $this->transition($member, $actor, 'leave', 'removed', $notes, [
            'initiated_by' => 'member',
        ]);
    }

    /**
     * Publisher-initiated removal. Does not formally release Creator eligibility.
     */
    public function remove(NetworkMember $member, Publisher $publisher, User $actor, ?string $notes = null): NetworkMember
    {
        if ((int) $member->publisher_id !== (int) $publisher->id) {
            throw ValidationException::withMessages([
                'member' => ['Member does not belong to this publisher.'],
            ]);
        }

        if ($member->status !== 'active') {
            throw ValidationException::withMessages([
                'member' => ['Only active members can be removed.'],
            ]);
        }

        return $this->transition($member, $actor, 'remove', 'removed', $notes, [
            'initiated_by' => 'publisher',
        ]);
    }

    /**
     * Formal release after leave/remove. Unlocks independent Creator registration
     * when no other non-released memberships remain.
     */
    public function release(
        NetworkMember $member,
        Publisher $publisher,
        User $actor,
        ?string $notes = null,
        bool $settlePending = false,
    ): NetworkMember {
        if ((int) $member->publisher_id !== (int) $publisher->id) {
            throw ValidationException::withMessages([
                'member' => ['Member does not belong to this publisher.'],
            ]);
        }

        if (! in_array($member->status, ['removed', 'active'], true)) {
            throw ValidationException::withMessages([
                'member' => ['Membership is already released or cannot be released from this status.'],
            ]);
        }

        $pending = MemberSettlementRecord::query()
            ->where('network_member_id', $member->id)
            ->where('status', 'pending')
            ->count();

        if ($pending > 0 && ! $settlePending) {
            throw ValidationException::withMessages([
                'settlement' => [
                    "{$pending} pending member settlement record(s) must be settled or cancelled before release. Pass settle_pending=true to mark them settled.",
                ],
            ]);
        }

        return DB::transaction(function () use ($member, $publisher, $actor, $notes, $settlePending, $pending) {
            if ($pending > 0 && $settlePending) {
                MemberSettlementRecord::query()
                    ->where('network_member_id', $member->id)
                    ->where('status', 'pending')
                    ->get()
                    ->each(function (MemberSettlementRecord $row) {
                        $note = trim((string) $row->notes);
                        $row->update([
                            'status' => 'settled',
                            'settled_at' => now(),
                            'notes' => $note === ''
                                ? 'Auto-settled on membership release'
                                : $note.' | Auto-settled on membership release',
                        ]);
                    });
            }

            $updated = $this->transition($member, $actor, 'release', 'released', $notes, [
                'initiated_by' => 'publisher',
                'pending_settlements_settled' => $pending > 0 && $settlePending,
            ]);

            $this->maybeDropNetworkRole($updated->user_id);

            return $updated;
        });
    }

    private function transition(
        NetworkMember $member,
        User $actor,
        string $action,
        string $toStatus,
        ?string $notes,
        array $meta,
    ): NetworkMember {
        return DB::transaction(function () use ($member, $actor, $action, $toStatus, $notes, $meta) {
            $from = $member->status;

            $payload = [
                'status' => $toStatus,
            ];

            if ($toStatus === 'removed') {
                $payload['left_at'] = $member->left_at ?? now();
            }

            if ($toStatus === 'released') {
                $payload['left_at'] = $member->left_at ?? now();
                $payload['released_at'] = now();
            }

            $member->fill($payload)->save();

            // End community memberships without deleting historical rows.
            CommunityMember::query()
                ->where('network_member_id', $member->id)
                ->where('status', 'active')
                ->update(['status' => $toStatus === 'released' ? 'released' : 'ended']);

            MembershipLifecycleEvent::create([
                'publisher_id' => $member->publisher_id,
                'network_member_id' => $member->id,
                'actor_user_id' => $actor->id,
                'action' => $action,
                'from_status' => $from,
                'to_status' => $toStatus,
                'notes' => $notes,
                'meta' => $meta,
            ]);

            return $member->fresh([
                'publisher:id,code,display_name',
                'user:id,name,email',
            ]);
        });
    }

    private function maybeDropNetworkRole(int $userId): void
    {
        $blocking = NetworkMember::query()
            ->where('user_id', $userId)
            ->whereIn('status', ['active', 'removed'])
            ->exists();

        if ($blocking) {
            return;
        }

        $user = User::query()->find($userId);
        if ($user && $user->hasRole('network_member')) {
            $user->removeRole('network_member');
        }
    }
}
