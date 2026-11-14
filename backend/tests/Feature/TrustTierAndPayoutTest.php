<?php

namespace Tests\Feature;

use App\Models\AttributionEvent;
use App\Models\Creator;
use App\Models\EarningLedger;
use App\Models\Listing;
use App\Models\Niche;
use App\Models\TrackingToken;
use App\Models\User;
use App\Services\Creators\TrustTierService;
use App\Services\Payouts\PayoutBatchService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrustTierAndPayoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_trust_tier_promotion_is_disabled(): void
    {
        $this->seed();
        $creator = $this->makeCreator('tieruser');
        $listing = Listing::first();

        for ($i = 0; $i < 3; $i++) {
            AttributionEvent::create([
                'creator_id' => $creator->id,
                'listing_id' => $listing->id,
                'event_type' => 'click',
                'is_counted' => true,
                'fraud_status' => 'clean',
            ]);
        }

        $newTier = app(TrustTierService::class)->evaluateAndPromote($creator->fresh());

        $this->assertNull($newTier);
        $this->assertTrue(app(TrustTierService::class)->canEarnPpr($creator));
        $this->assertTrue(app(TrustTierService::class)->canEarnPpa($creator));
    }

    public function test_auto_payout_batch_includes_creators_with_payout_method(): void
    {
        $this->seed();
        $withMethod = $this->makeCreator('midcreator');
        $withMethod->update(['trust_tier' => 'nano', 'payout_method' => 'paypal']);

        $withoutMethod = $this->makeCreator('nanocreator2');
        $this->seedApprovedEarnings($withMethod, 12.0);
        $this->seedApprovedEarnings($withoutMethod, 12.0);

        $preview = app(PayoutBatchService::class)->preview('auto');

        $this->assertCount(1, $preview['creators']);
        $this->assertSame($withMethod->id, $preview['creators'][0]['creator_id']);
    }

    public function test_admin_can_complete_payout_batch(): void
    {
        $this->seed();

        $admin = User::where('email', 'admin@joborio.com')->first();
        $creator = $this->makeCreator('payuser');
        $creator->update(['trust_tier' => 'micro']);
        $this->seedApprovedEarnings($creator, 15.0);

        $create = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/payouts/batches', ['mode' => 'manual']);

        $create->assertCreated();
        $batchId = $create->json('data.id');

        $complete = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/admin/payouts/batches/{$batchId}/complete");

        $complete->assertOk()->assertJsonPath('data.status', 'completed');

        $this->assertDatabaseHas('earning_ledgers', [
            'creator_id' => $creator->id,
            'state' => 'paid',
        ]);
    }

    private function makeCreator(string $handle): Creator
    {
        $user = User::factory()->create();
        $user->assignRole('creator');
        $nicheId = Niche::query()->value('id');

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/creator/onboarding', [
            'handle' => $handle,
            'niche_ids' => [$nicheId],
            'audience_countries' => ['US'],
            'social_links' => [
                'website' => 'https://example.com/creator',
            ],
        ])->assertCreated();

        return $user->fresh()->creator;
    }

    private function seedApprovedEarnings(Creator $creator, float $net): void
    {
        EarningLedger::create([
            'creator_id' => $creator->id,
            'earning_type' => 'ppc',
            'gross_usd' => $net,
            'platform_fee_usd' => 0,
            'net_usd' => $net,
            'state' => 'approved',
            'approved_at' => now(),
        ]);
    }
}
