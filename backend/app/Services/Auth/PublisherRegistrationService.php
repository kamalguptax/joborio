<?php

namespace App\Services\Auth;

use App\Models\Publisher;
use App\Models\PublisherUser;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PublisherRegistrationService
{
    public function register(array $data): array
    {
        $username = Str::lower(trim((string) $data['username']));
        if (! preg_match('/^[a-z0-9_]{3,32}$/', $username)) {
            throw ValidationException::withMessages([
                'username' => ['Username must be 3–32 characters: letters, numbers, underscore.'],
            ]);
        }

        if (Publisher::query()->where('username', $username)->exists()) {
            throw ValidationException::withMessages([
                'username' => ['This username is already taken.'],
            ]);
        }

        // Country, network type, niches, job preferences and links are optional at sign-up:
        // the publisher fills them in during onboarding.
        $country = filled($data['country'] ?? null) ? strtoupper((string) $data['country']) : null;
        if ($country !== null && ! in_array($country, Publisher::COUNTRIES, true)) {
            throw ValidationException::withMessages([
                'country' => ['Country must be India, UAE, or USA.'],
            ]);
        }

        $networkType = filled($data['network_type'] ?? null) ? Str::lower((string) $data['network_type']) : null;
        if ($networkType !== null && ! in_array($networkType, Publisher::NETWORK_TYPES, true)) {
            throw ValidationException::withMessages([
                'network_type' => ['Invalid network type.'],
            ]);
        }

        // Registration no longer collects this; default to dashboard (set later in integrations).
        $integration = Str::lower((string) ($data['integration_preference'] ?? 'dashboard'));
        if ($integration === '' || ! in_array($integration, Publisher::INTEGRATIONS, true)) {
            $integration = 'dashboard';
        }

        $nicheIds = array_values(array_unique(array_map('intval', $data['niche_ids'] ?? [])));

        $jobPrefs = array_values(array_unique(array_map('strval', $data['job_preferences'] ?? [])));
        $allowedJobs = ['full_time', 'part_time', 'remote', 'internship', 'fresher'];
        $jobPrefs = array_values(array_intersect($jobPrefs, $allowedJobs));

        return DB::transaction(function () use ($data, $username, $country, $networkType, $integration, $nicheIds, $jobPrefs) {
            $user = User::create([
                'name' => trim((string) $data['full_name']),
                'email' => strtolower(trim((string) $data['email'])),
                'password' => Hash::make($data['password']),
                'is_active' => true,
                'email_verified_at' => now(),
            ]);

            $user->assignRole('publisher');

            $publisher = Publisher::create([
                'code' => $this->uniqueCode(),
                'username' => $username,
                'display_name' => trim((string) $data['full_name']),
                'country_code' => $country,
                'network_type' => $networkType,
                'social_url' => filled($data['social_url'] ?? null) ? trim((string) $data['social_url']) : null,
                'website_url' => filled($data['website_url'] ?? null) ? trim((string) $data['website_url']) : null,
                'integration_preference' => $integration,
                'niche_ids' => $nicheIds,
                'job_preferences' => $jobPrefs,
                'status' => Publisher::STATUS_EMAIL_VERIFIED,
                'email_verified_at' => now(),
            ]);

            PublisherUser::create([
                'publisher_id' => $publisher->id,
                'user_id' => $user->id,
                'role' => 'owner',
                'is_active' => true,
            ]);

            $token = $user->createToken('api')->plainTextToken;

            return [
                'user' => $user->load('roles'),
                'publisher' => $publisher,
                'token' => $token,
            ];
        });
    }

    private function uniqueCode(): string
    {
        do {
            $code = 'PUB'.strtoupper(Str::random(6));
        } while (Publisher::query()->where('code', $code)->exists());

        return $code;
    }
}
