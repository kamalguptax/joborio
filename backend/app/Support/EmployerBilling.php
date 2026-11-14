<?php

namespace App\Support;

use App\Models\Employer;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class EmployerBilling
{
    public const PAYMENT_METHODS = ['upi', 'bank', 'card', 'invoice'];

    public static function canGoLive(Employer $employer): bool
    {
        if (! Schema::hasColumn('employers', 'gst_number')) {
            return true;
        }

        if (! filled($employer->company_name)) {
            return false;
        }
        if (! filled($employer->business_email) || ! filter_var($employer->business_email, FILTER_VALIDATE_EMAIL)) {
            return false;
        }
        if (! filled($employer->gst_number) || ! self::validGst((string) $employer->gst_number)) {
            return false;
        }
        if (! filled($employer->billing_address)) {
            return false;
        }
        if (! in_array((string) $employer->payment_method, self::PAYMENT_METHODS, true)) {
            return false;
        }

        return self::hasPaymentDetails($employer);
    }

    public static function missingFields(Employer $employer): array
    {
        $missing = [];
        if (! filled($employer->company_name)) {
            $missing[] = 'company_name';
        }
        if (! filled($employer->business_email)) {
            $missing[] = 'business_email';
        }
        if (! filled($employer->gst_number)) {
            $missing[] = 'gst_number';
        }
        if (! filled($employer->billing_address)) {
            $missing[] = 'billing_address';
        }
        if (! filled($employer->payment_method)) {
            $missing[] = 'payment_method';
        } elseif (! self::hasPaymentDetails($employer)) {
            $missing[] = 'payment_details';
        }

        return $missing;
    }

    public static function assertCanGoLive(Employer $employer): void
    {
        if (self::canGoLive($employer)) {
            return;
        }

        throw ValidationException::withMessages([
            'billing' => [
                'Complete company details, GST, business email, and payment before going live.',
            ],
            'missing' => self::missingFields($employer),
        ]);
    }

    public static function validGst(string $gst): bool
    {
        $gst = strtoupper(trim($gst));

        return (bool) preg_match('/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/', $gst);
    }

    public static function hasPaymentDetails(Employer $employer): bool
    {
        return match ((string) $employer->payment_method) {
            'upi' => filled($employer->payment_upi_id),
            'bank' => filled($employer->payment_account_name)
                && filled($employer->payment_bank_name)
                && filled($employer->payment_account_number)
                && filled($employer->payment_ifsc),
            'card', 'invoice' => filled($employer->business_email),
            default => false,
        };
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public static function apply(Employer $employer, array $data): array
    {
        $payload = [];
        foreach ([
            'company_name',
            'website',
            'country_code',
            'business_email',
            'gst_number',
            'billing_address',
            'payment_method',
            'payment_upi_id',
            'payment_account_name',
            'payment_bank_name',
            'payment_account_number',
            'payment_ifsc',
        ] as $key) {
            if (! array_key_exists($key, $data)) {
                continue;
            }
            $value = $data[$key];
            if ($key === 'gst_number' && is_string($value)) {
                $value = strtoupper(trim($value));
            }
            if ($key === 'country_code' && is_string($value)) {
                $value = strtoupper(trim($value));
            }
            if ($key === 'business_email' && is_string($value)) {
                $value = strtolower(trim($value));
            }
            $payload[$key] = $value;
        }

        $employer->fill($payload);

        return $payload;
    }

    public static function markComplete(Employer $employer): void
    {
        if (! Schema::hasColumn('employers', 'billing_completed_at')) {
            return;
        }
        if (self::canGoLive($employer)) {
            $employer->billing_completed_at = $employer->billing_completed_at ?? now();
        }
    }
}
