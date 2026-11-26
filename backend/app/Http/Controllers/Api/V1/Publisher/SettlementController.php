<?php

namespace App\Http\Controllers\Api\V1\Publisher;

use App\Http\Controllers\Controller;
use App\Models\MemberSettlementRecord;
use App\Services\Payments\PaymentEvidenceService;
use App\Services\Publishers\MemberSettlementService;
use App\Support\ApiResponse;
use App\Support\PublisherAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SettlementController extends Controller
{
    use ApiResponse;

    public function __construct(
        private MemberSettlementService $settlements,
        private PaymentEvidenceService $evidence,
    ) {}

    public function release(Request $request, MemberSettlementRecord $settlement): JsonResponse
    {
        PublisherAccess::assertFinancialAccess($request->user());
        $publisher = PublisherAccess::publisher($request->user());

        $data = $request->validate([
            'evidence' => ['required', 'file', 'max:'.PaymentEvidenceService::MAX_KB],
            'evidence_note' => ['nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        try {
            $updated = $this->settlements->releaseWithEvidence(
                $settlement,
                $publisher,
                $request->file('evidence'),
                $request->user(),
                [
                    'evidence_note' => $data['evidence_note'] ?? null,
                    'notes' => $data['notes'] ?? null,
                ],
            );
        } catch (InvalidArgumentException $e) {
            return $this->error('SETTLEMENT_RELEASE_FAILED', $e->getMessage(), 422);
        }

        return $this->success([
            'id' => $updated->id,
            'status' => $updated->status,
            'amount_usd' => $updated->amount_usd,
            'settled_at' => optional($updated->settled_at)?->toIso8601String(),
            'evidence' => $this->evidence->meta($updated),
            'member_name' => $updated->networkMember?->display_name,
            'community_name' => $updated->community?->name,
            'wallet_available_usd' => $this->settlements->availableWalletUsd($publisher),
        ]);
    }

    public function evidence(Request $request, MemberSettlementRecord $settlement): StreamedResponse|JsonResponse
    {
        PublisherAccess::assertFinancialAccess($request->user());
        $publisher = PublisherAccess::publisher($request->user());

        if ((int) $settlement->publisher_id !== (int) $publisher->id) {
            return $this->error('FORBIDDEN', 'Settlement not in your network.', 403);
        }

        if (! $settlement->evidence_path) {
            return $this->error('NOT_FOUND', 'No payment evidence on this settlement.', 404);
        }

        return $this->evidence->download($settlement);
    }
}
