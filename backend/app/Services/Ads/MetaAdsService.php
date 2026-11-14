<?php

namespace App\Services\Ads;

use App\Models\Program;
use Illuminate\Support\Facades\Http;

class MetaAdsService
{
    public function isConfigured(): bool
    {
        return filled(config('services.meta_ads.access_token'))
            && filled(config('services.meta_ads.ad_account_id'));
    }

    public function missingConfigMessage(): string
    {
        return 'Meta Ads is not configured. Set META_ADS_ACCESS_TOKEN and META_AD_ACCOUNT_ID on the API server.';
    }

    /**
     * @return array{campaign_id?:string,adset_id?:string,ad_id?:string,account_id?:string,payload?:array,response?:array}
     */
    public function createOrUpdateCampaign(Program $program): array
    {
        $token = (string) config('services.meta_ads.access_token');
        $account = ltrim((string) config('services.meta_ads.ad_account_id'), 'act_');
        $version = (string) config('services.meta_ads.api_version', 'v21.0');
        $base = "https://graph.facebook.com/{$version}";

        $program->loadMissing('listing');
        $dailyBudgetCents = max(100, (int) round(((float) $program->budget_total_usd) * 100 / 7));

        $payload = [
            'name' => 'JobOrio · '.$program->title,
            'objective' => 'OUTCOME_TRAFFIC',
            'status' => 'PAUSED', // start paused so spend is controlled after review
            'special_ad_categories' => ['NONE'],
            'access_token' => $token,
        ];

        $campaignRes = Http::asForm()
            ->timeout(30)
            ->post("{$base}/act_{$account}/campaigns", $payload);

        if (! $campaignRes->successful()) {
            throw new \RuntimeException('Meta campaign create failed: '.$campaignRes->body());
        }

        $campaignId = (string) ($campaignRes->json('id') ?? '');
        if ($campaignId === '') {
            throw new \RuntimeException('Meta campaign create returned no id.');
        }

        $countries = $program->target_countries ?: ['IN'];
        $adsetPayload = [
            'name' => 'JobOrio Ad Set · '.$program->title,
            'campaign_id' => $campaignId,
            'daily_budget' => $dailyBudgetCents,
            'billing_event' => 'IMPRESSIONS',
            'optimization_goal' => 'LINK_CLICKS',
            'bid_strategy' => 'LOWEST_COST_WITHOUT_CAP',
            'status' => 'PAUSED',
            'targeting' => json_encode([
                'geo_locations' => [
                    'countries' => array_values($countries),
                ],
            ]),
            'access_token' => $token,
        ];

        $adsetRes = Http::asForm()
            ->timeout(30)
            ->post("{$base}/act_{$account}/adsets", $adsetPayload);

        $adsetId = $adsetRes->successful() ? (string) ($adsetRes->json('id') ?? '') : null;

        return [
            'account_id' => 'act_'.$account,
            'campaign_id' => $campaignId,
            'adset_id' => $adsetId,
            'payload' => [
                'campaign' => array_diff_key($payload, ['access_token' => true]),
                'adset' => array_diff_key($adsetPayload, ['access_token' => true]),
                'destination_url' => $program->listing?->destination_url,
            ],
            'response' => [
                'campaign' => $campaignRes->json(),
                'adset' => $adsetRes->json(),
            ],
        ];
    }
}
