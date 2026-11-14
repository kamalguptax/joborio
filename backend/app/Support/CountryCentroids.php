<?php

namespace App\Support;

class CountryCentroids
{
    /**
     * @var array<string, array{0: float, 1: float}>
     */
    private const CENTROIDS = [
        'US' => [37.0902, -95.7129],
        'GB' => [55.3781, -3.4360],
        'IN' => [20.5937, 78.9629],
        'AE' => [23.4241, 53.8478],
        'CA' => [56.1304, -106.3468],
        'AU' => [-25.2744, 133.7751],
        'DE' => [51.1657, 10.4515],
        'FR' => [46.2276, 2.2137],
        'SG' => [1.3521, 103.8198],
        'BR' => [-14.2350, -51.9253],
    ];

    /**
     * @return array{lat: float, lng: float}|null
     */
    public static function forCountry(?string $code): ?array
    {
        if (! $code) {
            return null;
        }

        $key = strtoupper($code);
        if (! isset(self::CENTROIDS[$key])) {
            return null;
        }

        return [
            'lat' => self::CENTROIDS[$key][0],
            'lng' => self::CENTROIDS[$key][1],
        ];
    }
}
