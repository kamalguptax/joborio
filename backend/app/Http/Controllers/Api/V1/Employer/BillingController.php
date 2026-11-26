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
            'missing_labels' => $employer->billingMissingLabels(),
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
            'phone' => ['nullable', 'string', 'max:40'],
            'primary_contact' => ['nullable', 'string', 'max:120'],
            'gst_number' => ['required', 'string', 'max:32'],
            'billing_address' => ['required', 'string', 'max:2000'],
            'payment_method' => ['nullable', Rule::in(EmployerBilling::PAYMENT_METHODS)],
            'payment_upi_id' => ['nullable', 'string', 'max:120'],
            'payment_account_name' => ['nullable', 'string', 'max:120'],
            'payment_bank_name' => ['nullable', 'string', 'max:120'],
            'payment_account_number' => ['nullable', 'string', 'max:64'],
            'payment_ifsc' => ['nullable', 'string', 'max:32'],
        ]);

        if (! EmployerBilling::validGst((string) $data['gst_number'])) {
            return $this->error('VALIDATION', 'Enter a valid 15-character GSTIN.', 422);
        }

        if (empty($data['payment_method'])) {
            $data['payment_method'] = 'card';
        }

        EmployerBilling::apply($employer, $data);

        if (! empty($data['phone'])) {
            $employer->phone = $data['phone'];
        }
        if (! empty($data['primary_contact'])) {
            $employer->primary_contact = $data['primary_contact'];
        }

        EmployerBilling::markComplete($employer);
        $employer->save();

        $fresh = $employer->fresh();

        return $this->success([
            'employer' => $fresh,
            'can_go_live' => $fresh->canGoLive(),
            'missing' => $fresh->billingMissing(),
            'missing_labels' => $fresh->billingMissingLabels(),
        ]);
    }
}
