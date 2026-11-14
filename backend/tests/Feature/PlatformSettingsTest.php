<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlatformSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_save_maps_keys_and_public_config_exposes_browser_key(): void
    {
        $this->seed();

        $admin = User::where('email', 'admin@joborio.com')->first();
        $this->assertNotNull($admin);

        $put = $this->actingAs($admin, 'sanctum')->putJson('/api/v1/admin/platform-settings', [
            'maps' => [
                'google_maps_enabled' => true,
                'geolocation_tracking' => false,
                'google_maps_api_key' => 'server-key-test',
                'google_maps_browser_api_key' => 'browser-key-test',
            ],
        ]);
        $put->assertOk()->assertJsonPath('data.maps.google_maps_api_key.source', 'database');

        $public = $this->getJson('/api/v1/maps/config');
        $public->assertOk()
            ->assertJsonPath('data.browser_api_key', 'browser-key-test')
            ->assertJsonPath('data.enabled', true);
    }
}
