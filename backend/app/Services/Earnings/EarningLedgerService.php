<?php

namespace App\Services\Earnings;

use App\Models\AttributionEvent;
use App\Models\Creator;
use App\Models\EarningLedger;
use App\Models\Listing;
use App\Services\Platform\PlatformSettingsService;

class EarningLedgerService
{
    public function __construct(
        private \App\Services\Creators\TrustTierService $trustTiers,
        private PlatformSettingsService $settings,
    ) {}

    public function createPpcEarning(Creator $creator, AttributionEvent $event, Listing $listing): EarningLedger
    {
        $gross = (float) ($listing->ppc_rate_usd ?? $this->settings->payoutStructure()['ppc_rate_usd']);
        [$platformFee, $net] = $this->splitFee($gross);
        $holdDays = $this->trustTiers->holdDaysFor($creator, 'ppc');

        return EarningLedger::create([
            'creator_id' => $creator->id,
            'attribution_event_id' => $event->id,
            'earning_type' => 'ppc',
            'gross_usd' => $gross,
            'platform_fee_usd' => $platformFee,
            'net_usd' => $net,
            'state' => 'pending',
            'hold_until' => now()->addDays($holdDays),
        ]);
    }

    public function createPprEarning(Creator $creator, AttributionEvent $event, Listing $listing): EarningLedger
    {
        $gross = (float) ($listing->ppr_rate_usd ?? $this->settings->payoutStructure()['ppr_rate_usd']);
        [$platformFee, $net] = $this->splitFee($gross);
        $holdDays = $this->trustTiers->holdDaysFor($creator, 'ppr');

        return EarningLedger::create([
            'creator_id' => $creator->id,
            'attribution_event_id' => $event->id,
            'earning_type' => 'ppr',
            'gross_usd' => $gross,
            'platform_fee_usd' => $platformFee,
            'net_usd' => $net,
            'state' => 'pending',
            'hold_until' => now()->addDays($holdDays),
        ]);
    }

    public function createSyndicatedApplyEarning(Creator $creator, AttributionEvent $event): EarningLedger
    {
        $gross = $this->settings->payoutStructure()['ppc_rate_usd'];
        [$platformFee, $net] = $this->splitFee($gross);
        $holdDays = $this->trustTiers->holdDaysFor($creator, 'ppc');

        return EarningLedger::create([
            'creator_id' => $creator->id,
            'attribution_event_id' => $event->id,
            'earning_type' => 'ppc',
            'gross_usd' => $gross,
            'platform_fee_usd' => $platformFee,
            'net_usd' => $net,
            'state' => 'pending',
            'hold_until' => now()->addDays($holdDays),
        ]);
    }

    public function createPpaEarning(Creator $creator, AttributionEvent $event, Listing $listing): EarningLedger
    {
        $gross = (float) ($listing->ppa_rate_usd ?? $this->settings->payoutStructure()['ppa_rate_usd']);
        [$platformFee, $net] = $this->splitFee($gross);
        $holdDays = $this->trustTiers->holdDaysFor($creator, 'ppa');

        return EarningLedger::create([
            'creator_id' => $creator->id,
            'attribution_event_id' => $event->id,
            'earning_type' => 'ppa',
            'gross_usd' => $gross,
            'platform_fee_usd' => $platformFee,
            'net_usd' => $net,
            'state' => 'pending',
            'hold_until' => now()->addDays($holdDays),
        ]);
    }

    /** Pay-per-engagement for post promote (like / comment / repost). */
    public function createPpeEarning(Creator $creator, float $grossUsd): EarningLedger
    {
        $gross = max(0, $grossUsd);
        [$platformFee, $net] = $this->splitFee($gross);
        $holdDays = $this->trustTiers->holdDaysFor($creator, 'ppa');

        return EarningLedger::create([
            'creator_id' => $creator->id,
            'attribution_event_id' => null,
            'earning_type' => 'ppe',
            'gross_usd' => $gross,
            'platform_fee_usd' => $platformFee,
            'net_usd' => $net,
            'state' => 'pending',
            'hold_until' => now()->addDays($holdDays),
        ]);
    }

    public function approveDuePending(): int
    {
        return EarningLedger::query()
            ->where('state', 'pending')
            ->where('hold_until', '<=', now())
            ->update([
                'state' => 'approved',
                'approved_at' => now(),
            ]);
    }

    public function markPayableForCreator(Creator $creator): float
    {
        $sum = (float) EarningLedger::query()
            ->where('creator_id', $creator->id)
            ->where('state', 'approved')
            ->sum('net_usd');

        $min = $this->settings->payoutStructure()['min_payout_usd'];
        if ($sum < $min) {
            return 0;
        }

        EarningLedger::query()
            ->where('creator_id', $creator->id)
            ->where('state', 'approved')
            ->update(['state' => 'payable']);

        return $sum;
    }

    /**
     * @return array{0: float, 1: float}
     */
    private function splitFee(float $gross): array
    {
        $fee = round($gross * ($this->settings->payoutStructure()['platform_fee_percent'] / 100), 4);

        return [$fee, round($gross - $fee, 4)];
    }
}
