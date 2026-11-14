<?php

namespace App\Services\Tracking;

use App\Models\TrackedWebsite;
use App\Models\WebsiteTrackingEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class WebsiteTrackingService
{
    public function recordHit(TrackedWebsite $site, Request $request, array $payload): WebsiteTrackingEvent
    {
        $pageUrl = (string) ($payload['url'] ?? $payload['page_url'] ?? '');
        $ip = $request->ip() ?? '0.0.0.0';

        $coords = $this->clientCoordinates($payload);

        if ($this->isDuplicatePageview($site, $ip, $pageUrl)) {
            return WebsiteTrackingEvent::create([
                'tracked_website_id' => $site->id,
                'event_type' => 'pageview_dedup',
                'page_url' => $pageUrl,
                'page_title' => $payload['title'] ?? $payload['page_title'] ?? null,
                'referrer' => $payload['referrer'] ?? $request->headers->get('referer'),
                'ip_address' => $ip,
                'geo_country' => $this->geoCountry($request),
                'latitude' => $coords['lat'],
                'longitude' => $coords['lng'],
                'user_agent' => $request->userAgent(),
                'meta' => ['deduped' => true],
                'created_at' => now(),
            ]);
        }

        $this->rememberPageview($site, $ip, $pageUrl);

        return WebsiteTrackingEvent::create([
            'tracked_website_id' => $site->id,
            'event_type' => (string) ($payload['event'] ?? $payload['event_type'] ?? 'pageview'),
            'page_url' => $pageUrl,
            'page_title' => $payload['title'] ?? $payload['page_title'] ?? null,
            'referrer' => $payload['referrer'] ?? $request->headers->get('referer'),
            'ip_address' => $ip,
            'geo_country' => $this->geoCountry($request),
            'latitude' => $coords['lat'],
            'longitude' => $coords['lng'],
            'user_agent' => $request->userAgent(),
            'meta' => $this->domainMeta($site, $pageUrl),
            'created_at' => now(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function domainMeta(TrackedWebsite $site, string $pageUrl): array
    {
        $host = parse_url($pageUrl, PHP_URL_HOST);
        if (! $host) {
            return [];
        }

        $host = strtolower($host);
        $expected = $site->domain;
        $ok = $host === $expected || str_ends_with($host, '.'.$expected);

        return [
            'page_host' => $host,
            'domain_match' => $ok,
        ];
    }

    private function isDuplicatePageview(TrackedWebsite $site, string $ip, string $pageUrl): bool
    {
        if ($pageUrl === '') {
            return false;
        }

        $minutes = (int) config('joborio.website_tracking.pageview_dedup_minutes', 2);
        $key = 'joborio:webtrack:'.$site->id.':'.md5($ip.'|'.$pageUrl);

        return Cache::has($key);
    }

    private function rememberPageview(TrackedWebsite $site, string $ip, string $pageUrl): void
    {
        if ($pageUrl === '') {
            return;
        }

        $minutes = (int) config('joborio.website_tracking.pageview_dedup_minutes', 2);
        $key = 'joborio:webtrack:'.$site->id.':'.md5($ip.'|'.$pageUrl);
        Cache::put($key, true, now()->addMinutes($minutes));
    }

    private function geoCountry(Request $request): ?string
    {
        $geo = $request->header('CF-IPCountry') ?? $request->header('X-Geo-Country');

        return $geo ? strtoupper(substr($geo, 0, 2)) : null;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{lat: ?float, lng: ?float}
     */
    private function clientCoordinates(array $payload): array
    {
        $lat = $payload['latitude'] ?? $payload['lat'] ?? null;
        $lng = $payload['longitude'] ?? $payload['lng'] ?? null;
        if (! is_numeric($lat) || ! is_numeric($lng)) {
            return ['lat' => null, 'lng' => null];
        }

        $latF = (float) $lat;
        $lngF = (float) $lng;
        if ($latF < -90 || $latF > 90 || $lngF < -180 || $lngF > 180) {
            return ['lat' => null, 'lng' => null];
        }

        return ['lat' => $latF, 'lng' => $lngF];
    }

    public function embedScript(TrackedWebsite $site): string
    {
        $apiBase = rtrim((string) config('app.url'), '/');
        $hitUrl = $apiBase.'/api/v1/track/hit/'.$site->public_key;
        $geoEnabled = app(\App\Services\Platform\PlatformSettingsService::class)->geolocationTracking()
            ? '1'
            : '0';
        return <<<JS
(function (w, d, hitUrl) {
  if (w.__joborioTrack) return;
  w.__joborioTrack = 1;
  function payload(type, extra) {
    var p = {
      event: type || "pageview",
      url: d.location.href,
      title: d.title || "",
      referrer: d.referrer || ""
    };
    if (extra && typeof extra === "object") {
      for (var k in extra) { if (Object.prototype.hasOwnProperty.call(extra, k)) p[k] = extra[k]; }
    }
    return JSON.stringify(p);
  }
  function send(type, extra) {
    try {
      var body = payload(type, extra);
      if (w.navigator && w.navigator.sendBeacon) {
        w.navigator.sendBeacon(hitUrl, new Blob([body], { type: "application/json" }));
        return;
      }
      fetch(hitUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: body,
        keepalive: true,
        credentials: "omit",
        mode: "cors"
      }).catch(function () {});
    } catch (e) {}
  }
  send("pageview");
  if ({$geoEnabled} && w.navigator && w.navigator.geolocation) {
    w.navigator.geolocation.getCurrentPosition(
      function (pos) {
        send("pageview_geo", {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
      },
      function () {},
      { maximumAge: 300000, timeout: 8000, enableHighAccuracy: false }
    );
  }
  w.joborioTrack = function (eventName, data) { send(eventName || "custom", data); };
})(window, document, "{$hitUrl}");
JS;
    }
}
