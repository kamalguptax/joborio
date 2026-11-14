<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Models\Publisher;
use App\Models\User;
use App\Services\Auth\CaptchaService;
use App\Services\Auth\PublisherRegistrationService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class PublisherAuthController extends Controller
{
    use ApiResponse;

    public function checkUsername(Request $request): JsonResponse
    {
        $data = $request->validate([
            'username' => ['required', 'string', 'max:32'],
        ]);

        $username = Str::lower(trim($data['username']));

        if (! preg_match('/^[a-z0-9_]{3,32}$/', $username)) {
            return $this->success([
                'username' => $username,
                'available' => false,
                'valid' => false,
                'message' => '3–32 characters: lowercase letters, numbers, underscore.',
            ]);
        }

        $taken = Publisher::query()->where('username', $username)->exists();

        return $this->success([
            'username' => $username,
            'available' => ! $taken,
            'valid' => true,
            'message' => $taken ? 'This username is already taken.' : 'Username is available.',
        ]);
    }

    public function register(
        Request $request,
        CaptchaService $captcha,
        PublisherRegistrationService $publishers,
    ): JsonResponse {
        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:120'],
            'username' => ['required', 'string', 'max:32'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'country' => ['required', 'string', 'in:IN,AE,US'],
            'niche_ids' => ['required', 'array', 'min:1'],
            'niche_ids.*' => ['integer', 'exists:niches,id'],
            'job_preferences' => ['required', 'array', 'min:1'],
            'job_preferences.*' => ['string', 'in:full_time,part_time,remote,internship'],
            'network_type' => ['required', 'string', 'in:agency,publisher,affiliate,community'],
            'social_url' => ['required', 'url', 'max:500'],
            'website_url' => ['required', 'url', 'max:500'],
            'integration_preference' => ['required', 'string', 'in:dashboard,api,xml,webhook'],
            'accepted_terms' => ['accepted'],
            'captcha_id' => ['required', 'string'],
            'captcha_answer' => ['required', 'string'],
        ]);

        $captcha->assertValid($data['captcha_id'], $data['captcha_answer']);

        $result = $publishers->register($data);

        return $this->success([
            'user' => $result['user'],
            'publisher' => $result['publisher'],
            'token' => $result['token'],
            'message' => 'Publisher application submitted. Your account is under review.',
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

        $membership = $user->publisherUsers()
            ->where('is_active', true)
            ->with('publisher')
            ->first();

        if (! $membership || ! $membership->publisher) {
            return $this->error(
                'NOT_A_PUBLISHER',
                'This login is for publisher accounts only. Use the creator or brand login instead.',
                403,
            );
        }

        $token = $user->createToken('publisher')->plainTextToken;

        return $this->success([
            'user' => $user->load('roles'),
            'publisher' => $membership->publisher,
            'membership' => [
                'role' => $membership->role,
            ],
            'token' => $token,
        ]);
    }
}
