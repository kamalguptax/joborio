<?php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\Niche;
use App\Models\Program;
use App\Models\TrackingToken;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModuleGProgramsTest extends TestCase
{
    use RefreshDatabase;

    public function test_employer_creates_program_admin_activates_creator_opt_in_ppc_spend(): void
    {
        $this->seed();
        config(['joborio.ppa_allow_below_mid' => true]);

        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $employerUser = User::factory()->create();
        $this->actingAs($employerUser, 'sanctum')->postJson('/api/v1/employer/onboarding', [
            'company_name' => 'Acme Hiring',
            'country_code' => 'US',
        ])->assertCreated();

        $employerUser->refresh();

        $nicheId = Niche::query()->value('id');

        $programResponse = $this->actingAs($employerUser, 'sanctum')->postJson('/api/v1/employer/programs', [
            'title' => 'Engineer campaign',
            'destination_url' => 'https://acme.example/jobs/1',
            'pricing_model' => 'ppc',
            'rate_usd' => 0.05,
            'budget_total_usd' => 100,
            'target_niche_ids' => [$nicheId],
            'target_countries' => ['US'],
        ]);

        $programResponse->assertCreated();
        $programId = $programResponse->json('data.program.id');

        $this->actingAs($admin, 'sanctum')->postJson("/api/v1/admin/programs/{$programId}/activate")
            ->assertOk()
            ->assertJsonPath('data.program.status', 'active');

        $creatorUser = User::factory()->create();
        $creatorUser->assignRole('creator');

        $this->actingAs($creatorUser, 'sanctum')->postJson('/api/v1/creator/onboarding', [
            'handle' => 'campcreator',
            'niche_ids' => [$nicheId],
            'audience_countries' => ['US'],
            'social_links' => [
                'website' => 'https://example.com/creator',
            ],
        ])->assertCreated();

        $creatorUser->refresh();
        $creator = $creatorUser->creator;

        $this->actingAs($creatorUser, 'sanctum')->postJson("/api/v1/creator/campaigns/{$programId}/opt-in")
            ->assertCreated();

        $program = Program::findOrFail($programId);
        $listing = $program->listing;

        $token = TrackingToken::firstOrCreate(
            ['creator_id' => $creator->id, 'listing_id' => $listing->id],
            ['token' => 'progppctoken']
        );

        $this->get("/r/{$token->token}")->assertRedirect();

        $program->refresh();
        $this->assertGreaterThan(0, (float) $program->budget_spent_usd);

        $this->assertDatabaseHas('earning_ledgers', [
            'creator_id' => $creator->id,
            'earning_type' => 'ppc',
        ]);
    }

    public function test_ppa_webhook_and_employer_confirm_creates_earning(): void
    {
        $this->seed();
        config(['joborio.ppa_allow_below_mid' => true]);

        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $employerUser = User::factory()->create();
        $this->actingAs($employerUser, 'sanctum')->postJson('/api/v1/employer/onboarding', [
            'company_name' => 'PPA Co',
        ])->assertCreated();

        $employerUser->refresh();

        $nicheId = Niche::query()->value('id');

        $programResponse = $this->actingAs($employerUser, 'sanctum')->postJson('/api/v1/employer/programs', [
            'title' => 'PPA role',
            'destination_url' => 'https://ppa.example/apply',
            'pricing_model' => 'ppa',
            'rate_usd' => 10,
            'budget_total_usd' => 500,
            'target_niche_ids' => [$nicheId],
            'target_countries' => ['US'],
        ]);
        $programResponse->assertCreated();
        $programId = $programResponse->json('data.program.id');

        $this->actingAs($admin, 'sanctum')->postJson("/api/v1/admin/programs/{$programId}/activate")->assertOk();

        $creatorUser = User::factory()->create();
        $creatorUser->assignRole('creator');
        $this->actingAs($creatorUser, 'sanctum')->postJson('/api/v1/creator/onboarding', [
            'handle' => 'ppacreator',
            'niche_ids' => [$nicheId],
            'audience_countries' => ['US'],
            'social_links' => [
                'website' => 'https://example.com/creator',
            ],
        ])->assertCreated();
        $creatorUser->refresh();

        $this->actingAs($creatorUser, 'sanctum')->postJson("/api/v1/creator/campaigns/{$programId}/opt-in")->assertCreated();

        $program = Program::findOrFail($programId);
        $listing = $program->listing;
        $token = TrackingToken::firstOrCreate(
            ['creator_id' => $creatorUser->creator->id, 'listing_id' => $listing->id],
            ['token' => 'ppawebhooktoken']
        );

        $secret = config('joborio.ppa_webhook_secret');
        $webhook = $this->postJson('/api/v1/webhooks/ppa', [
            'token' => $token->token,
            'external_application_id' => 'app-123',
            'email' => 'hire@example.com',
        ], ['X-Joborio-Webhook-Secret' => $secret]);

        $webhook->assertCreated()->assertJsonPath('data.status', 'pending_employer');
        $applicationId = $webhook->json('data.application_id');

        $this->actingAs($employerUser, 'sanctum')->postJson(
            "/api/v1/employer/programs/{$programId}/applications/{$applicationId}/confirm"
        )->assertOk()->assertJsonPath('data.application.status', 'confirmed');

        $this->assertDatabaseHas('earning_ledgers', [
            'earning_type' => 'ppa',
            'creator_id' => $creatorUser->creator->id,
        ]);
    }
}
