<?php

namespace Tests\Feature;

use App\Models\Niche;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class JobPreferenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_creator_can_save_preferences_and_see_preferred_jobs(): void
    {
        $this->seed();

        $user = User::factory()->create();
        $nicheId = Niche::query()->where('code', 'technology')->value('id');

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/creator/onboarding', [
            'handle' => 'prefcreator',
            'niche_ids' => [$nicheId],
            'audience_countries' => ['US'],
            'social_links' => [
                'linkedin' => 'https://www.linkedin.com/in/prefcreator',
            ],
        ])->assertCreated();

        $user->refresh();

        $put = $this->actingAs($user, 'sanctum')->putJson('/api/v1/creator/job-preferences', [
            'niche_ids' => [$nicheId],
            'countries' => ['US'],
            'prefer_remote' => false,
            'opportunity_categories' => ['jobs', 'courses'],
            'opportunity_targeting' => [
                'keywords' => ['react'],
                'work_mode' => ['remote'],
                'currency' => 'USD',
            ],
            'opportunity_preferences' => [
                'salary_min' => 50000,
                'duration' => '8 weeks',
                'skills' => ['TypeScript'],
            ],
        ]);
        $put->assertOk()->assertJsonPath('success', true);
        $this->assertContains('salary', $put->json('data.visible_preference_keys'));
        $this->assertContains('duration', $put->json('data.visible_preference_keys'));

        $jobsOnly = $this->actingAs($user, 'sanctum')->putJson('/api/v1/creator/job-preferences', [
            'niche_ids' => [$nicheId],
            'opportunity_categories' => ['jobs'],
            'opportunity_preferences' => [
                'salary_min' => 60000,
                'duration' => 'should-be-stripped',
            ],
        ]);
        $jobsOnly->assertOk();
        $this->assertContains('salary', $jobsOnly->json('data.visible_preference_keys'));
        $this->assertNotContains('duration', $jobsOnly->json('data.visible_preference_keys'));
        $this->assertArrayNotHasKey('duration', $jobsOnly->json('data.opportunity_preferences'));

        $jobs = $this->actingAs($user, 'sanctum')->getJson('/api/v1/creator/preferred-jobs');
        $jobs->assertOk();
        $this->assertNotEmpty($jobs->json('data'));
    }

    public function test_employer_can_save_preferences_and_list_market_jobs(): void
    {
        $this->seed();

        $user = User::factory()->create();
        $nicheId = Niche::query()->where('code', 'technology')->value('id');

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/employer/onboarding', [
            'company_name' => 'Pref Co',
            'country_code' => 'US',
        ])->assertCreated();

        $user->refresh();

        $put = $this->actingAs($user, 'sanctum')->putJson('/api/v1/employer/job-preferences', [
            'niche_ids' => [$nicheId],
            'countries' => ['US'],
            'remote_only' => false,
        ]);
        $put->assertOk()->assertJsonPath('data.niche_ids.0', $nicheId);

        $jobs = $this->actingAs($user, 'sanctum')->getJson('/api/v1/employer/preferred-jobs');
        $jobs->assertOk();
    }
}
