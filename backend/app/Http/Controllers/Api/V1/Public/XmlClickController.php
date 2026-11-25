<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\AttributionEvent;
use App\Models\Creator;
use App\Models\NetworkMember;
use App\Models\PublisherCampaignAssignment;
use App\Models\User;
use App\Services\Earnings\EarningLedgerService;
use App\Services\Publishers\MemberActivityService;
use App\Support\ClickContext;
use App\Support\ClickDedup;
use App\Support\JobSubid;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class XmlClickController extends Controller
{
    public function __construct(
        private EarningLedgerService $earnings,
        private MemberActivityService $memberActivity,
    ) {}

    public function show(Request $request, string $code): RedirectResponse
    {
        $rawTo = (string) $request->query('to', '');
        $referenceId = (string) $request->query('ref', '');
        $user = User::findByPublicCode($code);
        $member = $this->activeNetworkMember($user);

        $destination = $this->resolveDestination($rawTo, $member, $referenceId);
        if ($destination === null) {
            abort(404);
        }

        $creator = $user?->creator;
        $affiliateCode = $user?->public_code ?: strtoupper($code);
        $outbound = JobSubid::append($destination, $affiliateCode);

        if ($member) {
            $this->recordMemberClick($request, $member, $outbound, $affiliateCode, $referenceId);
        }

        if ($creator) {
            $this->recordClick($request, $creator->id, $outbound, $affiliateCode, $referenceId);
        }

        return redirect()->away($outbound);
    }

    private function activeNetworkMember(?User $user): ?NetworkMember
    {
        if (! $user) {
            return null;
        }

        return NetworkMember::query()
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->first();
    }

    private function resolveDestination(string $url, ?NetworkMember $member, string $referenceId): ?string
    {
        $syndication = $this->syndicationDestination($url);
        if ($syndication !== null) {
            return $syndication;
        }

        if (! $member || $url === '') {
            return null;
        }

        // Network members may share assigned campaign destinations (any https host).
        return $this->assignedCampaignDestination($member, $url, $referenceId);
    }

    private function syndicationDestination(string $url): ?string
    {
        $parts = parse_url($url);
        if (! is_array($parts) || ($parts['scheme'] ?? '') !== 'https' || empty($parts['host'])) {
            return null;
        }

        $host = strtolower((string) $parts['host']);
        $allowed = $host === 'whatjobs.com'
            || str_ends_with($host, '.whatjobs.com')
            || $host === 'jobrapido.com'
            || str_ends_with($host, '.jobrapido.com');

        return $allowed ? $url : null;
    }

    private function assignedCampaignDestination(NetworkMember $member, string $url, string $referenceId): ?string
    {
        $parts = parse_url($url);
        if (! is_array($parts) || ($parts['scheme'] ?? '') !== 'https' || empty($parts['host'])) {
            return null;
        }

        $normalized = $this->normalizeUrl($url);
        $assignmentId = null;
        if (preg_match('/^assignment:(\d+)$/', $referenceId, $m) === 1) {
            $assignmentId = (int) $m[1];
        }

        $communityIds = $member->communityMemberships()
            ->where('status', 'active')
            ->pluck('community_id')
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->all();

        $query = PublisherCampaignAssignment::query()
            ->where('publisher_id', $member->publisher_id)
            ->where('status', 'active')
            ->where(function ($q) use ($communityIds) {
                $q->whereNull('community_id');
                if ($communityIds !== []) {
                    $q->orWhereIn('community_id', $communityIds);
                }
            })
            ->with([
                'program:id,post_url,listing_id,status',
                'program.listing:id,destination_url,status',
            ]);

        if ($assignmentId) {
            $query->where('id', $assignmentId);
        }

        foreach ($query->get() as $assignment) {
            $program = $assignment->program;
            if (! $program || ($program->status ?? '') !== 'active') {
                continue;
            }
            foreach ([$program->post_url, $program->listing?->destination_url] as $candidate) {
                $candidate = trim((string) $candidate);
                if ($candidate !== '' && $this->normalizeUrl($candidate) === $normalized) {
                    return $url;
                }
            }
        }

        return null;
    }

    private function normalizeUrl(string $url): string
    {
        $parts = parse_url($url);
        if (! is_array($parts) || empty($parts['host'])) {
            return strtolower(rtrim($url, '/'));
        }

        $host = strtolower((string) $parts['host']);
        $path = $parts['path'] ?? '/';
        $query = isset($parts['query']) ? '?'.$parts['query'] : '';

        return $host.$path.$query;
    }

    private function recordMemberClick(
        Request $request,
        NetworkMember $member,
        string $outbound,
        string $code,
        string $referenceId = '',
    ): void {
        $windowStart = now()->subMinutes((int) config('joborio.click_dedup_minutes', 10));
        $ip = ClickContext::ip($request);
        $jobKey = ClickDedup::jobKey($referenceId !== '' ? $referenceId : null, $outbound);

        $recent = DB::table('member_activity_events')
            ->where('network_member_id', $member->id)
            ->where('activity_type', 'click')
            ->where('occurred_at', '>=', $windowStart)
            ->orderByDesc('id')
            ->limit(40)
            ->get(['meta']);

        foreach ($recent as $row) {
            $meta = is_string($row->meta) ? json_decode($row->meta, true) : (array) $row->meta;
            if (
                ($meta['job_key'] ?? null) === $jobKey
                && ($meta['ip_address'] ?? null) === $ip
            ) {
                return;
            }
        }

        $assignmentId = null;
        $communityId = null;
        if (preg_match('/^assignment:(\d+)$/', $referenceId, $m) === 1) {
            $assignmentId = (int) $m[1];
            $assignment = PublisherCampaignAssignment::query()
                ->where('id', $assignmentId)
                ->where('publisher_id', $member->publisher_id)
                ->first(['id', 'community_id']);
            $communityId = $assignment?->community_id;
        }

        if (! $communityId) {
            $communityId = $member->communityMemberships()
                ->where('status', 'active')
                ->value('community_id');
        }

        $this->memberActivity->record($member, [
            'activity_type' => 'click',
            'tracking_id' => $code,
            'campaign_assignment_id' => $assignmentId,
            'community_id' => $communityId ? (int) $communityId : null,
            'meta' => [
                'destination' => $outbound,
                'reference_id' => $referenceId !== '' ? $referenceId : null,
                'job_key' => $jobKey,
                'subid' => $code,
                'title' => $request->query('title'),
                'source' => 'network_share',
                'ip_address' => $ip,
                'clicked_at' => ClickContext::clickedAt(),
                'user_agent' => $request->userAgent(),
            ],
            'status' => 'counted',
            'occurred_at' => now(),
        ]);
    }

    private function recordClick(Request $request, int $creatorId, string $outbound, string $code, string $referenceId = ''): void
    {
        $windowStart = now()->subMinutes((int) config('joborio.click_dedup_minutes', 10));
        $ip = ClickContext::ip($request);
        $clickedAt = ClickContext::clickedAt();
        $jobKey = ClickDedup::jobKey($referenceId !== '' ? $referenceId : null, $outbound);
        $duplicateOf = ClickDedup::original($creatorId, $ip, $jobKey, $windowStart);

        if ($duplicateOf) {
            // Same job + IP inside the dedup window: do not log another click row.
            return;
        }

        $event = AttributionEvent::create([
            'creator_id' => $creatorId,
            'event_type' => 'click',
            'ip_address' => $ip,
            'referrer' => $request->headers->get('referer'),
            'is_counted' => true,
            'fraud_status' => 'clean',
            'meta' => [
                'destination' => $outbound,
                'reference_id' => $referenceId !== '' ? $referenceId : null,
                'job_key' => $jobKey,
                'subid' => $code,
                'title' => $request->query('title'),
                'source' => 'xml_share',
                'clicked_at' => $clickedAt,
                'user_agent' => $request->userAgent(),
            ],
        ]);

        $creator = Creator::query()->find($creatorId);
        if ($creator) {
            try {
                $this->earnings->createSyndicatedApplyEarning($creator, $event);
            } catch (\Throwable) {
                // Click is already stored; earning can be backfilled later.
            }
        }
    }
}
