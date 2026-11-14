<?php

namespace Tests\Feature;

use App\Services\Auth\SocialAuthService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Contracts\User as SocialiteUser;
use Laravel\Socialite\Facades\Socialite;
use Mockery;
use Tests\TestCase;

class SocialAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_providers_lists_google_and_linkedin(): void
    {
        $response = $this->getJson('/api/v1/auth/providers');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data.providers');
    }

    public function test_oauth_callback_creates_user_and_redirects_with_token(): void
    {
        $abstractUser = Mockery::mock(SocialiteUser::class);
        $abstractUser->shouldReceive('getId')->andReturn('google-123');
        $abstractUser->shouldReceive('getEmail')->andReturn('oauth@example.com');
        $abstractUser->shouldReceive('getName')->andReturn('OAuth User');

        $provider = Mockery::mock('Laravel\Socialite\Contracts\Provider');
        $provider->shouldReceive('stateless')->andReturnSelf();
        $provider->shouldReceive('user')->andReturn($abstractUser);

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        config(['joborio.frontend_url' => 'http://localhost:3000']);

        $response = $this->get('/api/v1/auth/google/callback');

        $response->assertRedirect();
        $this->assertStringContainsString('token=', $response->headers->get('Location'));
        $this->assertDatabaseHas('users', [
            'email' => 'oauth@example.com',
            'google_id' => 'google-123',
        ]);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
