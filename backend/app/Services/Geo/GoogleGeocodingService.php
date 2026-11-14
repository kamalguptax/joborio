<?php

namespace App\Services\Geo;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoogleGeocodingService
{
    /**
     * @return array{lat: float, lng: float, formatted_address: string, place_id: ?string}|null
     */
    public function geocodeAddress(string $address): ?array
    {
        $key = app(\App\Services\Platform\PlatformSettingsService::class)->googleMapsServerKey();
        if ($key === '' || trim($address) === '') {
            return null;
        }

        try {
            $response = Http::timeout(8)->get('https://maps.googleapis.com/maps/api/geocode/json', [
                'address' => $address,
                'key' => $key,
            ]);
        } catch (\Throwable $e) {
            Log::warning('joborio.geocode_failed', ['message' => $e->getMessage()]);

            return null;
        }

        if (! $response->successful()) {
            return null;
        }

        $json = $response->json();
        if (($json['status'] ?? '') !== 'OK' || empty($json['results'][0])) {
            return null;
        }

        $result = $json['results'][0];
        $loc = $result['geometry']['location'] ?? null;
        if (! $loc || ! isset($loc['lat'], $loc['lng'])) {
            return null;
        }

        return [
            'lat' => (float) $loc['lat'],
            'lng' => (float) $loc['lng'],
            'formatted_address' => (string) ($result['formatted_address'] ?? $address),
            'place_id' => isset($result['place_id']) ? (string) $result['place_id'] : null,
        ];
    }

    /**
     * @return array{label: string, city: ?string, country_code: ?string}|null
     */
    public function reverseGeocode(float $lat, float $lng): ?array
    {
        $key = app(\App\Services\Platform\PlatformSettingsService::class)->googleMapsServerKey();
        if ($key === '') {
            return null;
        }

        try {
            $response = Http::timeout(8)->get('https://maps.googleapis.com/maps/api/geocode/json', [
                'latlng' => $lat.','.$lng,
                'key' => $key,
            ]);
        } catch (\Throwable $e) {
            Log::warning('joborio.reverse_geocode_failed', ['message' => $e->getMessage()]);

            return null;
        }

        if (! $response->successful()) {
            return null;
        }

        $json = $response->json();
        if (($json['status'] ?? '') !== 'OK' || empty($json['results'][0])) {
            return null;
        }

        return $this->placeLabel($json['results']);
    }

    /**
     * @param  list<array<string, mixed>>  $results
     * @return array{label: string, city: ?string, country_code: ?string}|null
     */
    private function placeLabel(array $results): ?array
    {
        $city = null;
        $region = null;
        $country = null;
        $countryCode = null;

        foreach ($results as $result) {
            foreach ($result['address_components'] ?? [] as $component) {
                $types = $component['types'] ?? [];
                $name = (string) ($component['long_name'] ?? '');
                if ($name === '') {
                    continue;
                }
                if ($city === null && (in_array('locality', $types, true) || in_array('postal_town', $types, true) || in_array('administrative_area_level_2', $types, true))) {
                    $city = $name;
                }
                if ($region === null && in_array('administrative_area_level_1', $types, true)) {
                    $region = $name;
                }
                if ($country === null && in_array('country', $types, true)) {
                    $country = $name;
                    $countryCode = isset($component['short_name']) ? strtoupper((string) $component['short_name']) : null;
                }
            }
        }

        $place = $city ?: $region;
        if ($place === null && $country === null) {
            $formatted = (string) ($results[0]['formatted_address'] ?? '');

            return $formatted !== '' ? ['label' => $formatted, 'city' => null, 'country_code' => $countryCode] : null;
        }

        $label = $place && $country ? $place.', '.$country : ($place ?: $country);

        return [
            'label' => (string) $label,
            'city' => $city,
            'country_code' => $countryCode,
        ];
    }
}
