<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Auth\CaptchaService;
use App\Services\Creators\CreatorOnboardingService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    use ApiResponse;

    public function register(Request $request, CaptchaService $captcha): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', Password::defaults()],
            'captcha_id' => ['required', 'string'],
            'captcha_answer' => ['required', 'string'],
            'referral_code' => ['nullable', 'string', 'max:32'],
        ]);

        $captcha->assertValid((string) $data['captcha_id'], (string) $data['captcha_answer']);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        $creator = app(CreatorOnboardingService::class)->ensureForUser($user);
        // Always try to attribute invite at signup (also stores pending_referral_code).
        app(\App\Services\Referrals\ReferralService::class)
            ->attachReferrerOnSignup($creator, $data['referral_code'] ?? null);

        $token = $user->createToken('api')->plainTextToken;

        return $this->success([
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function login(Request $request, CaptchaService $captcha): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
            'captcha_id' => ['required', 'string'],
            'captcha_answer' => ['required', 'string'],
        ]);

        $captcha->assertValid($data['captcha_id'], $data['captcha_answer']);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return $this->error('INVALID_CREDENTIALS', 'Invalid email or password.', 401);
        }

        if (! $user->is_active) {
            return $this->error('ACCOUNT_DISABLED', 'Account is disabled.', 403);
        }

        $isPublisher = $user->hasRole('publisher')
            || $user->publisherUsers()->where('is_active', true)->exists();
        $isNetworkMember = $user->hasRole('network_member')
            || \App\Models\NetworkMember::query()
                ->where('user_id', $user->id)
                ->where('status', 'active')
                ->exists();

        if (! $isPublisher && ! $isNetworkMember && ! $user->hasRole('employer')) {
            app(CreatorOnboardingService::class)->ensureForUser($user);
        }

        $token = $user->createToken('api')->plainTextToken;

        $user->load('creator', 'publisherUsers.publisher');
        if ($user->creator && $request->ip()) {
            \Illuminate\Support\Facades\Cache::put(
                'joborio:creator:self_ip:'.$user->creator->id,
                $request->ip(),
                now()->addDays(90),
            );
        }

        return $this->success([
            'user' => $user->load('creator.niches', 'employer', 'roles', 'publisherUsers.publisher'),
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return $this->success(['message' => 'Logged out']);
    }

    public function me(Request $request): JsonResponse
    {
        return $this->success(
            $request->user()->load('creator.niches', 'employer', 'roles', 'publisherUsers.publisher')
        );
    }
}
