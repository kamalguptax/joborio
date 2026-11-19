<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\PayoutBatch;
use App\Services\Payouts\PayoutBatchService;
use App\Services\Payouts\TransactionHistoryService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PayoutController extends Controller
{
    use ApiResponse;

    public function __construct(
        private PayoutBatchService $payouts,
        private TransactionHistoryService $history,
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

    public function completeBatch(PayoutBatch $payoutBatch): JsonResponse
    {
        if ($payoutBatch->status === 'completed') {
            return $this->error('ALREADY_COMPLETED', 'Batch already completed.', 422);
        }

        $batch = $this->payouts->completeBatch($payoutBatch);

        return $this->success($batch);
    }

    public function indexBatches(): JsonResponse
    {
        $batches = PayoutBatch::query()
            ->withCount('lines')
            ->latest()
            ->limit(20)
            ->get();

        return $this->success($batches);
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
