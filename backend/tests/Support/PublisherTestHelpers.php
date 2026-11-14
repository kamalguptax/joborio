<?php

namespace Tests\Support;

use App\Models\Employer;
use App\Models\Niche;
use App\Models\Program;
use App\Models\Publisher;
use App\Models\PublisherCommunity;
use App\Models\PublisherUser;
use App\Models\User;
use Database\Seeders\NicheSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

trait PublisherTestHelpers
{
    protected function seedPublisherBasics(): void
    {
        $this->seed(RoleSeeder::class);
        $this->seed(NicheSeeder::class);
        config(['services.turnstile.site_key' => '', 'services.turnstile.secret_key' => '']);
    }

    /**
     * @return array{user: User, publisher: Publisher}
     */
    protected function makePublisherOwner(string $username = 'pubowner'): array
    {
        $user = User::factory()->create([
            'email' => $username.'@example.com',
            'password' => Hash::make('Password1!'),
        ]);
        $user->assignRole('publisher');

        $publisher = Publisher::create([
            'code' => 'PUB'.strtoupper(Str::random(5)),
            'username' => $username,
            'display_name' => 'Publisher '.$username,
            'country_code' => 'IN',
            'network_type' => 'publisher',
            'social_url' => 'https://social.example.com/'.$username,
            'website_url' => 'https://www.example.com/'.$username,
            'integration_preference' => 'dashboard',
            'niche_ids' => [Niche::query()->value('id')],
            'job_preferences' => ['full_time'],
            'status' => Publisher::STATUS_ACTIVATED,
            'email_verified_at' => now(),
            'activated_at' => now(),
        ]);

        PublisherUser::create([
            'publisher_id' => $publisher->id,
            'user_id' => $user->id,
            'role' => 'owner',
            'is_active' => true,
        ]);

        return compact('user', 'publisher');
    }

    /**
     * @return array{user: User, membership: PublisherUser}
     */
    protected function makePublisherManager(Publisher $publisher, string $username = 'pubmgr'): array
    {
        $user = User::factory()->create([
            'email' => $username.'@example.com',
            'password' => Hash::make('Password1!'),
        ]);
        $user->assignRole('publisher');

        $membership = PublisherUser::create([
            'publisher_id' => $publisher->id,
            'user_id' => $user->id,
            'role' => 'manager',
            'is_active' => true,
        ]);

        return compact('user', 'membership');
    }

    protected function makeCommunity(Publisher $publisher, array $attrs = []): PublisherCommunity
    {
        return PublisherCommunity::create(array_merge([
            'publisher_id' => $publisher->id,
            'code' => 'COM'.strtoupper(Str::random(5)),
            'name' => 'Test Community',
            'campaign_access' => 'all_eligible',
            'status' => 'active',
            'country_code' => 'IN',
        ], $attrs));
    }

    protected function makeActiveProgram(string $title = 'IT Jobs Campaign'): Program
    {
        $employerUser = User::factory()->create();
        $employerUser->assignRole('employer');
        $employer = Employer::create([
            'user_id' => $employerUser->id,
            'company_name' => 'Acme Hiring',
            'country_code' => 'IN',
        ]);

        return Program::create([
            'employer_id' => $employer->id,
            'title' => $title,
            'pricing_model' => 'ppc',
            'rate_usd' => 0.3500,
            'budget_total_usd' => 1000,
            'status' => 'active',
        ]);
    }

    /**
     * @return array{captcha_id: string, captcha_answer: string}
     */
    protected function mathCaptcha(): array
    {
        $id = (string) Str::uuid();
        Cache::put('joborio:captcha:'.$id, '7', now()->addMinutes(10));

        return ['captcha_id' => $id, 'captcha_answer' => '7'];
    }
}
