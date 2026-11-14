<?php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModuleCListingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_listings_index_filters_by_category(): void
    {
        $this->seed();

        Listing::create([
            'title' => 'Unique Tech Role',
            'category' => 'technology',
            'status' => 'active',
            'source' => 'test',
            'external_id' => 't1',
            'destination_url' => 'https://example.com/1',
        ]);

        $response = $this->getJson('/api/v1/listings?category=technology');

        $response->assertOk()->assertJsonPath('success', true);
        $this->assertNotEmpty($response->json('data'));
    }

    public function test_listings_ingest_command_imports_feed(): void
    {
        $this->seed();

        $this->artisan('listings:ingest')->assertSuccessful();

        $this->assertDatabaseHas('listings', [
            'external_id' => 'agg-1001',
            'source' => 'aggregator',
            'status' => 'active',
        ]);
    }

    public function test_admin_can_create_listing(): void
    {
        $this->seed();
        $admin = User::where('email', 'admin@joborio.com')->first();
        $token = $admin->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/v1/admin/listings', [
            'title' => 'Manual Job Post',
            'destination_url' => 'https://example.com/manual',
            'type' => 'job',
            'category' => 'technology',
            'country_code' => 'US',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('listings', ['title' => 'Manual Job Post', 'source' => 'manual']);
    }
}
