<?php

namespace App\Services\Publishers;

use App\Models\Publisher;
use App\Models\PublisherLedgerEntry;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class PublisherLedgerService
{
    /**
     * Append an immutable ledger entry. Corrections must use entry_type=reversal
     * with reverses_ledger_id set — never overwrite historical rows.
     *
     * @param  array{
     *   entry_type: string,
     *   net_usd: float|string,
     *   gross_usd?: float|string,
     *   platform_fee_usd?: float|string,
     *   source?: string,
     *   state?: string,
     *   community_id?: int|null,
     *   campaign_assignment_id?: int|null,
     *   reference?: string|null,
     *   idempotency_key?: string|null,
     *   reverses_ledger_id?: int|null,
     *   meta?: array<string, mixed>|null,
     *   occurred_at?: \DateTimeInterface|string|null,
     * }  $payload
     */
    public function post(Publisher $publisher, array $payload): PublisherLedgerEntry
    {
        $type = (string) ($payload['entry_type'] ?? '');
        if (! in_array($type, ['credit', 'debit', 'reversal', 'adjustment'], true)) {
            throw new InvalidArgumentException('Invalid ledger entry_type.');
        }

        if ($type === 'reversal' && empty($payload['reverses_ledger_id'])) {
            throw new InvalidArgumentException('Reversals must reference reverses_ledger_id.');
        }

        $key = $payload['idempotency_key'] ?? null;
        if ($key) {
            $existing = PublisherLedgerEntry::query()
                ->where('publisher_id', $publisher->id)
                ->where('idempotency_key', $key)
                ->first();
            if ($existing) {
                return $existing;
            }
        }

        $gross = (float) ($payload['gross_usd'] ?? $payload['net_usd'] ?? 0);
        $fee = (float) ($payload['platform_fee_usd'] ?? 0);
        $net = (float) ($payload['net_usd'] ?? ($gross - $fee));
        $state = (string) ($payload['state'] ?? 'pending');

        return DB::transaction(function () use ($publisher, $payload, $type, $gross, $fee, $net, $state, $key) {
            return PublisherLedgerEntry::create([
                'publisher_id' => $publisher->id,
                'community_id' => $payload['community_id'] ?? null,
                'campaign_assignment_id' => $payload['campaign_assignment_id'] ?? null,
                'entry_type' => $type,
                'source' => $payload['source'] ?? 'partner_confirmed',
                'state' => $state,
                'gross_usd' => $gross,
                'platform_fee_usd' => $fee,
                'net_usd' => $net,
                'currency' => 'USD',
                'reference' => $payload['reference'] ?? null,
                'idempotency_key' => $key,
                'reverses_ledger_id' => $payload['reverses_ledger_id'] ?? null,
                'meta' => $payload['meta'] ?? null,
                'occurred_at' => $payload['occurred_at'] ?? now(),
                'approved_at' => in_array($state, ['approved', 'payable', 'paid'], true) ? now() : null,
                'paid_at' => $state === 'paid' ? now() : null,
            ]);
        });
    }

    /**
     * @return array{
     *   pending_usd: float,
     *   approved_usd: float,
     *   payable_usd: float,
     *   paid_usd: float,
     *   reversed_usd: float,
     *   lifetime_net_usd: float,
     *   entry_count: int
     * }
     */
    public function balances(Publisher $publisher): array
    {
        $rows = PublisherLedgerEntry::query()
            ->where('publisher_id', $publisher->id)
            ->selectRaw('state, entry_type, COALESCE(SUM(net_usd), 0) as total, COUNT(*) as cnt')
            ->groupBy('state', 'entry_type')
            ->get();

        $pending = 0.0;
        $approved = 0.0;
        $payable = 0.0;
        $paid = 0.0;
        $reversed = 0.0;
        $lifetime = 0.0;
        $count = 0;

        foreach ($rows as $row) {
            $amount = (float) $row->total;
            $count += (int) $row->cnt;
            $signed = in_array($row->entry_type, ['debit', 'reversal'], true) ? -abs($amount) : $amount;

            if ($row->state === 'reversed' || $row->entry_type === 'reversal') {
                $reversed += abs($amount);
            }

            match ($row->state) {
                'pending' => $pending += $signed,
                'approved' => $approved += $signed,
                'payable' => $payable += $signed,
                'paid' => $paid += $signed,
                default => null,
            };

            if ($row->state !== 'reversed') {
                $lifetime += $signed;
            }
        }

        return [
            'pending_usd' => round($pending, 4),
            'approved_usd' => round($approved, 4),
            'payable_usd' => round($payable, 4),
            'paid_usd' => round($paid, 4),
            'reversed_usd' => round($reversed, 4),
            'lifetime_net_usd' => round($lifetime, 4),
            'entry_count' => $count,
        ];
    }
}
