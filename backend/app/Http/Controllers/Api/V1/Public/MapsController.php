<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\Listing;
use App\Services\Geo\GoogleGeocodingService;
use App\Services\Platform\PlatformSettingsService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MapsController extends Controller
{
    use ApiResponse;

    public function config(PlatformSettingsService $settings): JsonResponse
    {
        return $this->success($settings->publicMapsConfig());
    }

    public function reverse(Request $request, GoogleGeocodingService $geocoder): JsonResponse
    {
        $data = $request->validate([
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lng' => ['required', 'numeric', 'between:-180,180'],
        ]);

        $place = $geocoder->reverseGeocode((float) $data['lat'], (float) $data['lng']);
        if ($place === null) {
            return $this->error('GEOCODE_FAILED', 'Google could not resolve this location.', 422);
        }

        return $this->success($place);
    }

    public function listingPoints(Request $request): JsonResponse
    {
        $query = Listing::query()
            ->active()
            ->whereNotNull('latitude')
            ->whereNotNull('longitude');

        if ($request->filled('country_code')) {
            $query->where('country_code', strtoupper($request->string('country_code')->toString()));
        }

        $points = $query
            ->orderByDesc('updated_at')
            ->limit(min((int) $request->input('limit', 100), 200))
            ->get(['id', 'title', 'company_name', 'location_label', 'country_code', 'latitude', 'longitude', 'is_remote']);

        return $this->success($points);
    }
}
