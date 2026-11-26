<?php

namespace App\Http\Controllers\Api\V1\Employer;

use App\Http\Controllers\Controller;
use App\Models\EmployerLedgerEntry;
use App\Models\EmployerPaymentOrder;
use App\Models\Program;
use App\Support\ApiResponse;
use App\Support\ResolvesEmployer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class WalletController extends Controller
{
    use ApiResponse;
    use ResolvesEmployer;

    public function summary(Request $request): JsonResponse
    {
        $employer = $this->employerOrFail($request);

        $programs = Program::query()
            ->where('employer_id', $employer->id)
            ->get(['id', 'title', 'budget_total_usd', 'budget_spent_usd', 'status']);

        $totalBudget = (float) $programs->sum('budget_total_usd');
        $totalSpent = (float) $programs->sum('budget_spent_usd');
        $available = (float) ($employer->prepaid_balance_usd ?? 0);
        $reserved = max(0, $totalBudget - $totalSpent);

        $paidOrders = EmployerPaymentOrder::query()
            ->where('employer_id', $employer->id)
            ->where('status', 'paid')
            ->sum('amount_usd');

        $tiles = [
            ['l' => 'Available balance', 'v' => round($available, 2), 'n' => 'Prepaid wallet (USD)'],
            ['l' => 'Reserved budget', 'v' => round($reserved, 2), 'n' => 'Active campaign remaining'],
            ['l' => 'Approved spend', 'v' => round($totalSpent, 2), 'n' => 'All campaigns'],
            ['l' => 'Pending value', 'v' => 0, 'n' => 'Awaiting approval'],
            ['l' => 'Lifetime top-ups', 'v' => round((float) $paidOrders, 2), 'n' => 'Razorpay paid'],
            ['l' => 'Campaigns', 'v' => $programs->count(), 'n' => 'Total programs'],
        ];

        $expenditure = $programs->map(fn (Program $p) => [
            'id' => $p->id,
            'name' => $p->title,
            'budget' => round((float) $p->budget_total_usd, 2),
            'spent' => round((float) $p->budget_spent_usd, 2),
            'pending' => 0,
            'status' => $p->status,
        ])->values();

        $ledgerRows = [];

        $manual = EmployerLedgerEntry::query()
            ->where('employer_id', $employer->id)
            ->with('program:id,title')
            ->latest()
            ->limit(50)
            ->get();

        foreach ($manual as $row) {
            $ledgerRows[] = [
                'id' => $row->code,
                'date' => optional($row->created_at)->toDateString(),
                'type' => $row->entry_type,
                'campaign' => $row->program_id ? 'JO-C-'.$row->program_id : '—',
                'debit' => (float) $row->debit_usd > 0 ? round((float) $row->debit_usd, 2) : null,
                'credit' => (float) $row->credit_usd > 0 ? round((float) $row->credit_usd, 2) : null,
            ];
        }

        $orders = EmployerPaymentOrder::query()
            ->where('employer_id', $employer->id)
            ->latest()
            ->limit(50)
            ->get();

        foreach ($orders as $order) {
            $ledgerRows[] = [
                'id' => 'RZ-'.$order->id,
                'date' => optional($order->credited_at ?? $order->created_at)->toDateString(),
                'type' => 'Razorpay '.str_replace('_', ' ', (string) $order->purpose),
                'campaign' => $order->program_id ? 'JO-C-'.$order->program_id : '—',
                'debit' => null,
                'credit' => $order->status === 'paid' ? round((float) $order->amount_usd, 2) : null,
                'status' => $order->status,
            ];
        }

        usort($ledgerRows, fn ($a, $b) => strcmp((string) ($b['date'] ?? ''), (string) ($a['date'] ?? '')));

        return $this->success([
            'tiles' => $tiles,
            'expenditure' => $expenditure,
            'ledger' => array_slice($ledgerRows, 0, 100),
            'prepaid_balance_usd' => $available,
            'can_go_live' => $employer->canGoLive(),
            'missing_labels' => $employer->billingMissingLabels(),
        ]);
    }

    public function recordAdjustment(Request $request): JsonResponse
    {
        $employer = $this->employerOrFail($request);
        $data = $request->validate([
            'entry_type' => ['required', 'string', 'max:64'],
            'program_id' => ['nullable', 'integer', 'exists:programs,id'],
            'debit_usd' => ['nullable', 'numeric', 'min:0'],
            'credit_usd' => ['nullable', 'numeric', 'min:0'],
            'reference' => ['nullable', 'string', 'max:120'],
        ]);

        if (! empty($data['program_id'])) {
            $owns = Program::query()
                ->where('id', $data['program_id'])
                ->where('employer_id', $employer->id)
                ->exists();
            if (! $owns) {
                return $this->error('NOT_FOUND', 'Campaign not found.', 404);
            }
        }

        $entry = EmployerLedgerEntry::create([
            'employer_id' => $employer->id,
            'program_id' => $data['program_id'] ?? null,
            'code' => 'LED-'.Str::upper(Str::random(6)),
            'entry_type' => $data['entry_type'],
            'debit_usd' => $data['debit_usd'] ?? 0,
            'credit_usd' => $data['credit_usd'] ?? 0,
            'reference' => $data['reference'] ?? null,
        ]);

        return $this->success(['entry' => $entry], 201);
    }
}
