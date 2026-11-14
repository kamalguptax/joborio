<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\AttributionEvent;
use App\Models\Creator;
use App\Models\User;
use App\Services\Earnings\EarningLedgerService;
use App\Support\ClickContext;
use App\Support\ClickDedup;
use App\Support\JobSubid;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class XmlClickController extends Controller
{
    public function __construct(private EarningLedgerService $earnings) {}

    public function show(Request $request, string $code): RedirectResponse
    {
        $destination = $this->allowedDestination((string) $request->query('to', ''));
        if ($destination === null) {
            abort(404);
        }

        $user = User::findByPublicCode($code);
        $creator = $user?->creator;
        $affiliateCode = $user?->public_code ?: strtoupper($code);
        $outbound = JobSubid::append($destination, $affiliateCode);

        if ($creator) {
            $this->recordClick($request, $creator->id, $outbound, $affiliateCode, (string) $request->query('ref', ''));
        }

        return redirect()->away($outbound);
    }

    private function recordClick(Request $request, int $creatorId, string $outbound, string $code, string $referenceId = ''): void
    {
        $windowStart = now()->subMinutes((int) config('joborio.click_dedup_minutes', 10));
        $ip = ClickContext::ip($request);
        $clickedAt = ClickContext::clickedAt();
        $jobKey = ClickDedup::jobKey($referenceId !== '' ? $referenceId : null, $outbound);
        $duplicateOf = ClickDedup::original($creatorId, $ip, $jobKey, $windowStart);

        if ($duplicateOf) {
            AttributionEvent::create([
                'creator_id' => $creatorId,
                'event_type' => 'click',
                'ip_address' => $ip,
                'referrer' => $request->headers->get('referer'),
                'is_counted' => false,
                'fraud_status' => 'dedup',
                'meta' => [
                    'destination' => $outbound,
                    'reference_id' => $referenceId !== '' ? $referenceId : null,
                    'job_key' => $jobKey,
                    'subid' => $code,
                    'title' => $request->query('title'),
                    'source' => 'xml_share',
                    'duplicate_of_event_id' => $duplicateOf->id,
                    'clicked_at' => $clickedAt,
                    'user_agent' => $request->userAgent(),
                ],
            ]);

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
            $this->earnings->createSyndicatedApplyEarning($creator, $event);
        }
    }

    private function allowedDestination(string $url): ?string
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
}
