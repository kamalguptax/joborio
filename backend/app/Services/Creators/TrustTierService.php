<?php

namespace App\Services\Creators;

use App\Models\AttributionEvent;
use App\Models\Creator;
use App\Services\Platform\PlatformSettingsService;
use Illuminate\Support\Carbon;

/**
 * Trust-tier values may still be stored for ops, but product gates are open
 * for any creator account. Features are by user type (creator vs employer),
 * not nano/micro/mid progression.
 */
class TrustTierService
{
    public function __construct(private PlatformSettingsService $settings) {}

    public function canEarnPpr(Creator $creator): bool
    {
        return true;
    }

    public function canEarnPpa(Creator $creator): bool
    {
        return true;
    }

    public function isAutoPayoutEligible(Creator $creator): bool
    {
        return filled($creator->payout_method);
    }

    public function requiresManualPayoutReview(Creator $creator): bool
    {
        return ! $this->isAutoPayoutEligible($creator);
    }

    public function holdDaysFor(Creator $creator, string $earningType): int
    {
        $payout = $this->settings->payoutStructure();

        if ($earningType === 'ppr') {
            return $payout['ppr_hold_days'];
        }

        if ($earningType === 'ppa') {
            return $payout['ppa_hold_days'];
        }

        return $payout['ppc_hold_days_higher'] ?? $payout['ppc_hold_days'];
    }

    /**
     * @return array{
     *   verified_clicks: int,
     *   active_days: int,
     *   invalid_rate: float,
     *   next_tier: string|null,
     *   progress: array<string, mixed>
     * }
     */
    public function metrics(Creator $creator): array
    {
        $verifiedClicks = $this->verifiedClickCount($creator);
        $activeDays = $this->activeDays($creator);
        $invalidRate = $this->invalidEventRate($creator);

        return [
            'verified_clicks' => $verifiedClicks,
            'active_days' => $activeDays,
            'invalid_rate' => round($invalidRate, 4),
            'next_tier' => null,
            'auto_payout_eligible' => $this->isAutoPayoutEligible($creator),
            'ppr_unlocked' => true,
            'ppa_unlocked' => true,
            'account_type' => 'creator',
            'progress' => [],
        ];
    }

    public function evaluateAndPromote(Creator $creator): ?string
    {
        // Promotion ladder disabled — features are by account type.
        return null;
    }

    public function evaluateAllCreators(): int
    {
        return 0;
    }

    private function verifiedClickCount(Creator $creator): int
    {
        return (int) AttributionEvent::query()
            ->where('creator_id', $creator->id)
            ->verifiedClicks()
            ->count();
    }

    private function activeDays(Creator $creator): int
    {
        $start = $creator->onboarding_completed_at ?? $creator->created_at;

        return (int) Carbon::parse($start)->startOfDay()->diffInDays(now()->startOfDay());
    }

    private function invalidEventRate(Creator $creator): float
    {
        $counted = (int) AttributionEvent::query()
            ->where('creator_id', $creator->id)
            ->where('is_counted', true)
            ->count();

        $invalid = (int) AttributionEvent::query()
            ->where('creator_id', $creator->id)
            ->where('is_counted', false)
            ->whereNotIn('fraud_status', ['clean', 'dedup'])
            ->count();

        $total = $counted + $invalid;

        return $total > 0 ? $invalid / $total : 0.0;
    }
}
