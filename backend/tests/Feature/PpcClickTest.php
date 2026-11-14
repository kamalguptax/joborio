<?php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\Niche;
use App\Models\TrackingToken;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PpcClickTest extends TestCase
{
    use RefreshDatabase;

    public function test_tracked_redirect_records_click(): void
    {
        $this->seed();

        $user = User::factory()->create();
        $user->assignRole('creator');

        $nicheId = Niche::query()->value('id');
        $this->assertNotNull($nicheId);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/creator/onboarding', [
            'handle' => 'testcreator',
            'niche_ids' => [$nicheId],
            'audience_countries' => ['US'],
            'social_links' => [
                'website' => 'https://example.com/creator',
            ],
        ]);

        $response->assertCreated();

        $user->refresh();
        $creator = $user->creator;
        $this->assertNotNull($creator);

        $listing = Listing::first();
        $this->assertNotNull($listing);

        $token = TrackingToken::firstOrCreate(
            ['creator_id' => $creator->id, 'listing_id' => $listing->id],
            ['token' => 'testtoken123']
        );

        $redirect = $this->get('/r/'.$token->token);
        $redirect->assertRedirect($listing->destination_url);

        $this->assertDatabaseHas('attribution_events', [
            'creator_id' => $creator->id,
            'event_type' => 'click',
            'is_counted' => true,
        ]);
    }

    public function test_duplicate_click_within_dedup_window_is_not_counted(): void
    {
        $this->seed();

        $user = User::factory()->create();
        $user->assignRole('creator');

        $nicheId = Niche::query()->value('id');
        $this->actingAs($user, 'sanctum')->postJson('/api/v1/creator/onboarding', [
            'handle' => 'dedupcreator',
            'niche_ids' => [$nicheId],
            'audience_countries' => ['US'],
            'social_links' => [
                'website' => 'https://example.com/creator',
            ],
        ])->assertCreated();

        $user->refresh();
        $listing = Listing::first();
        $token = TrackingToken::firstOrCreate(
            ['creator_id' => $user->creator->id, 'listing_id' => $listing->id],
            ['token' => 'deduptoken99']
        );

        $this->get('/r/'.$token->token)->assertRedirect();
        $this->get('/r/'.$token->token)->assertRedirect();

        $this->assertSame(
            1,
            \App\Models\AttributionEvent::query()
                ->where('creator_id', $user->creator->id)
                ->where('event_type', 'click')
                ->where('is_counted', true)
                ->count()
        );

        $this->assertDatabaseHas('attribution_events', [
            'creator_id' => $user->creator->id,
            'event_type' => 'click',
            'fraud_status' => 'dedup',
            'is_counted' => false,
        ]);
    }
}
