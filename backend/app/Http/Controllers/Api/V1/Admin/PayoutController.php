<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\PayoutBatch;
use App\Models\Publisher;
use App\Models\PublisherLedgerEntry;
use App\Services\Payments\PaymentEvidenceService;
use App\Services\Payouts\PayoutBatchService;
use App\Services\Payouts\PublisherPayoutService;
use App\Services\Payouts\TransactionHistoryService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PayoutController extends Controller
{
    use ApiResponse;

    public function __construct(
        private PayoutBatchService $payouts,
        private PublisherPayoutService $publisherPayouts,
        private TransactionHistoryService $history,
        private PaymentEvidenceService $evidence,
    ) {}

    public function transactions(Request $request): JsonResponse
    {
        if ($request->string('view')->toString() === 'users') {
            $page = $this->history->paginate(
                $this->history->byUser(),
                (int) $request->input('page', 1),
                (int) $request->input('per_page', 40),
            );

            return $this->success($page['items'], 200, [
                'type' => 'users',
                'current_page' => $page['current_page'],
                'last_page' => $page['last_page'],
                'total' => $page['total'],
            ]);
        }

        $userId = $request->integer('user_id') ?: null;
        $rows = $this->history->all($userId);
        $search = Str::lower(trim($request->string('search')->toString()));
        if ($search !== '') {
            $rows = $rows->filter(function (array $row) use ($search) {
                $user = $row['user'] ?? [];
                $hay = Str::lower(implode(' ', array_filter([
                    $row['title'] ?? '',
                    $row['description'] ?? '',
                    $row['status'] ?? '',
                    $user['name'] ?? '',
                    $user['email'] ?? '',
                    $user['public_code'] ?? '',
                    $user['handle'] ?? '',
                ])));

                return str_contains($hay, $search);
            })->values();
        }

        $page = $this->history->paginate(
            $rows,
            (int) $request->input('page', 1),
            (int) $request->input('per_page', 40),
        );

        return $this->success($page['items'], 200, [
            'type' => 'transactions',
            'current_page' => $page['current_page'],
            'last_page' => $page['last_page'],
            'total' => $page['total'],
        ]);
    }

    public function previewBatch(Request $request): JsonResponse
    {
        $mode = $request->string('mode', 'all')->toString();
        if (! in_array($mode, ['all', 'auto', 'manual'], true)) {
            return $this->error('INVALID_MODE', 'Mode must be all, auto, or manual.', 422);
        }

        return $this->success($this->payouts->preview($mode));
    }

    public function createBatch(Request $request): JsonResponse
    {
        $mode = $request->string('mode', 'manual')->toString();
        if (! in_array($mode, ['auto', 'manual'], true)) {
            return $this->error('INVALID_MODE', 'Mode must be auto or manual.', 422);
        }

        $batch = $this->payouts->createBatch($mode, $request->user());

        return $this->success($batch, 201);
    }

    public function completeBatch(Request $request, PayoutBatch $payoutBatch): JsonResponse
    {
        if ($payoutBatch->status === 'completed') {
            return $this->error('ALREADY_COMPLETED', 'Batch already completed.', 422);
        }

        $data = $request->validate([
            'evidence' => ['required', 'file', 'max:'.PaymentEvidenceService::MAX_KB],
            'evidence_note' => ['nullable', 'string', 'max:2000'],
            'external_reference' => ['nullable', 'string', 'max:190'],
        ]);

        try {
            $batch = $this->payouts->completeBatch(
                $payoutBatch,
                $request->file('evidence'),
                $request->user(),
                [
                    'evidence_note' => $data['evidence_note'] ?? null,
                    'external_reference' => $data['external_reference'] ?? null,
                ],
            );
        } catch (InvalidArgumentException $e) {
            return $this->error('PAYOUT_RELEASE_FAILED', $e->getMessage(), 422);
        }

        return $this->success([
            'id' => $batch->id,
            'status' => $batch->status,
            'total_usd' => $batch->total_usd,
            'evidence' => $this->evidence->meta($batch),
            'lines' => $batch->lines,
        ]);
    }

    public function evidence(PayoutBatch $payoutBatch): StreamedResponse|JsonResponse
    {
        if (! $payoutBatch->evidence_path) {
            return $this->error('NOT_FOUND', 'No payment evidence on this batch.', 404);
        }

        return $this->evidence->download($payoutBatch);
    }

    public function indexBatches(): JsonResponse
    {
        $batches = PayoutBatch::query()
            ->withCount('lines')
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn (PayoutBatch $b) => [
                'id' => $b->id,
                'status' => $b->status,
                'source' => $b->source,
                'total_usd' => $b->total_usd,
                'lines_count' => $b->lines_count,
                'processed_at' => optional($b->processed_at)?->toIso8601String(),
                'created_at' => optional($b->created_at)?->toIso8601String(),
                'evidence' => $this->evidence->meta($b),
            ]);

        return $this->success($batches);
    }

    public function previewPublishers(): JsonResponse
    {
        return $this->success($this->publisherPayouts->preview());
    }

    public function recentPublisherReleases(): JsonResponse
    {
        return $this->success([
            'releases' => $this->publisherPayouts->recentReleases(),
        ]);
    }

    public function releasePublisher(Request $request, Publisher $publisher): JsonResponse
    {
        $data = $request->validate([
            'evidence' => ['required', 'file', 'max:'.PaymentEvidenceService::MAX_KB],
            'evidence_note' => ['nullable', 'string', 'max:2000'],
            'external_reference' => ['nullable', 'string', 'max:190'],
        ]);

        try {
            $result = $this->publisherPayouts->release(
                $publisher,
                $request->file('evidence'),
                $request->user(),
                [
                    'evidence_note' => $data['evidence_note'] ?? null,
                    'external_reference' => $data['external_reference'] ?? null,
                ],
            );
        } catch (InvalidArgumentException $e) {
            return $this->error('PUBLISHER_PAYOUT_FAILED', $e->getMessage(), 422);
        }

        return $this->success($result);
    }

    public function publisherEvidence(Publisher $publisher, PublisherLedgerEntry $ledger): StreamedResponse|JsonResponse
    {
        if ((int) $ledger->publisher_id !== (int) $publisher->id) {
            return $this->error('FORBIDDEN', 'Ledger entry does not belong to this publisher.', 403);
        }
        if (! $ledger->evidence_path) {
            return $this->error('NOT_FOUND', 'No payment evidence on this ledger entry.', 404);
        }

        return $this->evidence->download($ledger);
    }

    public function exportReport(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $view = $request->string('view', 'transactions')->toString();
        $userId = $request->integer('user_id') ?: null;
        $search = Str::lower(trim($request->string('search')->toString()));

        if ($view === 'users') {
            $rows = $this->history->byUser();
            $filename = 'payouts-by-user-'.now()->format('Ymd-His').'.csv';
            $header = [
                'creator_id', 'user_id', 'name', 'email', 'handle', 'public_code',
                'credits_usd', 'pending_usd', 'payable_usd', 'paid_out_usd', 'last_at',
            ];
            $body = $rows->map(function (array $row) {
                $user = $row['user'] ?? [];

                return [
                    $row['creator_id'] ?? '',
                    $user['id'] ?? '',
                    $user['name'] ?? '',
                    $user['email'] ?? '',
                    $user['handle'] ?? '',
                    $user['public_code'] ?? '',
                    $row['credits_usd'] ?? 0,
                    $row['pending_usd'] ?? 0,
                    $row['payable_usd'] ?? 0,
                    $row['paid_out_usd'] ?? 0,
                    $row['last_at'] ?? '',
                ];
            })->all();
        } else {
            $rows = $this->history->all($userId);
            if ($search !== '') {
                $rows = $rows->filter(function (array $row) use ($search) {
                    $user = $row['user'] ?? [];
                    $hay = Str::lower(implode(' ', array_filter([
                        $row['title'] ?? '',
                        $row['description'] ?? '',
                        $row['status'] ?? '',
                        $user['name'] ?? '',
                        $user['email'] ?? '',
                        $user['public_code'] ?? '',
                        $user['handle'] ?? '',
                    ])));

                    return str_contains($hay, $search);
                })->values();
            }
            $filename = 'payouts-transactions-'.now()->format('Ymd-His').'.csv';
            $header = [
                'id', 'type', 'title', 'description', 'status', 'amount_usd',
                'user_id', 'user_name', 'user_email', 'handle', 'created_at',
            ];
            $body = $rows->map(function (array $row) {
                $user = $row['user'] ?? [];

                return [
                    $row['id'] ?? '',
                    $row['type'] ?? '',
                    $row['title'] ?? '',
                    $row['description'] ?? '',
                    $row['status'] ?? '',
                    $row['amount_usd'] ?? ($row['net_usd'] ?? 0),
                    $user['id'] ?? '',
                    $user['name'] ?? '',
                    $user['email'] ?? '',
                    $user['handle'] ?? '',
                    $row['created_at'] ?? ($row['at'] ?? ''),
                ];
            })->all();
        }

        return response()->streamDownload(function () use ($header, $body) {
            $out = fopen('php://output', 'w');
            fputcsv($out, $header);
            foreach ($body as $row) {
                fputcsv($out, $row);
            }
            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
