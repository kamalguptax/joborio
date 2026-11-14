<?php

namespace App\Services\Auth;

use App\Models\User;
use App\Services\Creators\CreatorOnboardingService;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Laravel\Socialite\Contracts\User as SocialiteUser;

class SocialAuthService
{
    /** @var list<string> */
    public const PROVIDERS = ['google', 'linkedin'];

    public function driverName(string $provider): string
    {
        return match ($provider) {
            'google' => 'google',
            'linkedin' => 'linkedin-openid',
            default => throw new InvalidArgumentException("Unsupported provider: {$provider}"),
        };
    }

    public function findOrCreateUser(string $provider, SocialiteUser $socialUser): User
    {
        $column = $this->idColumn($provider);
        $providerId = (string) $socialUser->getId();

        $user = User::query()->where($column, $providerId)->first();
        if ($user) {
            return $this->ready($user);
        }

        $email = $socialUser->getEmail();
        if ($email) {
            $user = User::query()->where('email', $email)->first();
            if ($user) {
                $user->update([
                    $column => $providerId,
                    'email_verified_at' => $user->email_verified_at ?? now(),
                ]);

                return $this->ready($user);
            }
        }

        if (! $email) {
            throw new InvalidArgumentException('Email is required from the provider to create an account.');
        }

        return $this->ready(User::create([
            'name' => $socialUser->getName() ?? Str::before($email, '@'),
            'email' => $email,
            'email_verified_at' => now(),
            'password' => Str::password(32),
            $column => $providerId,
            'is_active' => true,
        ]));
    }

    private function idColumn(string $provider): string
    {
        return match ($provider) {
            'google' => 'google_id',
            'linkedin' => 'linkedin_id',
            default => throw new InvalidArgumentException("Unsupported provider: {$provider}"),
        };
    }

    private function ready(User $user): User
    {
        if (! $user->is_active) {
            throw new InvalidArgumentException('Account is disabled.');
        }

        app(CreatorOnboardingService::class)->ensureForUser($user);

        return $user;
    }
}
