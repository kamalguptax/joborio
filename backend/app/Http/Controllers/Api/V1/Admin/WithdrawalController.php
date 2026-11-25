<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\WithdrawalRequest;
use App\Services\Payments\PaymentEvidenceService;
use App\Services\Payments\WithdrawalService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class WithdrawalController extends Controller
{
    use ApiResponse;

    public function __construct(
        private WithdrawalService $withdrawals,
        private PaymentEvidenceService $evidence,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'status' => ['nullable', 'in:pending,approved,rejected,paid,cancelled'],
            'role' => ['nullable', 'in:creator,publisher,network_member'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $q = WithdrawalRequest::query()
            ->with(['user:id,name,email'])
            ->latest('id')
            ->limit((int) ($data['limit'] ?? 50));

        if (! empty($data['status'])) {
            $q->where('status', $data['status']);
        }
        if (! empty($data['role'])) {
            $q->where('role', $data['role']);
        }

        return $this->success([
            'withdrawals' => $q->get()
                ->map(fn (WithdrawalRequest $w) => $this->withdrawals->serialize($w))
                ->all(),
        ]);
    }

    public function reject(Request $request, WithdrawalRequest $withdrawal): JsonResponse
    {
        $data = $request->validate([
            'admin_note' => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $row = $this->withdrawals->reject($withdrawal, $request->user(), $data);
        } catch (InvalidArgumentException $e) {
            return $this->error('WITHDRAWAL_REJECTED', $e->getMessage(), 422);
        }

        return $this->success($this->withdrawals->serialize($row));
    }

    public function pay(Request $request, WithdrawalRequest $withdrawal): JsonResponse
    {
        $data = $request->validate([
            'evidence' => ['required', 'file', 'max:'.PaymentEvidenceService::MAX_KB],
            'evidence_note' => ['nullable', 'string', 'max:1000'],
            'external_reference' => ['nullable', 'string', 'max:190'],
            'admin_note' => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $row = $this->withdrawals->pay(
                $withdrawal,
                $request->user(),
                $data['evidence'],
                [
                    'evidence_note' => $data['evidence_note'] ?? null,
                    'external_reference' => $data['external_reference'] ?? null,
                    'admin_note' => $data['admin_note'] ?? null,
                ],
            );
        } catch (InvalidArgumentException $e) {
            return $this->error('WITHDRAWAL_REJECTED', $e->getMessage(), 422);
        }

        return $this->success($this->withdrawals->serialize($row));
    }

    public function evidence(WithdrawalRequest $withdrawal): StreamedResponse
    {
        return $this->evidence->download($withdrawal);
    }
}
