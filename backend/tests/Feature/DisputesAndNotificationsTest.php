<?php

namespace Tests\Feature;

use App\Models\Niche;
use App\Models\Program;
use App\Models\TrackingToken;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class DisputesAndNotificationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_employer_dispute_notifies_creator_and_admin_can_resolve(): void
    {
        Mail::fake();
        $this->seed();
        config(['joborio.ppa_allow_below_mid' => true]);

        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $employerUser = User::factory()->create();
        $employerUser->assignRole('employer');
        $this->actingAs($employerUser, 'sanctum')->postJson('/api/v1/employer/onboarding', [
            'company_name' => 'Dispute Co',
        ])->assertCreated();
        $employerUser->refresh();

        $nicheId = Niche::query()->value('id');

        $programResponse = $this->actingAs($employerUser, 'sanctum')->postJson('/api/v1/employer/programs', [
            'title' => 'Dispute PPA',
            'destination_url' => 'https://dispute.example/apply',
            'pricing_model' => 'ppa',
            'rate_usd' => 10,
            'budget_total_usd' => 500,
            'target_niche_ids' => [$nicheId],
            'target_countries' => ['US'],
        ])->assertCreated();

        $programId = $programResponse->json('data.program.id');
        $this->actingAs($admin, 'sanctum')->postJson("/api/v1/admin/programs/{$programId}/activate")->assertOk();

        $creatorUser = User::factory()->create();
        $creatorUser->assignRole('creator');
        $this->actingAs($creatorUser, 'sanctum')->postJson('/api/v1/creator/onboarding', [
            'handle' => 'disputecreator',
            'niche_ids' => [$nicheId],
            'audience_countries' => ['US'],
            'social_links' => [
                'website' => 'https://example.com/creator',
            ],
        ])->assertCreated();
        $creatorUser->refresh();

        $this->actingAs($creatorUser, 'sanctum')->postJson("/api/v1/creator/campaigns/{$programId}/opt-in")->assertCreated();

        $program = Program::findOrFail($programId);
        $token = TrackingToken::firstOrCreate(
            ['creator_id' => $creatorUser->creator->id, 'listing_id' => $program->listing->id],
            ['token' => 'disputetoken']
        );

        $secret = config('joborio.ppa_webhook_secret');
        $webhook = $this->postJson('/api/v1/webhooks/ppa', [
            'token' => $token->token,
            'external_application_id' => 'app-dispute-1',
            'email' => 'candidate@example.com',
        ], ['X-Joborio-Webhook-Secret' => $secret])->assertCreated();

        $applicationId = $webhook->json('data.application_id');

        $this->actingAs($employerUser, 'sanctum')->postJson(
            "/api/v1/employer/programs/{$programId}/applications/{$applicationId}/confirm"
        )->assertOk();

        $dispute = $this->actingAs($employerUser, 'sanctum')->postJson(
            "/api/v1/employer/programs/{$programId}/applications/{$applicationId}/dispute",
            ['reason' => 'Applicant did not meet job requirements for this role.']
        );
        $dispute->assertCreated()->assertJsonPath('data.dispute.status', 'open');

        $this->assertDatabaseHas('attribution_disputes', [
            'creator_id' => $creatorUser->creator->id,
            'status' => 'open',
        ]);

        $this->assertTrue(
            UserNotification::query()
                ->where('user_id', $creatorUser->id)
                ->where('type', 'dispute_opened')
                ->exists()
        );

        $disputeId = $dispute->json('data.dispute.id');
        $this->actingAs($admin, 'sanctum')->postJson("/api/v1/admin/disputes/{$disputeId}/resolve", [
            'status' => 'upheld',
            'admin_notes' => 'Employer evidence accepted.',
        ])->assertOk();

        $this->assertDatabaseHas('ppa_applications', [
            'id' => $applicationId,
            'status' => 'rejected',
        ]);
    }

    public function test_creator_notifications_api_returns_unread_count(): void
    {
        $this->seed();

        $user = User::factory()->create();
        $user->assignRole('creator');
        $nicheId = Niche::query()->value('id');

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/creator/onboarding', [
            'handle' => 'notifyuser',
            'niche_ids' => [$nicheId],
            'audience_countries' => ['US'],
            'social_links' => [
                'website' => 'https://example.com/creator',
            ],
        ])->assertCreated();

        UserNotification::create([
            'user_id' => $user->id,
            'type' => 'test',
            'title' => 'Hello',
            'body' => 'Test notification',
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/creator/notifications');
        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('meta.unread_count', 1);
    }
}
