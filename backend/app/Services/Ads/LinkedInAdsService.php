<?php

namespace App\Services\Ads;

use App\Models\Program;
use Illuminate\Support\Facades\Http;

class LinkedInAdsService
{
    public function isConfigured(): bool
    {
        return filled(config('services.linkedin_ads.access_token'))
            && filled(config('services.linkedin_ads.ad_account_id'));
    }

    public function missingConfigMessage(): string
    {
        return 'LinkedIn Ads is not configured. Set LINKEDIN_ADS_ACCESS_TOKEN and LINKEDIN_AD_ACCOUNT_ID on the API server.';
    }

    /**
     * @return array{campaign_id?:string,adset_id?:string,ad_id?:string,account_id?:string,payload?:array,response?:array}
     */
    public function createOrUpdateCampaign(Program $program): array
    {
        $token = (string) config('services.linkedin_ads.access_token');
        $accountId = (string) config('services.linkedin_ads.ad_account_id');
        $apiVersion = (string) config('services.linkedin_ads.api_version', '202411');

        $program->loadMissing('listing');
        $dailyBudget = max(10, (int) round(((float) $program->budget_total_usd) / 7));

        $payload = [
            'account' => 'urn:li:sponsoredAccount:'.$accountId,
            'name' => 'JobOrio · '.$program->title,
            'status' => 'PAUSED',
            'type' => 'SPONSORED_UPDATES',
            'costType' => 'CPC',
            'creativeSelection' => 'OPTIMIZED',
            'dailyBudget' => [
                'amount' => (string) $dailyBudget,
                'currencyCode' => 'USD',
            ],
            'unitCost' => [
                'amount' => (string) max(1, (float) $program->rate_usd),
                'currencyCode' => 'USD',
            ],
            'locale' => [
                'country' => 'US',
                'language' => 'en',
            ],
        ];

        $res = Http::withToken($token)
            ->withHeaders([
                'LinkedIn-Version' => $apiVersion,
                'X-Restli-Protocol-Version' => '2.0.0',
                'Content-Type' => 'application/json',
            ])
            ->timeout(30)
            ->post('https://api.linkedin.com/rest/adAccounts/'.$accountId.'/adCampaigns', $payload);

        if (! $res->successful()) {
            throw new \RuntimeException('LinkedIn campaign create failed: '.$res->body());
        }

        $campaignId = (string) ($res->header('x-restli-id') ?: ($res->json('id') ?? ''));

        return [
            'account_id' => $accountId,
            'campaign_id' => $campaignId !== '' ? $campaignId : null,
            'payload' => [
                'campaign' => $payload,
                'destination_url' => $program->listing?->destination_url,
            ],
            'response' => $res->json() ?? ['raw' => $res->body()],
        ];
    }
}
