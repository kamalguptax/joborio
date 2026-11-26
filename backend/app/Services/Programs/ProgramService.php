<?php

namespace App\Services\Programs;

use App\Models\Employer;
use App\Models\Listing;
use App\Models\Program;
use App\Services\Ads\PlatformAdsSyncService;
use App\Support\CampaignTypes;
use App\Support\EmployerBilling;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ProgramService
{
    public function __construct(
        private ProgramMatchingService $matching,
        private PlatformAdsSyncService $ads,
    ) {}

    public function create(Employer $employer, array $data): Program
    {
        return DB::transaction(function () use ($employer, $data) {
            $promotionType = CampaignTypes::isValid($data['promotion_type'] ?? null)
                ? $data['promotion_type']
                : ($data['type'] ?? 'job');
            if (! CampaignTypes::isValid($promotionType)) {
                $promotionType = 'job';
            }

            $source = $data['source'] ?? 'program';

            $listing = Listing::create([
                'type' => $promotionType,
                'title' => $data['title'],
                'company_name' => $data['company_name'] ?? $employer->company_name,
                'description' => $data['description'] ?? null,
                'destination_url' => $data['destination_url'],
                'country_code' => $data['country_code'] ?? $employer->country_code,
                'is_remote' => (bool) ($data['is_remote'] ?? false),
                'category' => $data['category'] ?? $promotionType,
                'source' => $source,
                'status' => 'paused',
                'ppc_rate_usd' => ($data['pricing_model'] ?? 'ppc') === 'ppc' ? $data['rate_usd'] : null,
                'ppr_rate_usd' => ($data['pricing_model'] ?? '') === 'ppr' ? $data['rate_usd'] : null,
                'ppa_rate_usd' => in_array(($data['pricing_model'] ?? ''), ['ppa', 'ppe'], true)
                    ? $data['rate_usd']
                    : null,
            ]);

            $isDraft = (bool) ($data['as_draft'] ?? false);
            $isTrial = (bool) ($data['trial_without_ip'] ?? false) || $isDraft;
            $wantsLive = (bool) ($data['force_active'] ?? config('joborio.employer_programs.auto_activate', true));
            $billingOk = EmployerBilling::canGoLive($employer) || (bool) ($data['skip_billing_gate'] ?? false);
            $autoActive = ! $isDraft && $wantsLive && ($isTrial || $billingOk);
            $status = $isDraft
                ? 'draft'
                : ($autoActive ? 'active' : 'pending_review');
            $programPayload = [
                'employer_id' => $employer->id,
                'listing_id' => $listing->id,
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'pricing_model' => $data['pricing_model'],
                'rate_usd' => $data['rate_usd'],
                'budget_total_usd' => $isTrial ? max(0, (float) $data['budget_total_usd']) : $data['budget_total_usd'],
                'budget_spent_usd' => 0,
                'status' => $status,
                'target_niche_ids' => $data['target_niche_ids'] ?? [],
                'target_countries' => $data['target_countries'] ?? [],
                'min_trust_tier' => $data['min_trust_tier'] ?? null,
            ];
            if (Schema::hasColumn('programs', 'promotion_type')) {
                $programPayload['promotion_type'] = $promotionType;
            }
            if (Schema::hasColumn('programs', 'trial_without_ip')) {
                $programPayload['trial_without_ip'] = $isTrial;
            }
            if (Schema::hasColumn('programs', 'auto_ads_platforms')) {
                $platforms = array_values(array_intersect(
                    PlatformAdsSyncService::PLATFORMS,
                    array_map('strtolower', $data['auto_ads_platforms'] ?? []),
                ));
                $programPayload['auto_ads_platforms'] = $platforms;
            }
            if (Schema::hasColumn('programs', 'post_url') && ! empty($data['post_url'])) {
                $programPayload['post_url'] = $data['post_url'];
            }
            if (Schema::hasColumn('programs', 'engagement_actions')) {
                $actions = array_values(array_intersect(
                    CampaignTypes::ENGAGEMENT_ACTIONS,
                    array_map('strtolower', $data['engagement_actions'] ?? CampaignTypes::ENGAGEMENT_ACTIONS),
                ));
                if (($promotionType === 'post_promote' || ($data['pricing_model'] ?? '') === 'ppe') && $actions === []) {
                    $actions = CampaignTypes::ENGAGEMENT_ACTIONS;
                }
                $programPayload['engagement_actions'] = $actions;
            }
            if (Schema::hasColumn('programs', 'engage_brief') && isset($data['engage_brief'])) {
                $programPayload['engage_brief'] = $data['engage_brief'];
            }
            if (array_key_exists('starts_at', $data)) {
                $programPayload['starts_at'] = $data['starts_at'] ?: null;
            }
            if (array_key_exists('ends_at', $data)) {
                $programPayload['ends_at'] = $data['ends_at'] ?: null;
            }
            if (Schema::hasColumn('programs', 'lead_type') && array_key_exists('lead_type', $data)) {
                $programPayload['lead_type'] = $data['lead_type'] ?: null;
            }
            if (Schema::hasColumn('programs', 'required_fields') && array_key_exists('required_fields', $data)) {
                $programPayload['required_fields'] = array_values(array_intersect(
                    CampaignTypes::REQUIRED_FIELD_OPTIONS,
                    array_map('strtolower', $data['required_fields'] ?? []),
                ));
            }
            if (Schema::hasColumn('programs', 'qualification_rules') && array_key_exists('qualification_rules', $data)) {
                $programPayload['qualification_rules'] = $data['qualification_rules'] ?: null;
            }
            if (Schema::hasColumn('programs', 'auto_pause_on_budget') && array_key_exists('auto_pause_on_budget', $data)) {
                $programPayload['auto_pause_on_budget'] = (bool) $data['auto_pause_on_budget'];
            }
            if (Schema::hasColumn('programs', 'brand_category') && array_key_exists('brand_category', $data)) {
                $programPayload['brand_category'] = $data['brand_category'] ?: null;
            } elseif (Schema::hasColumn('programs', 'brand_category') && ! empty($data['category'])) {
                $programPayload['brand_category'] = $data['category'];
            }
            if (Schema::hasColumn('programs', 'conversion_model_code') && array_key_exists('conversion_model_code', $data)) {
                $programPayload['conversion_model_code'] = $data['conversion_model_code'] ?: null;
            }
            if (Schema::hasColumn('programs', 'currency') && array_key_exists('currency', $data)) {
                $programPayload['currency'] = strtoupper((string) ($data['currency'] ?: 'USD'));
            }
            if (Schema::hasColumn('programs', 'daily_budget_usd') && array_key_exists('daily_budget_usd', $data)) {
                $programPayload['daily_budget_usd'] = $data['daily_budget_usd'] !== null
                    ? (float) $data['daily_budget_usd']
                    : null;
            }
            if (Schema::hasColumn('programs', 'wizard_payload') && array_key_exists('wizard_payload', $data)) {
                $programPayload['wizard_payload'] = is_array($data['wizard_payload'])
                    ? $data['wizard_payload']
                    : null;
            }

            $program = Program::create($programPayload);

            $listing->update(['program_id' => $program->id]);

            $program = $program->fresh(['listing']);

            if ($autoActive) {
                return $this->activate($program);
            }

            return $program;
        });
    }

    public function update(Program $program, array $data): Program
    {
        return DB::transaction(function () use ($program, $data) {
            $program->loadMissing('listing');

            if (isset($data['promotion_type']) && CampaignTypes::isValid($data['promotion_type'])) {
                $promotionType = $data['promotion_type'];
            } else {
                $promotionType = $program->promotion_type ?: 'job';
            }

            $pricingModel = $data['pricing_model'] ?? $program->pricing_model;
            if (($promotionType === 'post_promote' || $pricingModel === 'ppe')) {
                $pricingModel = 'ppe';
                $promotionType = 'post_promote';
            }

            $rate = array_key_exists('rate_usd', $data)
                ? (float) $data['rate_usd']
                : (float) $program->rate_usd;
            $budget = array_key_exists('budget_total_usd', $data)
                ? (float) $data['budget_total_usd']
                : (float) $program->budget_total_usd;
            $isTrial = array_key_exists('trial_without_ip', $data)
                ? (bool) $data['trial_without_ip']
                : $program->isTrialWithoutIp();

            if (! $isTrial && $budget < max(10, (float) $program->budget_spent_usd)) {
                $budget = max(10, (float) $program->budget_spent_usd);
            }

            $payload = [
                'title' => $data['title'] ?? $program->title,
                'description' => array_key_exists('description', $data)
                    ? $data['description']
                    : $program->description,
                'pricing_model' => $pricingModel,
                'rate_usd' => $rate,
                'budget_total_usd' => $isTrial ? max(0, $budget) : $budget,
            ];

            if (Schema::hasColumn('programs', 'promotion_type')) {
                $payload['promotion_type'] = $promotionType;
            }
            if (Schema::hasColumn('programs', 'trial_without_ip') && array_key_exists('trial_without_ip', $data)) {
                $payload['trial_without_ip'] = $isTrial;
            }
            if (array_key_exists('target_niche_ids', $data)) {
                $payload['target_niche_ids'] = $data['target_niche_ids'] ?? [];
            }
            if (array_key_exists('target_countries', $data)) {
                $payload['target_countries'] = $data['target_countries'] ?? [];
            }
            if (array_key_exists('min_trust_tier', $data)) {
                $payload['min_trust_tier'] = $data['min_trust_tier'];
            }
            if (Schema::hasColumn('programs', 'post_url') && array_key_exists('post_url', $data)) {
                $payload['post_url'] = $data['post_url'];
            }
            if (Schema::hasColumn('programs', 'engage_brief') && array_key_exists('engage_brief', $data)) {
                $payload['engage_brief'] = $data['engage_brief'];
            }
            if (Schema::hasColumn('programs', 'engagement_actions') && array_key_exists('engagement_actions', $data)) {
                $actions = array_values(array_intersect(
                    CampaignTypes::ENGAGEMENT_ACTIONS,
                    array_map('strtolower', $data['engagement_actions'] ?? []),
                ));
                if (($promotionType === 'post_promote' || $pricingModel === 'ppe') && $actions === []) {
                    $actions = CampaignTypes::ENGAGEMENT_ACTIONS;
                }
                $payload['engagement_actions'] = $actions;
            }
            if (Schema::hasColumn('programs', 'auto_ads_platforms') && array_key_exists('auto_ads_platforms', $data)) {
                $payload['auto_ads_platforms'] = array_values(array_intersect(
                    PlatformAdsSyncService::PLATFORMS,
                    array_map('strtolower', $data['auto_ads_platforms'] ?? []),
                ));
            }
            if (array_key_exists('starts_at', $data)) {
                $payload['starts_at'] = $data['starts_at'] ?: null;
            }
            if (array_key_exists('ends_at', $data)) {
                $payload['ends_at'] = $data['ends_at'] ?: null;
            }
            if (Schema::hasColumn('programs', 'lead_type') && array_key_exists('lead_type', $data)) {
                $payload['lead_type'] = $data['lead_type'] ?: null;
            }
            if (Schema::hasColumn('programs', 'required_fields') && array_key_exists('required_fields', $data)) {
                $payload['required_fields'] = array_values(array_intersect(
                    CampaignTypes::REQUIRED_FIELD_OPTIONS,
                    array_map('strtolower', $data['required_fields'] ?? []),
                ));
            }
            if (Schema::hasColumn('programs', 'qualification_rules') && array_key_exists('qualification_rules', $data)) {
                $payload['qualification_rules'] = $data['qualification_rules'] ?: null;
            }
            if (Schema::hasColumn('programs', 'auto_pause_on_budget') && array_key_exists('auto_pause_on_budget', $data)) {
                $payload['auto_pause_on_budget'] = (bool) $data['auto_pause_on_budget'];
            }
            if (Schema::hasColumn('programs', 'brand_category') && array_key_exists('brand_category', $data)) {
                $payload['brand_category'] = $data['brand_category'] ?: null;
            } elseif (Schema::hasColumn('programs', 'brand_category') && array_key_exists('category', $data)) {
                $payload['brand_category'] = $data['category'] ?: null;
            }
            if (Schema::hasColumn('programs', 'conversion_model_code') && array_key_exists('conversion_model_code', $data)) {
                $payload['conversion_model_code'] = $data['conversion_model_code'] ?: null;
            }
            if (Schema::hasColumn('programs', 'currency') && array_key_exists('currency', $data)) {
                $payload['currency'] = strtoupper((string) ($data['currency'] ?: 'USD'));
            }
            if (Schema::hasColumn('programs', 'daily_budget_usd') && array_key_exists('daily_budget_usd', $data)) {
                $payload['daily_budget_usd'] = $data['daily_budget_usd'] !== null
                    ? (float) $data['daily_budget_usd']
                    : null;
            }
            if (Schema::hasColumn('programs', 'wizard_payload') && array_key_exists('wizard_payload', $data)) {
                $payload['wizard_payload'] = is_array($data['wizard_payload'])
                    ? $data['wizard_payload']
                    : null;
            }

            $program->update($payload);

            if ($program->listing) {
                $listingPayload = [
                    'title' => $payload['title'],
                    'description' => $payload['description'],
                    'ppc_rate_usd' => $pricingModel === 'ppc' ? $rate : null,
                    'ppr_rate_usd' => $pricingModel === 'ppr' ? $rate : null,
                    'ppa_rate_usd' => in_array($pricingModel, ['ppa', 'ppe'], true) ? $rate : null,
                ];
                if (isset($data['destination_url'])) {
                    $listingPayload['destination_url'] = $data['destination_url'];
                }
                if (array_key_exists('company_name', $data)) {
                    $listingPayload['company_name'] = $data['company_name'];
                }
                if (isset($data['country_code'])) {
                    $listingPayload['country_code'] = $data['country_code'];
                }
                if (array_key_exists('is_remote', $data)) {
                    $listingPayload['is_remote'] = (bool) $data['is_remote'];
                }
                if (isset($data['category']) || isset($data['promotion_type'])) {
                    $listingPayload['category'] = $data['category'] ?? $promotionType;
                    $listingPayload['type'] = $promotionType;
                }
                $program->listing->update($listingPayload);
            }

            return $program->fresh(['listing', 'employer']);
        });
    }

    public function activate(Program $program): Program
    {
        $program->update(['status' => 'active']);
        $program->listing?->update(['status' => 'active']);

        $fresh = $program->fresh(['listing']);
        $this->ads->queueForProgram($fresh);

        return $fresh;
    }

    public function pause(Program $program): Program
    {
        $program->update(['status' => 'paused']);
        $program->listing?->update(['status' => 'paused']);

        return $program->fresh();
    }

    /**
     * @return array<string, mixed>
     */
    public function stats(Program $program): array
    {
        $match = $this->matching->preview($program);
        $optedIn = $program->creators()->wherePivot('status', 'active')->count();

        $adSyncs = Schema::hasTable('program_ad_syncs')
            ? $program->adSyncs()->get(['platform', 'status', 'external_campaign_id', 'last_error', 'synced_at'])
            : [];

        return [
            'program' => $program->loadMissing('listing'),
            'budget_remaining_usd' => $program->budgetRemaining(),
            'match_preview' => $match,
            'creators_opted_in' => $optedIn,
            'ad_syncs' => $adSyncs,
            'ads_config' => [
                'meta_configured' => app(\App\Services\Ads\MetaAdsService::class)->isConfigured(),
                'linkedin_configured' => app(\App\Services\Ads\LinkedInAdsService::class)->isConfigured(),
            ],
        ];
    }
}
