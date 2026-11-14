<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AttributionEvent;
use App\Models\WebsiteTrackingEvent;
use App\Support\ApiResponse;
use App\Support\CountryCentroids;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminGeoController extends Controller
{
    use ApiResponse;

    public function trafficMap(Request $request): JsonResponse
    {
        $days = min(90, max(1, (int) $request->input('days', 30)));
        $since = now()->subDays($days);

        $precise = AttributionEvent::query()
            ->where('created_at', '>=', $since)
            ->where('event_type', 'click')
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->selectRaw('latitude, longitude, count(*) as event_count')
            ->groupBy('latitude', 'longitude')
            ->orderByDesc('event_count')
            ->limit(150)
            ->get()
            ->map(fn ($row) => [
                'lat' => (float) $row->latitude,
                'lng' => (float) $row->longitude,
                'count' => (int) $row->event_count,
                'source' => 'gps',
            ]);

        $byCountry = AttributionEvent::query()
            ->where('created_at', '>=', $since)
            ->where('event_type', 'click')
            ->whereNotNull('geo_country')
            ->selectRaw('geo_country, count(*) as event_count')
            ->groupBy('geo_country')
            ->orderByDesc('event_count')
            ->get()
            ->map(function ($row) {
                $centroid = CountryCentroids::forCountry($row->geo_country);

                return [
                    'country_code' => $row->geo_country,
                    'count' => (int) $row->event_count,
                    'lat' => $centroid['lat'] ?? null,
                    'lng' => $centroid['lng'] ?? null,
                    'source' => 'country',
                ];
            })
            ->filter(fn ($m) => $m['lat'] !== null)
            ->values();

        $webGps = WebsiteTrackingEvent::query()
            ->where('created_at', '>=', $since)
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->where('event_type', '!=', 'pageview_dedup')
            ->selectRaw('latitude, longitude, count(*) as event_count')
            ->groupBy('latitude', 'longitude')
            ->orderByDesc('event_count')
            ->limit(80)
            ->get()
            ->map(fn ($row) => [
                'lat' => (float) $row->latitude,
                'lng' => (float) $row->longitude,
                'count' => (int) $row->event_count,
                'source' => 'website_gps',
            ]);

        return $this->success([
            'days' => $days,
            'click_markers' => $precise->merge($byCountry)->values(),
            'website_markers' => $webGps,
        ]);
    }
}
