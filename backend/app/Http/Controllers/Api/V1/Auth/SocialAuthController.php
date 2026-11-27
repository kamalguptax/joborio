<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Services\Auth\LoginRoleGuard;
use App\Services\Auth\SocialAuthService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    use ApiResponse;

    /** Prefix of the OAuth `state` value that carries the login page used. */
    private const STATE_PREFIX = 'login_as:';

    public function __construct(
        private SocialAuthService $socialAuth,
        private LoginRoleGuard $roles,
    ) {}

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

    public function redirect(Request $request, string $provider): RedirectResponse|JsonResponse
    {
        if (! $this->isSupported($provider)) {
            return $this->error('INVALID_PROVIDER', 'Unsupported OAuth provider.', 404);
        }

        if (! $this->credentialsConfigured($provider)) {
            return $this->error('PROVIDER_NOT_CONFIGURED', 'OAuth credentials are not configured.', 503);
        }

        $driver = $this->socialAuth->driverName($provider);

        $socialite = Socialite::driver($driver)->stateless();

        // /creator/login and /brand/login send ?login_as=creator|employer so the
        // callback can refuse accounts of any other type. The role travels in the
        // OAuth `state` (this flow is stateless, so state is not used for CSRF).
        $loginAs = LoginRoleGuard::normalize($request->query('login_as'));
        if ($loginAs !== null) {
            $socialite = $socialite->with(['state' => self::STATE_PREFIX.$loginAs]);
        }

        return $socialite->redirect();
    }

    public function callback(Request $request, string $provider): RedirectResponse|JsonResponse
    {
        if (! $this->isSupported($provider)) {
            return $this->error('INVALID_PROVIDER', 'Unsupported OAuth provider.', 404);
        }

        try {
            $driver = $this->socialAuth->driverName($provider);
            $socialUser = Socialite::driver($driver)->stateless()->user();
            $user = $this->socialAuth->findOrCreateUser($provider, $socialUser);

            $state = (string) $request->query('state', '');
            $loginAs = str_starts_with($state, self::STATE_PREFIX)
                ? LoginRoleGuard::normalize(substr($state, strlen(self::STATE_PREFIX)))
                : null;
            if ($loginAs !== null && ! $this->roles->allows($user, $loginAs)) {
                $mismatch = $this->roles->mismatch($user, $loginAs);

                return $this->redirectToFrontend(
                    error: 'wrong_role',
                    message: $mismatch['message'],
                    useLoginPath: $mismatch['details']['use_login_path'],
                );
            }

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

    private function redirectToFrontend(?string $token = null, ?string $provider = null, ?string $error = null, ?string $message = null, ?string $useLoginPath = null): RedirectResponse
    {
        $base = rtrim((string) config('joborio.frontend_url', 'https://joborio.com'), '/');
        $localFrontend = (bool) preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i', $base);
        $appUrl = (string) config('app.url', '');
        // Public API hosts must never bounce OAuth to a developer machine, even if
        // FRONTEND_URL was left as localhost or APP_ENV is not "production".
        $publicApi = (bool) preg_match(
            '/(?:^https?:\/\/(?!(?:localhost|127\.0\.0\.1)\b)|joborio\.com|api\.joborio\.com|sevenapps\.in)/i',
            $appUrl,
        );
        if ($localFrontend && ($publicApi || app()->environment('production'))) {
            $base = 'https://joborio.com';
        }
        $path = config('joborio.oauth_callback_path', '/auth/callback');

        $query = array_filter([
            'token' => $token,
            'provider' => $provider,
            'error' => $error,
            'message' => $message,
            'use_login_path' => $useLoginPath,
        ]);

        return redirect()->away($base.$path.'?'.http_build_query($query));
    }
}
