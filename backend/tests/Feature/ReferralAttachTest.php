<?php

namespace Tests\Feature;

use App\Models\Creator;
use App\Models\Niche;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReferralAttachTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_and_onboarding_attach_referrer_for_draft_creator(): void
    {
        $this->seed();

        $referrerUser = User::factory()->create();
        $referrerUser->assignRole('creator');
        $referrer = Creator::create([
            'user_id' => $referrerUser->id,
            'handle' => 'referrerone',
            'trust_tier' => 'nano',
            'referral_code' => 'REFTESTCODE',
            'audience_countries' => [],
            'onboarding_completed_at' => now(),
        ]);

        $signup = $this->postJson('/api/v1/auth/register', [
            'name' => 'Invitee',
            'email' => 'invitee@example.com',
            'password' => 'password123',
            'referral_code' => 'reftestcode',
        ]);
        $signup->assertCreated();
        $token = $signup->json('data.token');

        $draft = Creator::query()->where('user_id', User::where('email', 'invitee@example.com')->value('id'))->first();
        $this->assertNotNull($draft);
        $this->assertSame($referrer->id, $draft->referred_by_creator_id);

        $nicheId = Niche::query()->value('id');
        $this->withToken($token)->postJson('/api/v1/creator/onboarding', [
            'handle' => 'inviteeone',
            'social_links' => ['website' => 'https://example.com/invitee'],
            'niche_ids' => [$nicheId],
            'referral_code' => 'REFTESTCODE',
        ])->assertCreated();

        $draft->refresh();
        $this->assertSame($referrer->id, $draft->referred_by_creator_id);

        $board = $this->actingAs($referrerUser, 'sanctum')
            ->getJson('/api/v1/creator/referrals');
        $board->assertOk()
            ->assertJsonPath('data.stats.signups', 1)
            ->assertJsonPath('data.referred_creators.0.handle', 'inviteeone');
    }
}
