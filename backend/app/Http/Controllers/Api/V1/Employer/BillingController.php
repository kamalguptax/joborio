<?php

namespace App\Http\Controllers\Api\V1\Employer;

use App\Http\Controllers\Controller;
use App\Services\Payments\RazorpayPaymentService;
use App\Support\ApiResponse;
use App\Support\EmployerBilling;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BillingController extends Controller
{
    use ApiResponse;

    public function show(Request $request, RazorpayPaymentService $razorpay): JsonResponse
    {
        $employer = $request->user()->employer;
        if (! $employer) {
            return $this->error('NOT_AN_EMPLOYER', 'Complete employer registration first.', 404);
        }

        return $this->success([
            'employer' => $employer,
            'can_go_live' => $employer->canGoLive(),
            'missing' => $employer->billingMissing(),
            'prepaid_balance_usd' => (float) ($employer->prepaid_balance_usd ?? 0),
            'razorpay' => [
                'enabled' => $razorpay->enabled(),
                'key_id' => $razorpay->publicKey(),
                'usd_inr_rate' => $razorpay->fxRate(),
                'mode' => str_starts_with((string) $razorpay->publicKey(), 'rzp_test_') ? 'test' : 'live',
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $employer = $request->user()->employer;
        if (! $employer) {
            return $this->error('NOT_AN_EMPLOYER', 'Complete employer registration first.', 404);
        }

        $data = $request->validate([
            'company_name' => ['sometimes', 'string', 'max:255'],
            'website' => ['nullable', 'url', 'max:500'],
            'country_code' => ['nullable', 'string', 'size:2'],
            'business_email' => ['required', 'email', 'max:255'],
            'gst_number' => ['required', 'string', 'max:32'],
            'billing_address' => ['required', 'string', 'max:2000'],
            'payment_method' => ['required', Rule::in(EmployerBilling::PAYMENT_METHODS)],
            'payment_upi_id' => ['nullable', 'string', 'max:120'],
            'payment_account_name' => ['nullable', 'string', 'max:120'],
            'payment_bank_name' => ['nullable', 'string', 'max:120'],
            'payment_account_number' => ['nullable', 'string', 'max:64'],
            'payment_ifsc' => ['nullable', 'string', 'max:32'],
        ]);

        if (! EmployerBilling::validGst((string) $data['gst_number'])) {
            return $this->error('VALIDATION', 'Enter a valid 15-character GSTIN.', 422);
        }

        EmployerBilling::apply($employer, $data);

        if ($data['payment_method'] === 'upi' && ! filled($employer->payment_upi_id)) {
            return $this->error('VALIDATION', 'UPI ID is required for UPI payment.', 422);
        }
        if ($data['payment_method'] === 'bank' && ! EmployerBilling::hasPaymentDetails($employer)) {
            return $this->error('VALIDATION', 'Bank account name, bank, account number, and IFSC are required.', 422);
        }

        EmployerBilling::markComplete($employer);
        $employer->save();

        $fresh = $employer->fresh();

        return $this->success([
            'employer' => $fresh,
            'can_go_live' => $fresh->canGoLive(),
            'missing' => $fresh->billingMissing(),
        ]);
    }
}
