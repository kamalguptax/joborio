<?php

namespace App\Http\Controllers\Api\V1\Publisher;

use App\Http\Controllers\Controller;
use App\Models\Publisher;
use App\Support\ApiResponse;
use App\Support\PublisherAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Laravel\Sanctum\PersonalAccessToken;

class SettingsController extends Controller
{
    use ApiResponse;

    public function show(Request $request): JsonResponse
    {
        $membership = PublisherAccess::membership($request->user());
        $publisher = $membership->publisher;
        $user = $request->user();

        return $this->success([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'membership' => [
                'role' => $membership->role,
            ],
            'publisher' => $this->serializePublisher($publisher),
            'sessions' => $this->sessionsFor($user, $request),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        PublisherAccess::assertOwner($request->user(), 'Only the publisher owner can update account settings.');
        $membership = PublisherAccess::membership($request->user());
        $publisher = $membership->publisher;
        $user = $request->user();

        $data = $request->validate([
            'full_name' => ['sometimes', 'string', 'max:120'],
            'country_code' => ['sometimes', 'string', Rule::in(Publisher::COUNTRIES)],
            'network_type' => ['sometimes', 'string', Rule::in(Publisher::NETWORK_TYPES)],
            'social_url' => ['sometimes', 'url', 'max:500'],
            'website_url' => ['sometimes', 'url', 'max:500'],
            'niche_ids' => ['sometimes', 'array', 'min:1'],
            'niche_ids.*' => ['integer', 'exists:niches,id'],
            'job_preferences' => ['sometimes', 'array', 'min:1'],
            'job_preferences.*' => ['string', 'in:full_time,part_time,remote,internship'],
            'notification_preferences' => ['sometimes', 'array'],
            'notification_preferences.email_invites' => ['sometimes', 'boolean'],
            'notification_preferences.email_campaigns' => ['sometimes', 'boolean'],
            'notification_preferences.email_settlements' => ['sometimes', 'boolean'],
            'notification_preferences.email_security' => ['sometimes', 'boolean'],
        ]);

        if (isset($data['full_name'])) {
            $user->name = $data['full_name'];
            $user->save();
            $publisher->display_name = $data['full_name'];
        }

        foreach (['country_code', 'network_type', 'social_url', 'website_url', 'niche_ids', 'job_preferences'] as $field) {
            if (array_key_exists($field, $data)) {
                $publisher->{$field} = $data[$field];
            }
        }

        if (isset($data['notification_preferences'])) {
            $current = is_array($publisher->notification_preferences)
                ? $publisher->notification_preferences
                : $this->defaultNotifications();
            $publisher->notification_preferences = array_merge(
                $current,
                $data['notification_preferences'],
            );
        }

        $publisher->save();

        return $this->success([
            'publisher' => $this->serializePublisher($publisher->fresh()),
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'message' => 'Profile updated.',
        ]);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $user = $request->user();
        // Any publisher team member may change their own login password.
        PublisherAccess::membership($user);

        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        if (! Hash::check($data['current_password'], $user->password)) {
            return $this->error('INVALID_PASSWORD', 'Current password is incorrect.', 422);
        }

        $user->password = Hash::make($data['password']);
        $user->save();

        // Invalidate other sessions after password change.
        $currentId = $user->currentAccessToken()?->id;
        $user->tokens()->when($currentId, fn ($q) => $q->where('id', '!=', $currentId))->delete();

        return $this->success(['message' => 'Password updated. Other sessions were signed out.']);
    }

    public function revokeOtherSessions(Request $request): JsonResponse
    {
        $user = $request->user();
        PublisherAccess::publisher($user);

        $currentId = $user->currentAccessToken()?->id;
        $deleted = $user->tokens()
            ->when($currentId, fn ($q) => $q->where('id', '!=', $currentId))
            ->delete();

        return $this->success([
            'revoked' => $deleted,
            'sessions' => $this->sessionsFor($user->fresh(), $request),
            'message' => 'Other sessions signed out.',
        ]);
    }

    private function serializePublisher(Publisher $publisher): array
    {
        $prefs = is_array($publisher->notification_preferences)
            ? array_merge($this->defaultNotifications(), $publisher->notification_preferences)
            : $this->defaultNotifications();

        return [
            'id' => $publisher->id,
            'code' => $publisher->code,
            'username' => $publisher->username,
            'display_name' => $publisher->display_name,
            'country_code' => $publisher->country_code,
            'network_type' => $publisher->network_type,
            'social_url' => $publisher->social_url,
            'website_url' => $publisher->website_url,
            'integration_preference' => $publisher->integration_preference,
            'niche_ids' => $publisher->niche_ids ?? [],
            'job_preferences' => $publisher->job_preferences ?? [],
            'notification_preferences' => $prefs,
            'status' => $publisher->status,
            'status_label' => $publisher->statusLabel(),
            'is_activated' => $publisher->isActivated(),
        ];
    }

    /**
     * @return array{email_invites: bool, email_campaigns: bool, email_settlements: bool, email_security: bool}
     */
    private function defaultNotifications(): array
    {
        return [
            'email_invites' => true,
            'email_campaigns' => true,
            'email_settlements' => true,
            'email_security' => true,
        ];
    }

    /**
     * @return list<array{id: int, name: string, last_used_at: ?string, created_at: ?string, is_current: bool}>
     */
    private function sessionsFor($user, Request $request): array
    {
        $currentId = $request->user()?->currentAccessToken()?->id;

        return $user->tokens()
            ->latest('id')
            ->limit(20)
            ->get()
            ->map(fn (PersonalAccessToken $t) => [
                'id' => $t->id,
                'name' => $t->name,
                'last_used_at' => optional($t->last_used_at)?->toIso8601String(),
                'created_at' => optional($t->created_at)?->toIso8601String(),
                'is_current' => $currentId !== null && (int) $t->id === (int) $currentId,
            ])
            ->all();
    }
}
