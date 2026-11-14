<?php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\Niche;
use App\Models\PprRegistration;
use App\Models\TrackingToken;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PprRegistrationTest extends TestCase
{
    use RefreshDatabase;

    private function creatorWithToken(): array
    {
        $this->seed();

        $user = User::factory()->create();
        $user->assignRole('creator');

        $nicheId = Niche::query()->value('id');
        $this->assertNotNull($nicheId);

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/creator/onboarding', [
            'handle' => 'pprcreator',
            'niche_ids' => [$nicheId],
            'audience_countries' => ['US'],
            'social_links' => [
                'website' => 'https://example.com/creator',
            ],
        ])->assertCreated();

        $user->refresh();
        $creator = $user->creator;
        $listing = Listing::first();
        $listing->update(['ppr_rate_usd' => 0.30]);

        $token = TrackingToken::firstOrCreate(
            ['creator_id' => $creator->id, 'listing_id' => $listing->id],
            ['token' => 'pprtracktoken']
        );

        return [$creator, $listing, $token];
    }

    public function test_webhook_creates_pending_registration_and_verify_creates_earning(): void
    {
        [, , $token] = $this->creatorWithToken();
        $secret = config('joborio.ppr_webhook_secret');

        $response = $this->postJson('/api/v1/webhooks/ppr', [
            'token' => $token->token,
            'email' => 'applicant@example.com',
        ], [
            'X-Joborio-Webhook-Secret' => $secret,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', 'pending_verification');

        $verificationUrl = $response->json('data.verification_url');
        $this->assertNotNull($verificationUrl);

        parse_str(parse_url($verificationUrl, PHP_URL_QUERY), $query);
        $registrationId = $response->json('data.registration_id');

        $verify = $this->getJson("/api/v1/ppr/verify/{$registrationId}?token={$query['token']}");
        $verify->assertOk()
            ->assertJsonPath('data.status', 'verified');

        $this->assertDatabaseHas('earning_ledgers', [
            'earning_type' => 'ppr',
            'state' => 'pending',
        ]);

        $this->assertDatabaseHas('attribution_events', [
            'event_type' => 'registration',
            'is_counted' => true,
        ]);
    }

    public function test_duplicate_email_per_listing_is_idempotent(): void
    {
        [, , $token] = $this->creatorWithToken();
        $secret = config('joborio.ppr_webhook_secret');

        $payload = [
            'token' => $token->token,
            'email' => 'dup@example.com',
        ];

        $this->postJson('/api/v1/webhooks/ppr', $payload, ['X-Joborio-Webhook-Secret' => $secret])
            ->assertCreated();

        $second = $this->postJson('/api/v1/webhooks/ppr', $payload, ['X-Joborio-Webhook-Secret' => $secret]);
        $second->assertOk()->assertJsonPath('data.duplicate', true);

        $this->assertSame(1, PprRegistration::where('email', 'dup@example.com')->count());
    }

    public function test_webhook_rejects_bad_secret(): void
    {
        [, , $token] = $this->creatorWithToken();

        $this->postJson('/api/v1/webhooks/ppr', [
            'token' => $token->token,
            'email' => 'x@example.com',
        ], ['X-Joborio-Webhook-Secret' => 'wrong'])
            ->assertUnauthorized();
    }
}
