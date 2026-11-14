<?php

namespace App\Services\Payments;

use App\Models\Employer;
use App\Models\EmployerPaymentOrder;
use App\Models\Program;
use App\Services\Programs\ProgramBudgetService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class RazorpayPaymentService
{
    public function __construct(private ProgramBudgetService $budgets) {}

    public function enabled(): bool
    {
        return filled(config('services.razorpay.key_id'))
            && filled(config('services.razorpay.key_secret'));
    }

    public function publicKey(): ?string
    {
        $key = config('services.razorpay.key_id');

        return filled($key) ? (string) $key : null;
    }

    public function fxRate(): float
    {
        return max(1.0, (float) config('services.razorpay.usd_inr_rate', 83));
    }

    /**
     * @return array{order: EmployerPaymentOrder, razorpay_order: array<string, mixed>, key_id: string}
     */
    public function createOrder(
        Employer $employer,
        float $amountUsd,
        string $purpose = 'wallet',
        ?Program $program = null,
    ): array {
        if (! $this->enabled()) {
            throw new RuntimeException('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
        }

        if ($amountUsd < 1) {
            throw new RuntimeException('Minimum top-up is $1.00 USD.');
        }

        if ($purpose === 'program_budget') {
            if (! $program || (int) $program->employer_id !== (int) $employer->id) {
                throw new RuntimeException('Invalid campaign for this payment.');
            }
        }

        $fx = $this->fxRate();
        $amountInr = round($amountUsd * $fx, 2);
        $amountPaise = (int) round($amountInr * 100);
        if ($amountPaise < 100) {
            throw new RuntimeException('Amount too small for Razorpay (min ₹1).');
        }

        $receipt = 'joborio_'.Str::lower(Str::random(12));

        $response = Http::withBasicAuth(
            (string) config('services.razorpay.key_id'),
            (string) config('services.razorpay.key_secret'),
        )->asJson()->post('https://api.razorpay.com/v1/orders', [
            'amount' => $amountPaise,
            'currency' => 'INR',
            'receipt' => $receipt,
            'notes' => [
                'employer_id' => (string) $employer->id,
                'program_id' => $program?->id ? (string) $program->id : '',
                'purpose' => $purpose,
                'amount_usd' => (string) $amountUsd,
            ],
        ]);

        if (! $response->successful()) {
            throw new RuntimeException('Razorpay order failed: '.$response->body());
        }

        $razorOrder = $response->json();
        $orderId = (string) ($razorOrder['id'] ?? '');
        if ($orderId === '') {
            throw new RuntimeException('Razorpay did not return an order id.');
        }

        $order = EmployerPaymentOrder::create([
            'employer_id' => $employer->id,
            'program_id' => $program?->id,
            'provider' => 'razorpay',
            'purpose' => $purpose,
            'currency' => 'INR',
            'amount_paise' => $amountPaise,
            'amount_usd' => round($amountUsd, 4),
            'fx_rate' => $fx,
            'razorpay_order_id' => $orderId,
            'status' => 'created',
            'meta' => [
                'receipt' => $receipt,
                'razorpay_order' => $razorOrder,
            ],
        ]);

        return [
            'order' => $order,
            'razorpay_order' => $razorOrder,
            'key_id' => (string) config('services.razorpay.key_id'),
        ];
    }

    /**
     * @param  array{razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string}  $payload
     */
    public function verifyAndCredit(Employer $employer, array $payload): EmployerPaymentOrder
    {
        $orderId = (string) $payload['razorpay_order_id'];
        $paymentId = (string) $payload['razorpay_payment_id'];
        $signature = (string) $payload['razorpay_signature'];

        $order = EmployerPaymentOrder::query()
            ->where('employer_id', $employer->id)
            ->where('razorpay_order_id', $orderId)
            ->first();

        if (! $order) {
            throw new RuntimeException('Payment order not found.');
        }

        if ($order->status === 'paid' && $order->credited_at) {
            return $order;
        }

        $expected = hash_hmac(
            'sha256',
            $orderId.'|'.$paymentId,
            (string) config('services.razorpay.key_secret'),
        );

        if (! hash_equals($expected, $signature)) {
            $order->update(['status' => 'failed']);
            throw new RuntimeException('Invalid Razorpay signature.');
        }

        return DB::transaction(function () use ($order, $paymentId, $signature, $employer) {
            $locked = EmployerPaymentOrder::query()->whereKey($order->id)->lockForUpdate()->firstOrFail();
            if ($locked->status === 'paid' && $locked->credited_at) {
                return $locked;
            }

            $locked->update([
                'razorpay_payment_id' => $paymentId,
                'razorpay_signature' => $signature,
                'status' => 'paid',
                'credited_at' => now(),
            ]);

            $amount = (float) $locked->amount_usd;

            if ($locked->purpose === 'program_budget' && $locked->program_id) {
                $program = Program::query()
                    ->where('id', $locked->program_id)
                    ->where('employer_id', $employer->id)
                    ->lockForUpdate()
                    ->first();
                if ($program) {
                    $this->budgets->creditBudget($program, $amount);
                }
            } else {
                $emp = Employer::query()->whereKey($employer->id)->lockForUpdate()->firstOrFail();
                $emp->update([
                    'prepaid_balance_usd' => round((float) $emp->prepaid_balance_usd + $amount, 4),
                ]);
            }

            return $locked->fresh();
        });
    }
}
