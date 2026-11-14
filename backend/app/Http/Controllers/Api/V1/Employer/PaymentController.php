<?php

namespace App\Http\Controllers\Api\V1\Employer;

use App\Http\Controllers\Controller;
use App\Models\EmployerPaymentOrder;
use App\Models\Program;
use App\Services\Payments\RazorpayPaymentService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use RuntimeException;

class PaymentController extends Controller
{
    use ApiResponse;

    public function config(RazorpayPaymentService $razorpay): JsonResponse
    {
        return $this->success([
            'enabled' => $razorpay->enabled(),
            'key_id' => $razorpay->publicKey(),
            'currency' => 'INR',
            'usd_inr_rate' => $razorpay->fxRate(),
            'mode' => str_starts_with((string) $razorpay->publicKey(), 'rzp_test_') ? 'test' : 'live',
        ]);
    }

    public function createOrder(Request $request, RazorpayPaymentService $razorpay): JsonResponse
    {
        $employer = $request->user()->employer;
        if (! $employer) {
            return $this->error('NOT_AN_EMPLOYER', 'Complete employer registration first.', 404);
        }

        $data = $request->validate([
            'amount_usd' => ['required', 'numeric', 'min:1', 'max:100000'],
            'purpose' => ['sometimes', Rule::in(['wallet', 'program_budget'])],
            'program_id' => ['nullable', 'integer', 'exists:programs,id'],
        ]);

        $purpose = $data['purpose'] ?? 'wallet';
        $program = null;
        if ($purpose === 'program_budget') {
            $program = Program::query()
                ->where('id', (int) ($data['program_id'] ?? 0))
                ->where('employer_id', $employer->id)
                ->first();
            if (! $program) {
                return $this->error('VALIDATION', 'Select a valid campaign to fund.', 422);
            }
        }

        try {
            $created = $razorpay->createOrder(
                $employer,
                (float) $data['amount_usd'],
                $purpose,
                $program,
            );
        } catch (RuntimeException $e) {
            return $this->error('RAZORPAY', $e->getMessage(), 422);
        }

        $order = $created['order'];

        return $this->success([
            'key_id' => $created['key_id'],
            'order_id' => $order->razorpay_order_id,
            'amount_paise' => $order->amount_paise,
            'amount_usd' => (float) $order->amount_usd,
            'currency' => $order->currency,
            'fx_rate' => (float) $order->fx_rate,
            'purpose' => $order->purpose,
            'program_id' => $order->program_id,
            'name' => 'JobOrio campaign funds',
            'description' => $purpose === 'program_budget'
                ? 'Campaign budget top-up'
                : 'Prepaid wallet top-up',
            'prefill' => [
                'email' => $employer->business_email ?: $request->user()->email,
                'name' => $employer->company_name ?: $request->user()->name,
            ],
        ]);
    }

    public function verify(Request $request, RazorpayPaymentService $razorpay): JsonResponse
    {
        $employer = $request->user()->employer;
        if (! $employer) {
            return $this->error('NOT_AN_EMPLOYER', 'Complete employer registration first.', 404);
        }

        $data = $request->validate([
            'razorpay_order_id' => ['required', 'string'],
            'razorpay_payment_id' => ['required', 'string'],
            'razorpay_signature' => ['required', 'string'],
        ]);

        try {
            $order = $razorpay->verifyAndCredit($employer, $data);
        } catch (RuntimeException $e) {
            return $this->error('RAZORPAY', $e->getMessage(), 422);
        }

        $employer->refresh();

        return $this->success([
            'order' => $order,
            'prepaid_balance_usd' => (float) $employer->prepaid_balance_usd,
            'message' => 'Payment successful. Funds credited.',
        ]);
    }

    public function history(Request $request): JsonResponse
    {
        $employer = $request->user()->employer;
        if (! $employer) {
            return $this->error('NOT_AN_EMPLOYER', 'Complete employer registration first.', 404);
        }

        $rows = EmployerPaymentOrder::query()
            ->where('employer_id', $employer->id)
            ->orderByDesc('id')
            ->limit(50)
            ->get();

        return $this->success([
            'orders' => $rows,
            'prepaid_balance_usd' => (float) $employer->prepaid_balance_usd,
        ]);
    }
}
