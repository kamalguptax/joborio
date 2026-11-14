<?php

namespace App\Http\Controllers\Api\V1\Publisher;

use App\Http\Controllers\Controller;
use App\Models\PublisherInvitation;
use App\Support\ApiResponse;
use App\Support\PublisherAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvitationController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $publisher = PublisherAccess::publisher($request->user());
        $scopedIds = PublisherAccess::managedCommunityIds($request->user());

        $query = $publisher->invitations()->with('community:id,code,name');
        if ($scopedIds !== null) {
            $query->whereIn('community_id', $scopedIds);
        }

        $rows = $query->latest()
            ->limit(50)
            ->get()
            ->map(fn (PublisherInvitation $i) => $this->serialize($i));

        return $this->success(['invitations' => $rows]);
    }

    public function store(Request $request): JsonResponse
    {
        $membership = PublisherAccess::membership($request->user());
        $publisher = $membership->publisher;

        $data = $request->validate([
            'community_id' => [$membership->isOwner() ? 'nullable' : 'required', 'integer'],
            'email' => ['nullable', 'email', 'max:255'],
            'channel' => ['nullable', 'string', 'in:link,email'],
            'expires_in_days' => ['nullable', 'integer', 'min:1', 'max:90'],
        ]);

        $communityId = null;
        if (! empty($data['community_id'])) {
            PublisherAccess::assertCanAccessCommunity($request->user(), (int) $data['community_id']);
            $communityId = (int) $data['community_id'];
        } elseif (! $membership->isOwner()) {
            return $this->error('COMMUNITY_REQUIRED', 'Managers must invite into an assigned community.', 422);
        }

        $days = (int) ($data['expires_in_days'] ?? 14);
        $invite = PublisherInvitation::create([
            'publisher_id' => $publisher->id,
            'community_id' => $communityId,
            'token' => PublisherInvitation::makeToken(),
            'email' => isset($data['email']) ? strtolower(trim($data['email'])) : null,
            'channel' => $data['channel'] ?? 'link',
            'status' => 'pending',
            'created_by_user_id' => $request->user()->id,
            'expires_at' => now()->addDays($days),
        ]);

        $invite->load('community:id,code,name', 'publisher:id,code');

        $frontend = rtrim((string) env('FRONTEND_URL', 'http://localhost:3000'), '/');

        return $this->success([
            'invitation' => $this->serialize($invite),
            'invite_url' => $frontend.$invite->invitePath(),
        ], 201);
    }

    public function members(Request $request): JsonResponse
    {
        $publisher = PublisherAccess::publisher($request->user());
        $scopedIds = PublisherAccess::managedCommunityIds($request->user());

        $query = $publisher->networkMembers()->with('user:id,name,email');
        if ($scopedIds !== null) {
            if ($scopedIds === []) {
                return $this->success(['members' => []]);
            }
            $query->whereHas('communityMemberships', function ($q) use ($scopedIds) {
                $q->whereIn('community_id', $scopedIds)
                    ->whereIn('status', ['active', 'ended', 'released']);
            });
        }

        $rows = $query->latest()
            ->limit(100)
            ->get()
            ->map(fn ($m) => [
                'id' => $m->id,
                'display_name' => $m->display_name ?: $m->user?->name,
                'email' => $m->user?->email,
                'status' => $m->status,
                'joined_at' => optional($m->joined_at)?->toIso8601String(),
                'left_at' => optional($m->left_at)?->toIso8601String(),
                'released_at' => optional($m->released_at)?->toIso8601String(),
            ]);

        return $this->success(['members' => $rows]);
    }

    /**
     * CSV bulk invitations.
     * Expected headers: email (required), community_code (optional)
     * Safe to retry: duplicate pending emails for same publisher+community are skipped.
     */
    public function importCsv(Request $request): JsonResponse
    {
        $membership = PublisherAccess::membership($request->user());
        $publisher = $membership->publisher;

        $data = $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:2048'],
            'community_id' => [$membership->isOwner() ? 'nullable' : 'required', 'integer'],
            'expires_in_days' => ['nullable', 'integer', 'min:1', 'max:90'],
        ]);

        $defaultCommunityId = null;
        if (! empty($data['community_id'])) {
            $community = PublisherAccess::assertCanAccessCommunity(
                $request->user(),
                (int) $data['community_id'],
            );
            $defaultCommunityId = $community->id;
        } elseif (! $membership->isOwner()) {
            return $this->error('COMMUNITY_REQUIRED', 'Managers must import into an assigned community.', 422);
        }

        $communitiesByCode = PublisherAccess::communitiesQuery($request->user())
            ->get(['id', 'code'])
            ->keyBy(fn ($c) => strtoupper((string) $c->code));

        $handle = fopen($data['file']->getRealPath(), 'r');
        if ($handle === false) {
            return $this->error('CSV_READ_FAILED', 'Could not read CSV file.', 422);
        }

        $header = null;
        $rowNum = 0;
        $created = 0;
        $skipped = 0;
        $errors = [];
        $days = (int) ($data['expires_in_days'] ?? 14);
        $frontend = rtrim((string) env('FRONTEND_URL', 'http://localhost:3000'), '/');
        $createdUrls = [];

        while (($cols = fgetcsv($handle)) !== false) {
            $rowNum++;
            if ($rowNum === 1) {
                $header = array_map(fn ($h) => strtolower(trim((string) $h)), $cols);
                if (! in_array('email', $header, true)) {
                    fclose($handle);

                    return $this->error(
                        'CSV_HEADER',
                        'CSV must include an email column. Optional: community_code',
                        422,
                    );
                }
                continue;
            }

            if ($cols === [null] || (count($cols) === 1 && trim((string) $cols[0]) === '')) {
                continue;
            }

            $assoc = [];
            foreach ($header as $i => $key) {
                $assoc[$key] = isset($cols[$i]) ? trim((string) $cols[$i]) : '';
            }

            $email = strtolower($assoc['email'] ?? '');
            if ($email === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $errors[] = ['row' => $rowNum, 'email' => $email, 'error' => 'Invalid email.'];
                continue;
            }

            $communityId = $defaultCommunityId;
            $code = strtoupper($assoc['community_code'] ?? '');
            if ($code !== '') {
                $match = $communitiesByCode->get($code);
                if (! $match) {
                    $errors[] = [
                        'row' => $rowNum,
                        'email' => $email,
                        'error' => "Unknown community_code: {$code}",
                    ];
                    continue;
                }
                $communityId = $match->id;
            }

            $duplicate = PublisherInvitation::query()
                ->where('publisher_id', $publisher->id)
                ->where('email', $email)
                ->where('status', 'pending')
                ->where(function ($q) use ($communityId) {
                    if ($communityId) {
                        $q->where('community_id', $communityId);
                    } else {
                        $q->whereNull('community_id');
                    }
                })
                ->exists();

            if ($duplicate) {
                $skipped++;
                continue;
            }

            $invite = PublisherInvitation::create([
                'publisher_id' => $publisher->id,
                'community_id' => $communityId,
                'token' => PublisherInvitation::makeToken(),
                'email' => $email,
                'channel' => 'csv',
                'status' => 'pending',
                'created_by_user_id' => $request->user()->id,
                'expires_at' => now()->addDays($days),
            ]);
            $invite->load('community:id,code,name', 'publisher:id,code');
            $created++;
            if (count($createdUrls) < 20) {
                $createdUrls[] = [
                    'email' => $email,
                    'invite_url' => $frontend.$invite->invitePath(),
                ];
            }
        }

        fclose($handle);

        return $this->success([
            'summary' => [
                'created' => $created,
                'skipped_duplicates' => $skipped,
                'failed' => count($errors),
                'rows_processed' => max(0, $rowNum - 1),
            ],
            'errors' => $errors,
            'sample_invites' => $createdUrls,
        ], 201);
    }

    private function serialize(PublisherInvitation $i): array
    {
        return [
            'id' => $i->id,
            'token' => $i->token,
            'email' => $i->email,
            'channel' => $i->channel,
            'status' => $i->status,
            'expires_at' => optional($i->expires_at)?->toIso8601String(),
            'accepted_at' => optional($i->accepted_at)?->toIso8601String(),
            'community' => $i->community ? [
                'id' => $i->community->id,
                'code' => $i->community->code,
                'name' => $i->community->name,
            ] : null,
            'path' => $i->invitePath(),
            'created_at' => optional($i->created_at)?->toIso8601String(),
        ];
    }
}
