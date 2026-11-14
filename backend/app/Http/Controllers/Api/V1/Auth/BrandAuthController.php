<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Mail\PasswordResetMail;
use App\Models\User;
use App\Services\Auth\BrandRegistrationService;
use App\Services\Auth\CaptchaService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class BrandAuthController extends Controller
{
    use ApiResponse;

    public function captcha(Request $request, CaptchaService $captcha): JsonResponse
    {
        return $this->success($captcha->challenge($request->boolean('math')));
    }

    public function register(
        Request $request,
        CaptchaService $captcha,
        BrandRegistrationService $brands,
    ): JsonResponse {
        $data = $request->validate([
            'company_name' => ['required', 'string', 'max:255'],
            'trading_name' => ['required', 'string', 'max:255'],
            'entity_region' => ['required', 'string', 'in:IN,US,UK,AE,OTHER'],
            'gst_number' => ['nullable', 'string', 'max:32'],
            'pan_number' => ['nullable', 'string', 'max:20'],
            'tax_id' => ['nullable', 'string', 'max:64'],
            'billing_address' => ['nullable', 'string', 'max:2000'],
            'website' => ['nullable', 'url', 'max:500'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'accepted_terms' => ['accepted'],
            'captcha_id' => ['required', 'string'],
            'captcha_answer' => ['required', 'string'],
        ]);

        $captcha->assertValid($data['captcha_id'], $data['captcha_answer']);

        $result = $brands->register($data);

        return $this->success([
            'verification_required' => true,
            'email' => $result['email'],
            'message' => 'Account created. Check your email for the verification code.',
            'otp_sent' => $result['otp_sent'],
        ], 201);
    }

    public function resendOtp(Request $request, BrandRegistrationService $brands): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', strtolower($data['email']))->first();
        if (! $user || $user->email_verified_at) {
            return $this->success([
                'message' => 'If that account needs verification, a new code was sent.',
            ]);
        }

        $otp = $brands->issueOtp($user);

        return $this->success([
            'message' => 'A new verification code was sent.',
            'otp_sent' => $otp['sent'],
            'debug_otp' => $otp['debug_otp'],
        ]);
    }

    public function verifyOtp(Request $request, BrandRegistrationService $brands): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'otp' => ['required', 'string', 'size:6'],
        ]);

        $user = $brands->verifyOtp($data['email'], $data['otp']);
        $token = $user->createToken('api')->plainTextToken;

        return $this->success([
            'user' => $user,
            'token' => $token,
            'message' => 'Email verified. Welcome to JobOrio.',
        ]);
    }

    public function forgotPassword(
        Request $request,
        CaptchaService $captcha,
    ): JsonResponse {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'captcha_id' => ['required', 'string'],
            'captcha_answer' => ['required', 'string'],
        ]);

        $captcha->assertValid($data['captcha_id'], $data['captcha_answer']);

        $email = strtolower(trim($data['email']));
        $user = User::where('email', $email)->first();

        if ($user) {
            $token = Str::random(64);
            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $email],
                ['token' => Hash::make($token), 'created_at' => now()],
            );

            $frontend = rtrim((string) config('joborio.frontend_url', 'https://joborio.com'), '/');
            $url = $frontend.'/reset-password?email='.urlencode($email).'&token='.urlencode($token);

            try {
                Mail::to($email)->send(new PasswordResetMail($user->name ?: 'there', $url));
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return $this->success([
            'message' => 'If an account exists for that email, a reset link was sent.',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $email = strtolower(trim($data['email']));
        $row = DB::table('password_reset_tokens')->where('email', $email)->first();

        if (! $row || ! Hash::check($data['token'], $row->token)) {
            throw ValidationException::withMessages([
                'token' => ['Invalid or expired reset link.'],
            ]);
        }

        if ($row->created_at && now()->diffInMinutes($row->created_at) > 60) {
            DB::table('password_reset_tokens')->where('email', $email)->delete();
            throw ValidationException::withMessages([
                'token' => ['Reset link has expired. Request a new one.'],
            ]);
        }

        $user = User::where('email', $email)->first();
        if (! $user) {
            throw ValidationException::withMessages([
                'email' => ['Account not found.'],
            ]);
        }

        $user->forceFill([
            'password' => Hash::make($data['password']),
        ])->save();

        DB::table('password_reset_tokens')->where('email', $email)->delete();
        $user->tokens()->delete();

        return $this->success([
            'message' => 'Password updated. You can sign in now.',
        ]);
    }
}
