<?php

namespace Tests\Feature;

use App\Models\TrackedWebsite;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WebsiteTrackingTest extends TestCase
{
    use RefreshDatabase;

    public function test_embed_script_and_hit_record_pageview(): void
    {
        $this->seed();

        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $create = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/tracked-websites', [
            'name' => 'Test Site',
            'domain' => 'example.com',
        ]);
        $create->assertCreated();
        $key = $create->json('data.public_key');

        $script = $this->get("/api/v1/track/script/{$key}.js");
        $script->assertOk();
        $this->assertStringContainsString('joborioTrack', $script->getContent());

        $hit = $this->postJson("/api/v1/track/hit/{$key}", [
            'event' => 'pageview',
            'url' => 'https://example.com/jobs',
            'title' => 'Jobs',
        ]);
        $hit->assertOk()->assertJsonPath('data.recorded', true);

        $this->assertDatabaseHas('website_tracking_events', [
            'event_type' => 'pageview',
        ]);
    }

    public function test_duplicate_pageview_within_dedup_window_not_counted_as_primary(): void
    {
        $site = TrackedWebsite::create([
            'name' => 'Dedup',
            'domain' => 'dedup.test',
            'public_key' => 'abcd1234abcd1234abcd1234abcd1234',
            'is_active' => true,
        ]);

        $this->postJson('/api/v1/track/hit/'.$site->public_key, [
            'url' => 'https://dedup.test/page',
        ])->assertOk();

        $second = $this->postJson('/api/v1/track/hit/'.$site->public_key, [
            'url' => 'https://dedup.test/page',
        ]);
        $second->assertOk()->assertJsonPath('data.recorded', false);

        $this->assertDatabaseHas('website_tracking_events', [
            'event_type' => 'pageview_dedup',
        ]);
    }
}
