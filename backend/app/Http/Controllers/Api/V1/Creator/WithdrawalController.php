<?php

namespace App\Http\Controllers\Api\V1\Creator;

use App\Http\Controllers\Controller;
use App\Models\WithdrawalRequest;
use App\Services\Payments\WithdrawalService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class WithdrawalController extends Controller
{
    use ApiResponse;

    public function __construct(private WithdrawalService $withdrawals) {}

    public function statement(Request $request): JsonResponse
    {
        $creator = $request->user()->creator;
        if (! $creator) {
            return $this->error('NOT_A_CREATOR', 'Creator profile not found.', 404);
        }

        return $this->success([
            'role' => 'creator',
            'available_usd' => $this->withdrawals->availableUsd('creator', (int) $creator->id),
            'min_payout_usd' => $this->withdrawals->minPayoutUsd(),
            'rows' => $this->withdrawals->statement('creator', (int) $creator->id),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $creator = $request->user()->creator;
        if (! $creator) {
            return $this->error('NOT_A_CREATOR', 'Creator profile not found.', 404);
        }

        $rows = WithdrawalRequest::query()
            ->where('role', 'creator')
            ->where('account_id', $creator->id)
            ->latest('id')
            ->limit(40)
            ->get()
            ->map(fn (WithdrawalRequest $w) => $this->withdrawals->serialize($w))
            ->all();

        return $this->success([
            'available_usd' => $this->withdrawals->availableUsd('creator', (int) $creator->id),
            'min_payout_usd' => $this->withdrawals->minPayoutUsd(),
            'withdrawals' => $rows,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $creator = $request->user()->creator;
        if (! $creator) {
            return $this->error('NOT_A_CREATOR', 'Creator profile not found.', 404);
        }

        $data = $request->validate([
            'amount_usd' => ['required', 'numeric', 'min:0.01'],
            'payout_method' => ['required', 'in:upi,bank_transfer,paypal'],
            'holder_name' => ['nullable', 'string', 'max:120'],
            'upi_id' => ['nullable', 'string', 'max:120'],
            'paypal_email' => ['nullable', 'email', 'max:190'],
            'bank_name' => ['nullable', 'string', 'max:120'],
            'account_number' => ['nullable', 'string', 'max:34'],
            'ifsc' => ['nullable', 'string', 'max:20'],
            'user_note' => ['nullable', 'string', 'max:500'],
            'save_as_default' => ['sometimes', 'boolean'],
        ]);

        $details = $this->resolveDetails($creator, $data);

        try {
            $row = $this->withdrawals->request(
                $request->user(),
                'creator',
                (int) $creator->id,
                (float) $data['amount_usd'],
                $data['payout_method'],
                $details,
                $data['user_note'] ?? null,
            );
            if (! empty($data['save_as_default'])) {
                $this->withdrawals->saveDefaultAccount(
                    'creator',
                    (int) $creator->id,
                    $data['payout_method'],
                    $details,
                );
            }
        } catch (InvalidArgumentException $e) {
            return $this->error('WITHDRAWAL_REJECTED', $e->getMessage(), 422);
        }

        return $this->success($this->withdrawals->serialize($row), status: 201);
    }

    public function cancel(Request $request, WithdrawalRequest $withdrawal): JsonResponse
    {
        $creator = $request->user()->creator;
        if (! $creator) {
            return $this->error('NOT_A_CREATOR', 'Creator profile not found.', 404);
        }
        if ($withdrawal->role !== 'creator' || (int) $withdrawal->account_id !== (int) $creator->id) {
            return $this->error('NOT_FOUND', 'Withdrawal not found.', 404);
        }

        try {
            $row = $this->withdrawals->cancel($withdrawal, $request->user());
        } catch (InvalidArgumentException $e) {
            return $this->error('WITHDRAWAL_REJECTED', $e->getMessage(), 422);
        }

        return $this->success($this->withdrawals->serialize($row));
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function resolveDetails(\App\Models\Creator $creator, array $data): array
    {
        $method = $data['payout_method'];

        return match ($method) {
            'upi' => [
                'holder_name' => $data['holder_name'] ?: $creator->payout_holder_name,
                'upi_id' => $data['upi_id'] ?: $creator->payout_upi_id,
            ],
            'paypal' => [
                'paypal_email' => $data['paypal_email'] ?: $creator->payout_paypal_email,
            ],
            'bank_transfer' => [
                'holder_name' => $data['holder_name'] ?: $creator->payout_holder_name,
                'bank_name' => $data['bank_name'] ?: $creator->payout_bank_name,
                'account_number' => $data['account_number'] ?: $creator->payout_account_number,
                'ifsc' => isset($data['ifsc'])
                    ? strtoupper((string) $data['ifsc'])
                    : ($creator->payout_ifsc ? strtoupper((string) $creator->payout_ifsc) : null),
            ],
            default => [],
        };
    }
}
