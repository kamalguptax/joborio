<?php

namespace App\Http\Controllers\Api\V1\Network;

use App\Http\Controllers\Controller;
use App\Models\NetworkMember;
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

    private function member(Request $request): ?NetworkMember
    {
        return NetworkMember::query()
            ->where('user_id', $request->user()->id)
            ->latest('id')
            ->first();
    }

    public function statement(Request $request): JsonResponse
    {
        $member = $this->member($request);
        if (! $member) {
            return $this->error('NOT_A_MEMBER', 'Network member profile not found.', 404);
        }

        return $this->success([
            'role' => 'network_member',
            'available_usd' => $this->withdrawals->availableUsd('network_member', (int) $member->id),
            'min_payout_usd' => $this->withdrawals->minPayoutUsd(),
            'rows' => $this->withdrawals->statement('network_member', (int) $member->id),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $member = $this->member($request);
        if (! $member) {
            return $this->error('NOT_A_MEMBER', 'Network member profile not found.', 404);
        }

        $rows = WithdrawalRequest::query()
            ->where('role', 'network_member')
            ->where('account_id', $member->id)
            ->latest('id')
            ->limit(40)
            ->get()
            ->map(fn (WithdrawalRequest $w) => $this->withdrawals->serialize($w))
            ->all();

        return $this->success([
            'available_usd' => $this->withdrawals->availableUsd('network_member', (int) $member->id),
            'min_payout_usd' => $this->withdrawals->minPayoutUsd(),
            'withdrawals' => $rows,
        ]);
    }

    public function saveAccount(Request $request): JsonResponse
    {
        $member = $this->member($request);
        if (! $member) {
            return $this->error('NOT_A_MEMBER', 'Network member profile not found.', 404);
        }

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
                'network_member',
                (int) $member->id,
                $data['payout_method'],
                $this->resolveDetails($member, $data),
            );
        } catch (InvalidArgumentException $e) {
            return $this->error('PAYOUT_ACCOUNT_INCOMPLETE', $e->getMessage(), 422);
        }

        return $this->success($account);
    }

    public function store(Request $request): JsonResponse
    {
        $member = $this->member($request);
        if (! $member) {
            return $this->error('NOT_A_MEMBER', 'Network member profile not found.', 404);
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

        $method = $data['payout_method'];
        $details = $this->resolveDetails($member, $data);

        try {
            $row = $this->withdrawals->request(
                $request->user(),
                'network_member',
                (int) $member->id,
                (float) $data['amount_usd'],
                $method,
                $details,
                $data['user_note'] ?? null,
            );
            if (! empty($data['save_as_default'])) {
                $this->withdrawals->saveDefaultAccount(
                    'network_member',
                    (int) $member->id,
                    $method,
                    $details,
                );
            }
        } catch (InvalidArgumentException $e) {
            return $this->error('WITHDRAWAL_REJECTED', $e->getMessage(), 422);
        }

        return $this->success($this->withdrawals->serialize($row), status: 201);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function resolveDetails(NetworkMember $member, array $data): array
    {
        $method = $data['payout_method'];

        return match ($method) {
            'upi' => [
                'holder_name' => $data['holder_name'] ?: $member->payout_holder_name,
                'upi_id' => $data['upi_id'] ?: $member->payout_upi_id,
            ],
            'paypal' => [
                'paypal_email' => $data['paypal_email'] ?: $member->payout_paypal_email,
            ],
            'bank_transfer' => [
                'holder_name' => $data['holder_name'] ?: $member->payout_holder_name,
                'bank_name' => $data['bank_name'] ?: $member->payout_bank_name,
                'account_number' => $data['account_number'] ?: $member->payout_account_number,
                'ifsc' => isset($data['ifsc']) && $data['ifsc'] !== ''
                    ? strtoupper((string) $data['ifsc'])
                    : ($member->payout_ifsc ? strtoupper((string) $member->payout_ifsc) : null),
            ],
            default => [],
        };
    }

    public function cancel(Request $request, WithdrawalRequest $withdrawal): JsonResponse
    {
        $member = $this->member($request);
        if (! $member) {
            return $this->error('NOT_A_MEMBER', 'Network member profile not found.', 404);
        }
        if ($withdrawal->role !== 'network_member' || (int) $withdrawal->account_id !== (int) $member->id) {
            return $this->error('NOT_FOUND', 'Withdrawal not found.', 404);
        }

        try {
            $row = $this->withdrawals->cancel($withdrawal, $request->user());
        } catch (InvalidArgumentException $e) {
            return $this->error('WITHDRAWAL_REJECTED', $e->getMessage(), 422);
        }

        return $this->success($this->withdrawals->serialize($row));
    }
}
