<?php

namespace App\Http\Controllers\Api\V1\Publisher;

use App\Http\Controllers\Controller;
use App\Models\Publisher;
use App\Models\WithdrawalRequest;
use App\Services\Payments\WithdrawalService;
use App\Support\ApiResponse;
use App\Support\PublisherAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class WithdrawalController extends Controller
{
    use ApiResponse;

    public function __construct(private WithdrawalService $withdrawals) {}

    public function statement(Request $request): JsonResponse
    {
        PublisherAccess::assertFinancialAccess($request->user());
        $publisher = PublisherAccess::publisher($request->user());

        return $this->success([
            'role' => 'publisher',
            'available_usd' => $this->withdrawals->availableUsd('publisher', (int) $publisher->id),
            'min_payout_usd' => $this->withdrawals->minPayoutUsd(),
            'rows' => $this->withdrawals->statement('publisher', (int) $publisher->id),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        PublisherAccess::assertFinancialAccess($request->user());
        $publisher = PublisherAccess::publisher($request->user());

        $rows = WithdrawalRequest::query()
            ->where('role', 'publisher')
            ->where('account_id', $publisher->id)
            ->latest('id')
            ->limit(40)
            ->get()
            ->map(fn (WithdrawalRequest $w) => $this->withdrawals->serialize($w))
            ->all();

        return $this->success([
            'available_usd' => $this->withdrawals->availableUsd('publisher', (int) $publisher->id),
            'min_payout_usd' => $this->withdrawals->minPayoutUsd(),
            'default_account' => $this->withdrawals->defaultAccountPayload($publisher),
            'withdrawals' => $rows,
        ]);
    }

    public function saveAccount(Request $request): JsonResponse
    {
        PublisherAccess::assertFinancialAccess($request->user());
        $publisher = PublisherAccess::publisher($request->user());

        $data = $request->validate([
            'payout_method' => ['required', 'in:upi,bank_transfer,paypal'],
            'holder_name' => ['nullable', 'string', 'max:120'],
            'upi_id' => ['nullable', 'string', 'max:120'],
            'paypal_email' => ['nullable', 'email', 'max:190'],
            'bank_name' => ['nullable', 'string', 'max:120'],
            'account_number' => ['nullable', 'string', 'max:34'],
            'ifsc' => ['nullable', 'string', 'max:20'],
        ]);

        try {
            $account = $this->withdrawals->saveDefaultAccount(
                'publisher',
                (int) $publisher->id,
                $data['payout_method'],
                $this->resolveDetails($publisher, $data),
            );
        } catch (InvalidArgumentException $e) {
            return $this->error('PAYOUT_ACCOUNT_INCOMPLETE', $e->getMessage(), 422);
        }

        return $this->success($account);
    }

    public function store(Request $request): JsonResponse
    {
        PublisherAccess::assertFinancialAccess($request->user());
        $publisher = PublisherAccess::publisher($request->user());

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

        $details = $this->resolveDetails($publisher, $data);

        try {
            $row = $this->withdrawals->request(
                $request->user(),
                'publisher',
                (int) $publisher->id,
                (float) $data['amount_usd'],
                $data['payout_method'],
                $details,
                $data['user_note'] ?? null,
            );
            if (! empty($data['save_as_default'])) {
                $this->withdrawals->saveDefaultAccount(
                    'publisher',
                    (int) $publisher->id,
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
        PublisherAccess::assertFinancialAccess($request->user());
        $publisher = PublisherAccess::publisher($request->user());

        if ($withdrawal->role !== 'publisher' || (int) $withdrawal->account_id !== (int) $publisher->id) {
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
    private function resolveDetails(Publisher $publisher, array $data): array
    {
        $method = $data['payout_method'];

        return match ($method) {
            'upi' => [
                'holder_name' => $data['holder_name'] ?: $publisher->payout_holder_name,
                'upi_id' => $data['upi_id'] ?: $publisher->payout_upi_id,
            ],
            'paypal' => [
                'paypal_email' => $data['paypal_email'] ?: $publisher->payout_paypal_email,
            ],
            'bank_transfer' => [
                'holder_name' => $data['holder_name'] ?: $publisher->payout_holder_name,
                'bank_name' => $data['bank_name'] ?: $publisher->payout_bank_name,
                'account_number' => $data['account_number'] ?: $publisher->payout_account_number,
                'ifsc' => isset($data['ifsc']) && $data['ifsc'] !== ''
                    ? strtoupper((string) $data['ifsc'])
                    : ($publisher->payout_ifsc ? strtoupper((string) $publisher->payout_ifsc) : null),
            ],
            default => [],
        };
    }
}
