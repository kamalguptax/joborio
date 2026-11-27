<?php

namespace App\Services\Auth;

use App\Mail\PasswordChangeOtpMail;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

/**
 * One-time code that must accompany a password change from the profile page.
 * The code is stored hashed in the cache, expires, can only be tried a few times
 * and can only be re-requested after a short wait.
 */
class PasswordChangeOtpService
{
    public const TTL_MINUTES = 10;

    public const RESEND_SECONDS = 30;

    public const MAX_ATTEMPTS = 5;

    /**
     * @return array{sent: bool, debug_otp: ?string}
     */
    public function issue(User $user): array
    {
        if (Cache::has($this->key($user, 'cooldown'))) {
            throw ValidationException::withMessages([
                'otp' => ['Please wait '.self::RESEND_SECONDS.' seconds before requesting another code.'],
            ]);
        }

        $otp = (string) random_int(100000, 999999);

        Cache::put($this->key($user, 'hash'), Hash::make($otp), now()->addMinutes(self::TTL_MINUTES));
        Cache::forget($this->key($user, 'attempts'));
        Cache::put($this->key($user, 'cooldown'), true, now()->addSeconds(self::RESEND_SECONDS));

        $sent = true;
        try {
            Mail::to($user->email)->send(new PasswordChangeOtpMail(
                $user->name ?: 'there',
                $otp,
                self::TTL_MINUTES,
            ));
        } catch (\Throwable $e) {
            $sent = false;
            report($e);
        }

        // Local QA only: expose the code when mail is just written to the log.
        $debugOtp = app()->environment('local') && config('mail.default') === 'log'
            ? $otp
            : null;

        return ['sent' => $sent, 'debug_otp' => $debugOtp];
    }

    /**
     * Throws a validation error unless $otp is the current, unexpired code for $user.
     * A correct code is consumed (single use).
     */
    public function assertValid(User $user, string $otp): void
    {
        $attemptsKey = $this->key($user, 'attempts');
        $hashKey = $this->key($user, 'hash');

        $attempts = (int) Cache::get($attemptsKey, 0);
        if ($attempts >= self::MAX_ATTEMPTS) {
            Cache::forget($hashKey);
            throw ValidationException::withMessages([
                'otp' => ['Too many wrong codes. Request a new OTP.'],
            ]);
        }

        $hash = Cache::get($hashKey);
        if (! $hash || ! Hash::check(trim($otp), $hash)) {
            Cache::put($attemptsKey, $attempts + 1, now()->addMinutes(self::TTL_MINUTES));
            throw ValidationException::withMessages([
                'otp' => ['Invalid or expired OTP.'],
            ]);
        }

        Cache::forget($hashKey);
        Cache::forget($attemptsKey);
    }

    private function key(User $user, string $part): string
    {
        return 'joborio:password_otp:'.$user->id.':'.$part;
    }
}
