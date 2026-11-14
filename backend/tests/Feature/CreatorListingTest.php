<?php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\Niche;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreatorListingTest extends TestCase
{
    use RefreshDatabase;

    public function test_creator_can_list_and_update_listing_visibility(): void
    {
        $this->seed();

        $user = User::factory()->create();
        $user->assignRole('creator');
        $nicheId = Niche::query()->value('id');

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/creator/onboarding', [
            'handle' => 'listcreator',
            'niche_ids' => [$nicheId],
            'audience_countries' => ['US'],
            'social_links' => [
                'website' => 'https://example.com/creator',
            ],
        ])->assertCreated();

        $user->refresh();

        $listing = Listing::first();
        $user->creator->listings()->syncWithoutDetaching([$listing->id]);

        $index = $this->actingAs($user, 'sanctum')->getJson('/api/v1/creator/listings');
        $index->assertOk()->assertJsonPath('success', true);
        $this->assertNotEmpty($index->json('data'));

        $patch = $this->actingAs($user, 'sanctum')->patchJson(
            "/api/v1/creator/listings/{$listing->id}",
            ['is_pinned' => true]
        );
        $patch->assertOk()->assertJsonPath('data.is_pinned', true);
    }
}
