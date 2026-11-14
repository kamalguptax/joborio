<?php

namespace Tests\Feature;

use App\Services\Geo\GoogleGeocodingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GoogleGeocodingTest extends TestCase
{
    use RefreshDatabase;

    public function test_geocoding_parses_google_response(): void
    {
        config(['joborio.google_maps.api_key' => 'test-key']);

        Http::fake([
            'maps.googleapis.com/*' => Http::response([
                'status' => 'OK',
                'results' => [
                    [
                        'formatted_address' => 'San Francisco, CA, USA',
                        'place_id' => 'abc123',
                        'geometry' => ['location' => ['lat' => 37.77, 'lng' => -122.42]],
                    ],
                ],
            ]),
        ]);

        $result = app(GoogleGeocodingService::class)->geocodeAddress('San Francisco');

        $this->assertNotNull($result);
        $this->assertSame(37.77, $result['lat']);
        $this->assertSame(-122.42, $result['lng']);
    }
}
