<?php

namespace App\Http\Controllers\Api\V1\Publisher;

use App\Http\Controllers\Controller;
use App\Models\MemberSettlementRecord;
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

        $data = $request->validate([
            'community_id' => ['nullable', 'integer'],
        ]);

        $query = $publisher->invitations()->with('community:id,code,name');
        if ($scopedIds !== null) {
            $query->whereIn('community_id', $scopedIds);
        }
        if (! empty($data['community_id'])) {
            PublisherAccess::assertCanAccessCommunity($request->user(), (int) $data['community_id']);
            $query->where('community_id', (int) $data['community_id']);
        }

        $rows = $query->latest()
            ->limit(100)
            ->get()
            ->map(fn (PublisherInvitation $i) => $this->serialize($i));

        return $this->success(['invitations' => $rows]);
    }

    public function store(Request $request): JsonResponse
    {
        $membership = PublisherAccess::membership($request->user());
        $publisher = $membership->publisher;

        $data = $request->validate([
            'community_id' => ['required', 'integer'],
            'email' => ['nullable', 'email', 'max:255'],
            'channel' => ['nullable', 'string', 'in:link,email,community_link'],
            'expires_in_days' => ['nullable', 'integer', 'min:1', 'max:90'],
        ]);

        PublisherAccess::assertCanAccessCommunity($request->user(), (int) $data['community_id']);
        $communityId = (int) $data['community_id'];

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
        $membership = PublisherAccess::membership($request->user());
        $publisher = $membership->publisher;
        $scopedIds = PublisherAccess::managedCommunityIds($request->user());
        $canViewEarnings = $membership->isOwner();

        $data = $request->validate([
            'community_id' => ['nullable', 'integer'],
        ]);

        $communityId = ! empty($data['community_id']) ? (int) $data['community_id'] : null;

        $query = $publisher->networkMembers()->with([
            'user:id,name,email',
            'communityMemberships.community:id,code,name',
        ]);
        if ($scopedIds !== null) {
            if ($scopedIds === []) {
                return $this->success([
                    'members' => [],
                    'can_view_earnings' => false,
                ]);
            }
            $query->whereHas('communityMemberships', function ($q) use ($scopedIds) {
                $q->whereIn('community_id', $scopedIds)
                    ->whereIn('status', ['active', 'ended', 'released']);
            });
        }
        if ($communityId) {
            PublisherAccess::assertCanAccessCommunity($request->user(), $communityId);
            $query->whereHas('communityMemberships', function ($q) use ($communityId) {
                $q->where('community_id', $communityId)
                    ->whereIn('status', ['active', 'ended', 'released']);
            });
        }

        $members = $query->latest()->limit(200)->get();
        $memberIds = $members->pluck('id')->all();

        $earningsByMember = [];
        if ($canViewEarnings && $memberIds !== []) {
            $settlementQuery = MemberSettlementRecord::query()
                ->where('publisher_id', $publisher->id)
                ->whereIn('network_member_id', $memberIds)
                ->whereIn('status', ['pending', 'settled']);
            if ($communityId) {
                $settlementQuery->where('community_id', $communityId);
            }

            $aggregates = $settlementQuery
                ->selectRaw('network_member_id, status, COALESCE(SUM(amount_usd), 0) as total')
                ->groupBy('network_member_id', 'status')
                ->get();

            foreach ($aggregates as $row) {
                $id = (int) $row->network_member_id;
                if (! isset($earningsByMember[$id])) {
                    $earningsByMember[$id] = [
                        'settled_usd' => 0.0,
                        'pending_usd' => 0.0,
                    ];
                }
                if ($row->status === 'settled') {
                    $earningsByMember[$id]['settled_usd'] = round((float) $row->total, 4);
                } elseif ($row->status === 'pending') {
                    $earningsByMember[$id]['pending_usd'] = round((float) $row->total, 4);
                }
            }
        }

        $rows = $members->map(function ($m) use ($canViewEarnings, $earningsByMember) {
            $earn = $earningsByMember[$m->id] ?? ['settled_usd' => 0.0, 'pending_usd' => 0.0];
            $settled = $earn['settled_usd'];
            $pending = $earn['pending_usd'];

            return [
                'id' => $m->id,
                'display_name' => $m->display_name ?: $m->user?->name,
                'email' => $m->user?->email,
                'status' => $m->status,
                'joined_at' => optional($m->joined_at)?->toIso8601String(),
                'left_at' => optional($m->left_at)?->toIso8601String(),
                'released_at' => optional($m->released_at)?->toIso8601String(),
                'communities' => $m->communityMemberships
                    ->filter(fn ($cm) => $cm->community)
                    ->map(fn ($cm) => [
                        'id' => $cm->community->id,
                        'code' => $cm->community->code,
                        'name' => $cm->community->name,
                        'status' => $cm->status,
                    ])
                    ->values()
                    ->all(),
                'earnings' => $canViewEarnings ? [
                    'settled_usd' => $settled,
                    'pending_usd' => $pending,
                    'total_usd' => round($settled + $pending, 4),
                    'currency' => 'USD',
                ] : null,
            ];
        });

        return $this->success([
            'members' => $rows,
            'can_view_earnings' => $canViewEarnings,
        ]);
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
