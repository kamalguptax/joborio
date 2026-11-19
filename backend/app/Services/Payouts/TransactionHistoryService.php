<?php

namespace App\Services\Payouts;

use App\Models\AttributionEvent;
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
     * One card per clicked job, with click totals + earnings for that job.
     *
     * @return list<array<string, mixed>>
     */
    public function forCreatorByJob(int $creatorId): array
    {
        $listingWith = [
            'listing:id,title,program_id,ppc_rate_usd,ppr_rate_usd,ppa_rate_usd',
            'listing.program:id,pricing_model,promotion_type',
        ];

        $events = AttributionEvent::query()
            ->where('creator_id', $creatorId)
            ->whereIn('event_type', ['click', 'job_view', 'job_apply'])
            ->with($listingWith)
            ->orderByDesc('created_at')
            ->get([
                'id',
                'event_type',
                'listing_id',
                'is_counted',
                'fraud_status',
                'meta',
                'created_at',
            ]);

        $earnings = EarningLedger::query()
            ->where('creator_id', $creatorId)
            ->with(array_merge(['attributionEvent'], [
                'attributionEvent.listing:id,title,program_id,ppc_rate_usd,ppr_rate_usd,ppa_rate_usd',
                'attributionEvent.listing.program:id,pricing_model,promotion_type',
            ]))
            ->get();

        $eventToKey = [];
        $groups = [];

        foreach ($events as $event) {
            $key = $this->jobGroupKey($event);
            $title = $this->jobTitle($event);
            $eventToKey[(int) $event->id] = $key;
            $model = $this->resolvePricingModel($event);

            if (! isset($groups[$key])) {
                $groups[$key] = $this->emptyJobGroup($key, $event, $title, $model);
            } else {
                $groups[$key]['earning_type'] = $this->preferPricingModel(
                    (string) ($groups[$key]['earning_type'] ?? ''),
                    $model,
                );
            }

            $groups[$key]['click_count']++;
            if ($event->is_counted || $event->event_type === 'job_view') {
                $groups[$key]['counted_count']++;
            }
            if ($event->fraud_status === 'dedup') {
                $groups[$key]['duplicate_count']++;
            }

            $last = strtotime((string) ($groups[$key]['last_at'] ?? '')) ?: 0;
            $at = $event->created_at?->getTimestamp() ?? 0;
            if ($at >= $last) {
                $groups[$key]['last_at'] = $event->created_at?->toIso8601String();
                if ($title !== '' && $title !== 'Job') {
                    $groups[$key]['title'] = $title;
                }
            }
        }

        foreach ($earnings as $earning) {
            $event = $earning->attributionEvent;
            $key = null;
            $model = strtolower(trim((string) $earning->earning_type));
            if ($event) {
                $eventId = (int) $event->id;
                $key = $eventToKey[$eventId] ?? $this->jobGroupKey($event);
                $title = $this->jobTitle($event);
                $model = $this->preferPricingModel(
                    $this->resolvePricingModel($event),
                    $model,
                );
            } else {
                $key = 'earning:'.$earning->id;
                $title = 'Earning';
            }

            if (! isset($groups[$key])) {
                $groups[$key] = $this->emptyJobGroup(
                    $key,
                    $event,
                    $title,
                    $model !== '' ? $model : 'ppc',
                );
            } else {
                $groups[$key]['earning_type'] = $this->preferPricingModel(
                    (string) ($groups[$key]['earning_type'] ?? ''),
                    $model,
                );
            }

            $net = (float) $earning->net_usd;
            $groups[$key]['earning_count']++;
            $groups[$key]['net_usd'] += $net;
            $state = (string) $earning->state;
            if ($state === 'pending') {
                $groups[$key]['pending_usd'] += $net;
            } elseif ($state === 'approved') {
                $groups[$key]['approved_usd'] += $net;
            } elseif ($state === 'payable') {
                $groups[$key]['payable_usd'] += $net;
            } elseif ($state === 'paid') {
                $groups[$key]['paid_usd'] += $net;
            }
            if ($title !== '' && $title !== 'Job') {
                $groups[$key]['title'] = $title;
            }
        }

        $rows = array_values(array_map(function (array $row): array {
            $row['net_usd'] = round($row['net_usd'], 4);
            $row['pending_usd'] = round($row['pending_usd'], 4);
            $row['approved_usd'] = round($row['approved_usd'], 4);
            $row['payable_usd'] = round($row['payable_usd'], 4);
            $row['paid_usd'] = round($row['paid_usd'], 4);
            $row['earning_type'] = $this->normalizePricingModel(
                (string) ($row['earning_type'] ?? 'ppc'),
            );

            return $row;
        }, $groups));

        usort($rows, function (array $a, array $b): int {
            return ($b['net_usd'] <=> $a['net_usd'])
                ?: ($b['click_count'] <=> $a['click_count']);
        });

        return $rows;
    }

    /**
     * @param  AttributionEvent|null  $event
     */
    private function jobGroupKey($event): string
    {
        if (! $event) {
            return 'unknown';
        }
        $listingId = (int) ($event->listing_id ?? $event->listing?->id ?? 0);
        if ($listingId > 0) {
            return 'listing:'.$listingId;
        }
        $meta = is_array($event->meta) ? $event->meta : [];
        $referenceId = strtolower(trim((string) ($meta['reference_id'] ?? $meta['job_key'] ?? '')));
        if ($referenceId !== '') {
            $raw = str_contains($referenceId, ':')
                ? substr($referenceId, (int) strrpos($referenceId, ':') + 1)
                : $referenceId;

            return 'ref:'.($raw !== '' ? $raw : $referenceId);
        }

        return 'title:'.strtolower($this->jobTitle($event));
    }

    /**
     * @param  AttributionEvent|null  $event
     */
    private function jobTitle($event): string
    {
        if (! $event) {
            return 'Job';
        }
        $meta = is_array($event->meta) ? $event->meta : [];
        $title = trim((string) ($event->listing?->title ?: ($meta['title'] ?? '')));

        return $title !== '' ? $title : 'Job';
    }

    /**
     * Prefer campaign/program model over click-ledger type (clicks often store ppc).
     *
     * @param  AttributionEvent|null  $event
     */
    private function resolvePricingModel($event): string
    {
        if (! $event) {
            return 'ppc';
        }

        $meta = is_array($event->meta) ? $event->meta : [];
        $listing = $event->listing;
        $programModel = strtolower(trim((string) (
            $listing?->program?->pricing_model
            ?? $meta['pricing_model']
            ?? ''
        )));
        if (in_array($programModel, ['ppc', 'ppr', 'ppa', 'ppe'], true)) {
            return $programModel;
        }

        $promo = strtolower(trim((string) (
            $listing?->program?->promotion_type
            ?? $meta['promotion_type']
            ?? ''
        )));
        if ($promo === 'post_promote') {
            return 'ppe';
        }

        if ($listing) {
            if ((float) ($listing->ppr_rate_usd ?? 0) > 0) {
                return 'ppr';
            }
            if ((float) ($listing->ppa_rate_usd ?? 0) > 0) {
                return 'ppa';
            }
            if ((float) ($listing->ppc_rate_usd ?? 0) > 0) {
                return 'ppc';
            }
        }

        $fromMeta = strtolower(trim((string) ($meta['earning_type'] ?? '')));
        if (in_array($fromMeta, ['ppc', 'ppr', 'ppa', 'ppe'], true)) {
            return $fromMeta;
        }

        return 'ppc';
    }

    private function preferPricingModel(string $current, string $candidate): string
    {
        $rank = ['ppr' => 0, 'ppa' => 1, 'ppe' => 2, 'ppc' => 3];
        $a = $this->normalizePricingModel($current);
        $b = $this->normalizePricingModel($candidate);
        if (($rank[$b] ?? 99) < ($rank[$a] ?? 99)) {
            return $b;
        }

        return $a;
    }

    private function normalizePricingModel(string $value): string
    {
        $model = strtolower(trim($value));

        return in_array($model, ['ppc', 'ppr', 'ppa', 'ppe'], true) ? $model : 'ppc';
    }

    /**
     * @param  AttributionEvent|null  $event
     * @return array<string, mixed>
     */
    private function emptyJobGroup(string $key, $event, string $title, string $earningType = 'ppc'): array
    {
        $listingId = (int) ($event?->listing_id ?? $event?->listing?->id ?? 0);

        return [
            'key' => $key,
            'listing_id' => $listingId > 0 ? $listingId : null,
            'title' => $title,
            'earning_type' => $this->normalizePricingModel($earningType),
            'click_count' => 0,
            'counted_count' => 0,
            'duplicate_count' => 0,
            'earning_count' => 0,
            'net_usd' => 0.0,
            'pending_usd' => 0.0,
            'approved_usd' => 0.0,
            'payable_usd' => 0.0,
            'paid_usd' => 0.0,
            'last_at' => $event?->created_at?->toIso8601String(),
        ];
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
