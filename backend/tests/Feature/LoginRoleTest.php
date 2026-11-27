<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\Creators\CreatorOnboardingService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * /creator/login and /brand/login send `login_as`; the API must refuse every
 * other account type there, before a token is issued.
 */
class LoginRoleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        config(['services.turnstile.site_key' => '', 'services.turnstile.secret_key' => '']);
    }

    private function captcha(): array
    {
        $id = 'test-'.uniqid();
        Cache::put('joborio:captcha:'.$id, '7', now()->addMinutes(10));

        return ['captcha_id' => $id, 'captcha_answer' => '7'];
    }

    private function login(string $email, ?string $loginAs)
    {
        return $this->postJson('/api/v1/auth/login', array_filter([
            'email' => $email,
            'password' => 'Password1!',
            'login_as' => $loginAs,
        ]) + $this->captcha());
    }

    private function makeBrand(): User
    {
        $user = User::factory()->create([
            'email' => 'brand@example.com',
            'password' => Hash::make('Password1!'),
        ]);
        $user->assignRole('employer');

        return $user;
    }

    private function makeCreator(): User
    {
        $user = User::factory()->create([
            'email' => 'creator@example.com',
            'password' => Hash::make('Password1!'),
        ]);
        app(CreatorOnboardingService::class)->ensureForUser($user);

        return $user;
    }

    public function test_brand_cannot_sign_in_on_the_creator_login(): void
    {
        $this->makeBrand();

        $this->login('brand@example.com', 'creator')
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'ROLE_MISMATCH')
            ->assertJsonPath('error.details.use_login_path', '/brand/login');

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_creator_cannot_sign_in_on_the_brand_login(): void
    {
        $this->makeCreator();

        $this->login('creator@example.com', 'employer')
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'ROLE_MISMATCH')
            ->assertJsonPath('error.details.use_login_path', '/creator/login');

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_each_account_type_can_sign_in_on_its_own_login(): void
    {
        $this->makeBrand();
        $this->makeCreator();

        $this->login('brand@example.com', 'employer')
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->login('creator@example.com', 'creator')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_universal_login_without_login_as_accepts_any_account(): void
    {
        $this->makeBrand();
        $this->makeCreator();

        $this->login('brand@example.com', null)->assertOk();
        $this->login('creator@example.com', null)->assertOk();
    }

    public function test_rejected_admin_does_not_get_a_creator_profile(): void
    {
        $admin = User::factory()->create([
            'email' => 'admin@example.com',
            'password' => Hash::make('Password1!'),
        ]);
        $admin->assignRole('admin');

        $this->login('admin@example.com', 'creator')
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'ROLE_MISMATCH')
            ->assertJsonPath('error.details.use_login_path', '/login');

        $this->assertFalse($admin->fresh()->creator()->exists());
    }

    public function test_invalid_login_as_value_is_rejected(): void
    {
        $this->makeCreator();

        $this->login('creator@example.com', 'admin')->assertStatus(422);
    }
}
