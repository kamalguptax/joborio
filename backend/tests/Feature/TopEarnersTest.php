<?php

namespace Tests\Feature;

use App\Models\Creator;
use App\Models\EarningLedger;
use App\Models\User;
use App\Services\Creators\CreatorOnboardingService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The login / signup orbit asks for `?sort=top_earners&per_page=7`; the API has
 * to rank ALL approved creators by paid earnings, not just the newest page.
 */
class TopEarnersTest extends TestCase
{
    use RefreshDatabase;

    private function publicCreator(string $handle, float $paidUsd, ?string $avatar = null): Creator
    {
        $user = User::factory()->create(['avatar_path' => $avatar]);
        $creator = app(CreatorOnboardingService::class)->ensureForUser($user);
        $creator->forceFill([
            'handle' => $handle,
            'onboarding_completed_at' => now(),
            'approval_status' => 'approved',
            'approved_at' => now(),
        ])->save();

        if ($paidUsd > 0) {
            EarningLedger::create([
                'creator_id' => $creator->id,
                'earning_type' => 'ppc',
                'gross_usd' => $paidUsd,
                'platform_fee_usd' => 0,
                'net_usd' => $paidUsd,
                'state' => 'paid',
                'paid_at' => now(),
            ]);
        }

        return $creator;
    }

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    public function test_top_earners_sort_ranks_by_paid_amount_across_all_creators(): void
    {
        // The biggest earner is also the OLDEST, so a "newest first" page would miss it.
        $this->publicCreator('big', 900.0, 'avatars/big.png');
        $this->publicCreator('mid', 120.5);
        $this->publicCreator('none', 0.0);
        $this->publicCreator('small', 10.0);

        $response = $this->getJson('/api/v1/public/creators?sort=top_earners&per_page=3')
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSame(['big', 'mid', 'small'], collect($response->json('data'))->pluck('handle')->all());
        $this->assertSame(900.0, (float) $response->json('data.0.stats.paid_usd'));
        $this->assertNotNull($response->json('data.0.photo_url'));
        $this->assertNull($response->json('data.1.photo_url'));
    }

    public function test_default_order_is_unchanged_without_sort(): void
    {
        $this->publicCreator('first', 500.0);
        $this->publicCreator('second', 1.0);

        $this->getJson('/api/v1/public/creators')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }
}
