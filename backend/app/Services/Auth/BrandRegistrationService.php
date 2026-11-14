<?php

namespace App\Services\Auth;

use App\Mail\BrandVerificationOtpMail;
use App\Models\Employer;
use App\Models\User;
use App\Support\EmployerBilling;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class BrandRegistrationService
{
    /** @var array<string, string> */
    public const REGIONS = [
        'IN' => 'IN',
        'US' => 'US',
        'UK' => 'GB',
        'AE' => 'AE',
        'OTHER' => 'XX',
    ];

    public function register(array $data): array
    {
        $region = strtoupper((string) $data['entity_region']);
        if (! isset(self::REGIONS[$region])) {
            throw ValidationException::withMessages([
                'entity_region' => ['Invalid entity type / country.'],
            ]);
        }

        $country = self::REGIONS[$region];
        $isIndia = $region === 'IN';

        if ($isIndia) {
            $gst = strtoupper(trim((string) ($data['gst_number'] ?? '')));
            if (! EmployerBilling::validGst($gst)) {
                throw ValidationException::withMessages([
                    'gst_number' => ['Enter a valid 15-character GSTIN.'],
                ]);
            }
            $pan = strtoupper(trim((string) ($data['pan_number'] ?? '')));
            if (! preg_match('/^[A-Z]{5}[0-9]{4}[A-Z]$/', $pan)) {
                throw ValidationException::withMessages([
                    'pan_number' => ['Enter a valid 10-character company PAN.'],
                ]);
            }
        } else {
            if (! filled($data['tax_id'] ?? null)) {
                throw ValidationException::withMessages([
                    'tax_id' => ['Tax ID / EIN / VAT number is required.'],
                ]);
            }
            if (! filled($data['billing_address'] ?? null)) {
                throw ValidationException::withMessages([
                    'billing_address' => ['Billing address is required.'],
                ]);
            }
        }

        return DB::transaction(function () use ($data, $region, $country, $isIndia) {
            $user = User::create([
                'name' => $data['trading_name'] ?: $data['company_name'],
                'email' => strtolower(trim($data['email'])),
                'password' => Hash::make($data['password']),
                'is_active' => false,
                'email_verified_at' => null,
            ]);

            $payload = [
                'user_id' => $user->id,
                'company_name' => $data['company_name'],
                'website' => $data['website'] ?? null,
                'country_code' => $country,
                'business_email' => strtolower(trim($data['email'])),
                'billing_address' => $data['billing_address'] ?? null,
            ];

            if (Schema::hasColumn('employers', 'trading_name')) {
                $payload['trading_name'] = $data['trading_name'] ?? null;
            }
            if (Schema::hasColumn('employers', 'entity_region')) {
                $payload['entity_region'] = $region;
            }
            if ($isIndia) {
                $payload['gst_number'] = strtoupper(trim((string) $data['gst_number']));
                if (Schema::hasColumn('employers', 'pan_number')) {
                    $payload['pan_number'] = strtoupper(trim((string) $data['pan_number']));
                }
            } else {
                if (Schema::hasColumn('employers', 'tax_id')) {
                    $payload['tax_id'] = trim((string) $data['tax_id']);
                }
            }

            $employer = Employer::create($payload);
            $user->assignRole('employer');

            $otp = $this->issueOtp($user);

            return [
                'email' => $user->email,
                'brand' => $employer->trading_name ?: $employer->company_name,
                'otp_sent' => $otp['sent'],
            ];
        });
    }

    public function issueOtp(User $user): array
    {
        $otp = (string) random_int(100000, 999999);
        Cache::put($this->otpKey($user->email), Hash::make($otp), now()->addMinutes(15));

        $frontend = rtrim((string) env('FRONTEND_URL', 'http://localhost:3000'), '/');
        $verifyUrl = $frontend.'/brand/verify?email='.urlencode($user->email);

        $sent = true;
        try {
            Mail::to($user->email)->send(new BrandVerificationOtpMail(
                $user->name ?: 'there',
                $otp,
                $verifyUrl,
            ));
        } catch (\Throwable) {
            $sent = false;
            // Local/dev: still keep OTP in cache; log mailer failures silently for UX.
            report(new \RuntimeException('Brand OTP mail failed for '.$user->email));
        }

        // In non-production, attach OTP only when mailer is "log" so QA can verify.
        $debugOtp = app()->environment('local') && config('mail.default') === 'log'
            ? $otp
            : null;

        return ['sent' => $sent, 'debug_otp' => $debugOtp];
    }

    public function verifyOtp(string $email, string $otp): User
    {
        $email = strtolower(trim($email));
        $user = User::where('email', $email)->first();
        if (! $user) {
            throw ValidationException::withMessages(['email' => ['Account not found.']]);
        }

        $hash = Cache::get($this->otpKey($email));
        if (! $hash || ! Hash::check(trim($otp), $hash)) {
            throw ValidationException::withMessages(['otp' => ['Invalid or expired verification code.']]);
        }

        Cache::forget($this->otpKey($email));

        $user->forceFill([
            'email_verified_at' => now(),
            'is_active' => true,
        ])->save();

        return $user->fresh()->load('employer', 'roles');
    }

    private function otpKey(string $email): string
    {
        return 'joborio:brand_otp:'.strtolower(trim($email));
    }
}
