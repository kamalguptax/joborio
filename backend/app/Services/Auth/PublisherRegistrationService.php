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

        $country = strtoupper((string) $data['country']);
        if (! in_array($country, Publisher::COUNTRIES, true)) {
            throw ValidationException::withMessages([
                'country' => ['Country must be India, UAE, or USA.'],
            ]);
        }

        $networkType = Str::lower((string) $data['network_type']);
        if (! in_array($networkType, Publisher::NETWORK_TYPES, true)) {
            throw ValidationException::withMessages([
                'network_type' => ['Invalid network type.'],
            ]);
        }

        $integration = Str::lower((string) $data['integration_preference']);
        if (! in_array($integration, Publisher::INTEGRATIONS, true)) {
            throw ValidationException::withMessages([
                'integration_preference' => ['Invalid integration preference.'],
            ]);
        }

        $nicheIds = array_values(array_unique(array_map('intval', $data['niche_ids'] ?? [])));
        if (count($nicheIds) < 1) {
            throw ValidationException::withMessages([
                'niche_ids' => ['Select at least one audience niche.'],
            ]);
        }

        $jobPrefs = array_values(array_unique(array_map('strval', $data['job_preferences'] ?? [])));
        $allowedJobs = ['full_time', 'part_time', 'remote', 'internship'];
        $jobPrefs = array_values(array_intersect($jobPrefs, $allowedJobs));
        if (count($jobPrefs) < 1) {
            throw ValidationException::withMessages([
                'job_preferences' => ['Select at least one job preference.'],
            ]);
        }

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
                'social_url' => trim((string) $data['social_url']),
                'website_url' => trim((string) $data['website_url']),
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
