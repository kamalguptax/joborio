<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Services\Auth\SocialAuthService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    use ApiResponse;

    public function __construct(private SocialAuthService $socialAuth) {}

    public function providers(): JsonResponse
    {
        return $this->success([
            'providers' => [
                [
                    'id' => 'google',
                    'redirect_url' => url('/api/v1/auth/google/redirect'),
                ],
                [
                    'id' => 'linkedin',
                    'redirect_url' => url('/api/v1/auth/linkedin/redirect'),
                ],
            ],
        ]);
    }

    public function redirect(string $provider): RedirectResponse|JsonResponse
    {
        if (! $this->isSupported($provider)) {
            return $this->error('INVALID_PROVIDER', 'Unsupported OAuth provider.', 404);
        }

        if (! $this->credentialsConfigured($provider)) {
            return $this->error('PROVIDER_NOT_CONFIGURED', 'OAuth credentials are not configured.', 503);
        }

        $driver = $this->socialAuth->driverName($provider);

        return Socialite::driver($driver)
            ->stateless()
            ->redirect();
    }

    public function callback(string $provider): RedirectResponse|JsonResponse
    {
        if (! $this->isSupported($provider)) {
            return $this->error('INVALID_PROVIDER', 'Unsupported OAuth provider.', 404);
        }

        try {
            $driver = $this->socialAuth->driverName($provider);
            $socialUser = Socialite::driver($driver)->stateless()->user();
            $user = $this->socialAuth->findOrCreateUser($provider, $socialUser);
            $token = $user->createToken('oauth-'.$provider)->plainTextToken;
        } catch (\Throwable $e) {
            Log::warning('OAuth callback failed', ['provider' => $provider, 'message' => $e->getMessage()]);

            return $this->redirectToFrontend(error: 'oauth_failed', message: $e->getMessage());
        }

        return $this->redirectToFrontend(token: $token, provider: $provider);
    }

    private function isSupported(string $provider): bool
    {
        return in_array($provider, SocialAuthService::PROVIDERS, true);
    }

    private function credentialsConfigured(string $provider): bool
    {
        return match ($provider) {
            'google' => filled(config('services.google.client_id')) && filled(config('services.google.client_secret')),
            'linkedin' => filled(config('services.linkedin-openid.client_id')) && filled(config('services.linkedin-openid.client_secret')),
            default => false,
        };
    }

    private function redirectToFrontend(?string $token = null, ?string $provider = null, ?string $error = null, ?string $message = null): RedirectResponse
    {
        $base = rtrim(config('joborio.frontend_url', env('FRONTEND_URL', 'http://localhost:3000')), '/');
        $path = config('joborio.oauth_callback_path', '/auth/callback');

        $query = array_filter([
            'token' => $token,
            'provider' => $provider,
            'error' => $error,
            'message' => $message,
        ]);

        return redirect()->away($base.$path.'?'.http_build_query($query));
    }
}
