<?php

namespace App\Services\Payouts;

use App\Models\Creator;
use App\Models\EarningLedger;
use App\Models\PayoutLine;
use Illuminate\Support\Collection;

class TransactionHistoryService
{
    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function forCreator(int $creatorId): Collection
    {
        $earnings = EarningLedger::query()
            ->where('creator_id', $creatorId)
            ->with(['attributionEvent.listing:id,title'])
            ->get();

        $payouts = PayoutLine::query()
            ->where('creator_id', $creatorId)
            ->with('batch:id,status,source')
            ->get();

        return $this->merge($earnings, $payouts, false);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function all(?int $userId = null): Collection
    {
        $earnings = EarningLedger::query()
            ->with(['attributionEvent.listing:id,title', 'creator.user:id,name,email']);
        $payouts = PayoutLine::query()
            ->with(['batch:id,status,source', 'creator.user:id,name,email']);

        if ($userId) {
            $earnings->whereHas('creator', fn ($creator) => $creator->where('user_id', $userId));
            $payouts->whereHas('creator', fn ($creator) => $creator->where('user_id', $userId));
        }

        return $this->merge($earnings->get(), $payouts->get(), true);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function byUser(): Collection
    {
        $earnings = EarningLedger::query()->get()->groupBy('creator_id');
        $payouts = PayoutLine::query()->get()->groupBy('creator_id');
        $ids = $earnings->keys()->merge($payouts->keys())->unique()->filter()->values();
        $creators = Creator::query()
            ->with('user:id,name,email')
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');

        return $ids->map(function ($creatorId) use ($earnings, $payouts, $creators) {
            $earned = $earnings->get($creatorId, collect());
            $paidLines = $payouts->get($creatorId, collect());
            $creator = $creators->get($creatorId);
            $lastEarning = $earned->sortByDesc('created_at')->first();
            $lastPayout = $paidLines->sortByDesc('created_at')->first();
            $last = collect([$lastEarning?->created_at, $lastPayout?->created_at])->filter()->sortDesc()->first();

            return [
                'creator_id' => (int) $creatorId,
                'credits_usd' => round((float) $earned->sum('net_usd'), 4),
                'pending_usd' => round((float) $earned->where('state', 'pending')->sum('net_usd'), 4),
                'payable_usd' => round((float) $earned->whereIn('state', ['approved', 'payable'])->sum('net_usd'), 4),
                'paid_usd' => round((float) $earned->where('state', 'paid')->sum('net_usd'), 4),
                'paid_out_usd' => round((float) $paidLines->where('status', 'paid')->sum('amount_usd'), 2),
                'transactions' => $earned->count() + $paidLines->count(),
                'last_at' => $last?->toIso8601String(),
                'user' => $this->userPayload($creator),
            ];
        })->sortByDesc('credits_usd')->values();
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $rows
     * @return array{items: Collection<int, array<string, mixed>>, current_page: int, last_page: int, total: int}
     */
    public function paginate(Collection $rows, int $page, int $perPage): array
    {
        $page = max(1, $page);
        $perPage = min(max(1, $perPage), 100);
        $total = $rows->count();

        return [
            'items' => $rows->slice(($page - 1) * $perPage, $perPage)->values(),
            'current_page' => $page,
            'last_page' => max(1, (int) ceil($total / max(1, $perPage))),
            'total' => $total,
        ];
    }

    /**
     * @param  Collection<int, EarningLedger>  $earnings
     * @param  Collection<int, PayoutLine>  $payouts
     * @return Collection<int, array<string, mixed>>
     */
    private function merge(Collection $earnings, Collection $payouts, bool $withUser): Collection
    {
        $rows = $earnings
            ->map(fn (EarningLedger $earning) => $this->earningRow($earning, $withUser))
            ->merge($payouts->map(fn (PayoutLine $line) => $this->payoutRow($line, $withUser)));

        return $rows->sortByDesc('occurred_at')->values();
    }

    /**
     * @return array<string, mixed>
     */
    private function earningRow(EarningLedger $earning, bool $withUser): array
    {
        $event = $earning->attributionEvent;
        $job = $event?->listing?->title ?: data_get($event?->meta, 'title');
        $titles = [
            'ppc' => 'Click earning',
            'ppr' => 'Signup earning',
            'ppa' => 'Application earning',
        ];

        return [
            'id' => 'earn-'.$earning->id,
            'kind' => 'credit',
            'title' => $titles[$earning->earning_type] ?? 'Earning',
            'description' => $job ?: null,
            'amount_usd' => round((float) $earning->net_usd, 4),
            'status' => $earning->state,
            'occurred_at' => $earning->created_at?->toIso8601String(),
            'user' => $withUser ? $this->userPayload($earning->creator) : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function payoutRow(PayoutLine $line, bool $withUser): array
    {
        $methods = [
            'upi' => 'UPI',
            'bank_transfer' => 'Bank transfer',
            'paypal' => 'PayPal',
            'stripe_connect' => 'Stripe',
        ];
        $method = $methods[$line->method] ?? 'Payout account';
        $when = $line->status === 'paid' ? ($line->updated_at ?? $line->created_at) : $line->created_at;

        return [
            'id' => 'payout-'.$line->id,
            'kind' => 'debit',
            'title' => 'Payout',
            'description' => trim($method.($line->batch ? ' · batch #'.$line->batch->id : '')),
            'amount_usd' => round((float) $line->amount_usd, 2),
            'status' => $line->status === 'paid' ? 'paid' : 'payable',
            'occurred_at' => $when?->toIso8601String(),
            'user' => $withUser ? $this->userPayload($line->creator) : null,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function userPayload(?Creator $creator): ?array
    {
        if (! $creator) {
            return null;
        }

        $user = $creator->user;

        return [
            'id' => $user?->id,
            'name' => $user?->name,
            'email' => $user?->email,
            'public_code' => $user?->public_code,
            'handle' => $creator->handle,
        ];
    }
}
