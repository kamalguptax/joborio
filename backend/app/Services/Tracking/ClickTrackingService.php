<?php

namespace App\Services\Tracking;

use App\Models\AttributionEvent;
use App\Models\Creator;
use App\Models\EarningLedger;
use App\Models\Listing;
use App\Models\TrackingToken;
use App\Services\Earnings\EarningLedgerService;
use App\Services\Fraud\FraudDetectionService;
use App\Services\Platform\PlatformSettingsService;
use App\Support\ClickContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class ClickTrackingService
{
    public function __construct(
        private FraudDetectionService $fraud,
        private EarningLedgerService $earnings,
        private \App\Services\Programs\ProgramBudgetService $programBudget,
    ) {}

    public function getOrCreateToken(Creator $creator, Listing $listing): TrackingToken
    {
        return TrackingToken::firstOrCreate(
            ['creator_id' => $creator->id, 'listing_id' => $listing->id],
            ['token' => Str::random(48)]
        );
    }

    public function recordClick(TrackingToken $token, Request $request): AttributionEvent
    {
        $listing = $token->listing()->with('program')->first();
        $program = $listing?->program;
        $isTrial = $program?->isTrialWithoutIp() ?? false;

        if ($isTrial) {
            return AttributionEvent::create([
                'tracking_token_id' => $token->id,
                'creator_id' => $token->creator_id,
                'listing_id' => $token->listing_id,
                'event_type' => 'click',
                'ip_address' => null,
                'device_fingerprint' => null,
                'geo_country' => null,
                'latitude' => null,
                'longitude' => null,
                'geo_city' => null,
                'referrer' => $request->headers->get('referer'),
                'is_counted' => false,
                'fraud_status' => 'trial',
                'meta' => [
                    'user_agent' => $request->userAgent(),
                    'clicked_at' => ClickContext::clickedAt(),
                    'trial_without_ip' => true,
                    'program_id' => $program?->id,
                ],
            ]);
        }

        $ip = ClickContext::ip($request);
        $fingerprint = $this->deviceFingerprint($request);
        $geo = $request->header('CF-IPCountry') ?? $request->header('X-Geo-Country');
        $coords = $this->clientCoordinates($request);

        $isDuplicate = $this->clickIsDuplicate($token, $ip, $fingerprint);

        $event = AttributionEvent::create([
            'tracking_token_id' => $token->id,
            'creator_id' => $token->creator_id,
            'listing_id' => $token->listing_id,
            'event_type' => 'click',
            'ip_address' => $ip,
            'device_fingerprint' => $fingerprint,
            'geo_country' => $geo ? strtoupper(substr($geo, 0, 2)) : null,
            'latitude' => $coords['lat'],
            'longitude' => $coords['lng'],
            'geo_city' => $coords['city'],
            'referrer' => $request->headers->get('referer'),
            'is_counted' => false,
            'fraud_status' => 'clean',
            'meta' => [
                'user_agent' => $request->userAgent(),
                'clicked_at' => ClickContext::clickedAt(),
            ],
        ]);

        if ($isDuplicate) {
            $duplicateOf = $this->findDuplicateOriginal($token, $ip, $fingerprint, $event->id);
            $meta = array_merge($event->meta ?? [], [
                'duplicate_of_event_id' => $duplicateOf?->id,
                'dedup_window_minutes' => (int) config('joborio.click_dedup_minutes', 10),
                'dedup_rule' => 'same link + IP + device fingerprint within window',
            ]);
            $event->update([
                'fraud_status' => 'dedup',
                'is_counted' => false,
                'meta' => $meta,
            ]);

            return $event;
        }

        $this->rememberClickWindow($token, $ip, $fingerprint);

        if ($this->isSelfClick($token->creator_id, $ip)) {
            $event->update(['fraud_status' => 'self_click']);
            $this->fraud->queueReview($event, 'self_click');

            return $event;
        }

        $fraudResult = $this->fraud->evaluateClick($token->creator, $event);
        if ($fraudResult['block']) {
            $event->update([
                'fraud_status' => $fraudResult['reason'],
            ]);
            if ($fraudResult['queue_review']) {
                $this->fraud->queueReview($event, $fraudResult['reason']);
            }

            return $event;
        }

        $event->update(['is_counted' => true]);

        if (! $listing) {
            return $event;
        }

        if ($listing->program_id) {
            if (! $this->canRecordProgramPpc($token->creator, $listing)) {
                $event->update(['is_counted' => false, 'fraud_status' => 'program_ineligible']);

                return $event;
            }

            $gross = (float) ($listing->ppc_rate_usd ?? app(PlatformSettingsService::class)->payoutStructure()['ppc_rate_usd']);
            if (! $this->programBudget->canSpend($listing->program, $gross)) {
                $event->update(['is_counted' => false, 'fraud_status' => 'budget_exhausted']);

                return $event;
            }

            $this->earnings->createPpcEarning($token->creator, $event, $listing);
            $this->programBudget->recordSpend($listing->program, $gross);

            return $event;
        }

        $this->earnings->createPpcEarning($token->creator, $event, $listing);

        return $event;
    }

    private function canRecordProgramPpc(Creator $creator, Listing $listing): bool
    {
        $program = $listing->program;
        if (! $program || ! in_array($program->status, ['active'], true)) {
            return false;
        }

        return $program->creators()
            ->where('creators.id', $creator->id)
            ->wherePivot('status', 'active')
            ->exists();
    }

    private function findDuplicateOriginal(
        TrackingToken $token,
        string $ip,
        string $fingerprint,
        ?int $excludeEventId = null,
    ): ?AttributionEvent {
        $minutes = (int) config('joborio.click_dedup_minutes', 10);

        $query = AttributionEvent::query()
            ->where('tracking_token_id', $token->id)
            ->where('event_type', 'click')
            ->where('ip_address', $ip)
            ->where('device_fingerprint', $fingerprint)
            ->where('created_at', '>=', now()->subMinutes($minutes))
            ->orderBy('id');

        if ($excludeEventId) {
            $query->where('id', '<', $excludeEventId);
        }

        return $query->first();
    }

    private function clickIsDuplicate(TrackingToken $token, string $ip, string $fingerprint): bool
    {
        $minutes = (int) config('joborio.click_dedup_minutes', 10);
        $key = "joborio:click:{$token->id}:{$ip}:{$fingerprint}";

        if (Cache::has($key)) {
            return true;
        }

        return $this->findDuplicateOriginal($token, $ip, $fingerprint) !== null;
    }

    private function rememberClickWindow(TrackingToken $token, string $ip, string $fingerprint): void
    {
        $minutes = (int) config('joborio.click_dedup_minutes', 10);
        $key = "joborio:click:{$token->id}:{$ip}:{$fingerprint}";
        Cache::put($key, true, now()->addMinutes($minutes));
    }

    private function isSelfClick(int $creatorId, string $ip): bool
    {
        $selfIp = Cache::get('joborio:creator:self_ip:'.$creatorId);

        return $selfIp && $selfIp === $ip;
    }

    private function deviceFingerprint(Request $request): string
    {
        return hash('sha256', implode('|', [
            $request->userAgent() ?? '',
            $request->header('Accept-Language') ?? '',
        ]));
    }

    /**
     * @return array{lat: ?float, lng: ?float, city: ?string}
     */
    private function clientCoordinates(Request $request): array
    {
        $lat = $request->query('geo_lat', $request->header('X-Geo-Lat'));
        $lng = $request->query('geo_lng', $request->header('X-Geo-Lng'));
        $city = $request->query('geo_city', $request->header('X-Geo-City'));

        if (! is_numeric($lat) || ! is_numeric($lng)) {
            return ['lat' => null, 'lng' => null, 'city' => is_string($city) ? substr($city, 0, 120) : null];
        }

        $latF = (float) $lat;
        $lngF = (float) $lng;
        if ($latF < -90 || $latF > 90 || $lngF < -180 || $lngF > 180) {
            return ['lat' => null, 'lng' => null, 'city' => null];
        }

        return [
            'lat' => $latF,
            'lng' => $lngF,
            'city' => is_string($city) ? substr($city, 0, 120) : null,
        ];
    }
}
