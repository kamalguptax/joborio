<?php

namespace App\Services\Referrals;

use App\Models\Creator;
use App\Models\EarningLedger;
use App\Models\ReferralReward;
use App\Services\Platform\PlatformSettingsService;
use Illuminate\Support\Facades\DB;

class ReferralService
{
    public function __construct(private PlatformSettingsService $settings) {}

    public function attachReferrerOnSignup(Creator $creator, ?string $referralCode): void
    {
        $code = $referralCode !== null ? strtoupper(trim($referralCode)) : '';

        // Persist invite on the creator so onboarding still works if browser storage is lost.
        if ($code !== '' && \Illuminate\Support\Facades\Schema::hasColumn('creators', 'pending_referral_code')) {
            if (! $creator->referred_by_creator_id && $creator->pending_referral_code !== $code) {
                $creator->forceFill(['pending_referral_code' => $code])->save();
            }
        }

        if ($code === '') {
            if (\Illuminate\Support\Facades\Schema::hasColumn('creators', 'pending_referral_code')) {
                $code = strtoupper(trim((string) $creator->pending_referral_code));
            }
        }

        if ($code === '') {
            return;
        }

        // Already attributed — do not overwrite.
        $creator->refresh();
        if ($creator->referred_by_creator_id) {
            $this->clearPendingReferral($creator);

            return;
        }

        $referrer = Creator::query()
            ->whereRaw('UPPER(TRIM(referral_code)) = ?', [$code])
            ->first();

        if (! $referrer || $referrer->id === $creator->id) {
            return;
        }

        $months = $this->settings->referralTerms()['override_months'];

        $creator->update([
            'referred_by_creator_id' => $referrer->id,
            'referral_override_ends_at' => now()->addMonths($months),
        ]);

        $this->clearPendingReferral($creator);
    }

    private function clearPendingReferral(Creator $creator): void
    {
        if (! \Illuminate\Support\Facades\Schema::hasColumn('creators', 'pending_referral_code')) {
            return;
        }
        if ($creator->pending_referral_code) {
            $creator->forceFill(['pending_referral_code' => null])->save();
        }
    }

    public function processRecentlyApproved(): int
    {
        $since = now()->subHours(2);

        $ledgers = EarningLedger::query()
            ->where('state', 'approved')
            ->where('approved_at', '>=', $since)
            ->whereNotIn('earning_type', ['ref_bonus', 'ref_override'])
            ->with('creator')
            ->get();

        $count = 0;
        foreach ($ledgers as $ledger) {
            if ($this->onEarningApproved($ledger)) {
                $count++;
            }
        }

        return $count;
    }

    public function onEarningApproved(EarningLedger $ledger): bool
    {
        $referred = $ledger->creator;
        if (! $referred || ! $referred->referred_by_creator_id) {
            return false;
        }

        $referrer = Creator::find($referred->referred_by_creator_id);
        if (! $referrer) {
            return false;
        }

        $did = false;

        if ($this->maybePayFirstBonus($referrer, $referred)) {
            $did = true;
        }

        if ($this->maybePayOverride($referrer, $referred, $ledger)) {
            $did = true;
        }

        return $did;
    }

    private function maybePayFirstBonus(Creator $referrer, Creator $referred): bool
    {
        if ($referred->referral_first_bonus_paid_at) {
            return false;
        }

        if (ReferralReward::where('referred_creator_id', $referred->id)->where('kind', 'bonus')->exists()) {
            return false;
        }

        $threshold = $this->settings->referralTerms()['bonus_threshold_usd'];
        $payable = (float) EarningLedger::query()
            ->where('creator_id', $referred->id)
            ->whereIn('state', ['approved', 'payable', 'paid'])
            ->whereNotIn('earning_type', ['ref_bonus', 'ref_override'])
            ->sum('net_usd');

        if ($payable < $threshold) {
            return false;
        }

        $bonus = $this->settings->referralTerms()['bonus_usd'];

        return $this->createReward($referrer, $referred, 'bonus', $bonus, null) !== null;
    }

    private function maybePayOverride(
        Creator $referrer,
        Creator $referred,
        EarningLedger $source,
    ): bool {
        if ($referred->referral_override_ends_at && $referred->referral_override_ends_at->isPast()) {
            return false;
        }

        if (ReferralReward::where('source_earning_ledger_id', $source->id)->where('kind', 'override')->exists()) {
            return false;
        }

        // Override is a share of JobOrio's platform fee (not the referred creator's net).
        $percent = $this->settings->referralTerms()['override_percent'] / 100;
        $feeBase = (float) $source->platform_fee_usd;
        if ($feeBase <= 0) {
            return false;
        }
        $amount = round($feeBase * $percent, 4);
        if ($amount <= 0) {
            return false;
        }

        return $this->createReward($referrer, $referred, 'override', $amount, $source) !== null;
    }

    private function createReward(
        Creator $referrer,
        Creator $referred,
        string $kind,
        float $amountUsd,
        ?EarningLedger $source,
    ): ?ReferralReward {
        return DB::transaction(function () use ($referrer, $referred, $kind, $amountUsd, $source) {
            $earningType = $kind === 'bonus' ? 'ref_bonus' : 'ref_override';
            $holdDays = (int) config('joborio.referral.hold_days', 3);

            $ledger = EarningLedger::create([
                'creator_id' => $referrer->id,
                'attribution_event_id' => null,
                'earning_type' => $earningType,
                'gross_usd' => $amountUsd,
                'platform_fee_usd' => 0,
                'net_usd' => $amountUsd,
                'state' => 'pending',
                'hold_until' => now()->addDays($holdDays),
            ]);

            $reward = ReferralReward::create([
                'referrer_creator_id' => $referrer->id,
                'referred_creator_id' => $referred->id,
                'kind' => $kind,
                'source_earning_ledger_id' => $source?->id,
                'earning_ledger_id' => $ledger->id,
                'amount_usd' => $amountUsd,
            ]);

            if ($kind === 'bonus') {
                $referred->update(['referral_first_bonus_paid_at' => now()]);
            }

            return $reward;
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function dashboard(Creator $referrer): array
    {
        $referred = Creator::query()
            ->where('referred_by_creator_id', $referrer->id)
            ->orderByDesc('created_at')
            ->get();

        $threshold = $this->settings->referralTerms()['bonus_threshold_usd'];

        $referredRows = $referred->map(function (Creator $c) use ($threshold) {
            $earned = (float) EarningLedger::query()
                ->where('creator_id', $c->id)
                ->whereIn('state', ['approved', 'payable', 'paid'])
                ->whereNotIn('earning_type', ['ref_bonus', 'ref_override'])
                ->sum('net_usd');

            return [
                'id' => $c->id,
                'handle' => $c->handle,
                'joined_at' => $c->created_at,
                'approved_earnings_usd' => $earned,
                'is_active' => $earned >= $threshold,
                'bonus_paid' => (bool) $c->referral_first_bonus_paid_at,
            ];
        });

        $bonusTotal = (float) ReferralReward::query()
            ->where('referrer_creator_id', $referrer->id)
            ->where('kind', 'bonus')
            ->sum('amount_usd');

        $overrideTotal = (float) ReferralReward::query()
            ->where('referrer_creator_id', $referrer->id)
            ->where('kind', 'override')
            ->sum('amount_usd');

        $money = $this->settings->moneyMeta(
            \Illuminate\Support\Facades\Schema::hasColumn('creators', 'payout_currency')
                ? $referrer->payout_currency
                : null
        );

        return [
            'referral_code' => $referrer->referral_code,
            'referral_url' => $this->inviteBaseUrl().'/signup/?ref='.rawurlencode((string) $referrer->referral_code),
            'currency' => $money['code'],
            'currency_symbol' => $money['symbol'],
            'terms' => $this->settings->referralTerms(),
            'stats' => [
                'signups' => $referred->count(),
                'active_referrals' => $referredRows->where('is_active', true)->count(),
                'bonus_earned_usd' => $bonusTotal,
                'override_earned_usd' => $overrideTotal,
                'total_referral_usd' => $bonusTotal + $overrideTotal,
            ],
            'referred_creators' => $referredRows->values(),
        ];
    }

    private function inviteBaseUrl(): string
    {
        $configured = rtrim($this->settings->frontendUrl(), '/');
        $host = parse_url($configured, PHP_URL_HOST);
        if (! is_string($host) || in_array($host, ['localhost', '127.0.0.1'], true)) {
            return 'https://joborio.com';
        }

        return $configured;
    }
}
