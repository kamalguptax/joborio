<?php

namespace App\Support;

/**
 * JobOrio publisher network revenue split.
 *
 * Campaign earnings → JobOrio platform fee (default 30%) → creator pool (70%).
 * Publisher takes 10–15% of the pool; creators receive the remainder of the pool.
 */
class PublisherCommissionSplit
{
    public const PLATFORM_FEE_PERCENT = 30.0;

    public const PUBLISHER_MIN_PERCENT = 10.0;

    public const PUBLISHER_MAX_PERCENT = 15.0;

    /** @return list<int> */
    public static function permittedPublisherPercents(): array
    {
        return range(
            (int) self::PUBLISHER_MIN_PERCENT,
            (int) self::PUBLISHER_MAX_PERCENT,
        );
    }

    public static function clampPublisherPercent(float $percent): float
    {
        return max(
            self::PUBLISHER_MIN_PERCENT,
            min(self::PUBLISHER_MAX_PERCENT, round($percent, 2)),
        );
    }

    /**
     * @return array{
     *   campaign_earnings_usd: float,
     *   platform_fee_percent: float,
     *   platform_fee_usd: float,
     *   creator_pool_usd: float,
     *   publisher_percent: float,
     *   publisher_usd: float,
     *   creators_percent_of_pool: float,
     *   creators_usd: float
     * }
     */
    public static function split(float $campaignEarningsUsd, float $publisherPercentOfPool): array
    {
        $gross = max(0, round($campaignEarningsUsd, 4));
        $publisherPct = self::clampPublisherPercent($publisherPercentOfPool);
        $platformPct = self::PLATFORM_FEE_PERCENT;

        $platformFee = round($gross * ($platformPct / 100), 4);
        $pool = round($gross - $platformFee, 4);
        $publisher = round($pool * ($publisherPct / 100), 4);
        $creators = round($pool - $publisher, 4);

        return [
            'campaign_earnings_usd' => $gross,
            'platform_fee_percent' => $platformPct,
            'platform_fee_usd' => $platformFee,
            'creator_pool_usd' => $pool,
            'publisher_percent' => $publisherPct,
            'publisher_usd' => $publisher,
            'creators_percent_of_pool' => round(100 - $publisherPct, 2),
            'creators_usd' => $creators,
        ];
    }
}
