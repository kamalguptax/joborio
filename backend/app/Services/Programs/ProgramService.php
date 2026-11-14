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

            $isTrial = (bool) ($data['trial_without_ip'] ?? false);
            $wantsLive = (bool) ($data['force_active'] ?? config('joborio.employer_programs.auto_activate', true));
            $billingOk = EmployerBilling::canGoLive($employer) || (bool) ($data['skip_billing_gate'] ?? false);
            $autoActive = $wantsLive && ($isTrial || $billingOk);
            $programPayload = [
                'employer_id' => $employer->id,
                'listing_id' => $listing->id,
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'pricing_model' => $data['pricing_model'],
                'rate_usd' => $data['rate_usd'],
                'budget_total_usd' => $isTrial ? max(0, (float) $data['budget_total_usd']) : $data['budget_total_usd'],
                'budget_spent_usd' => 0,
                'status' => $autoActive ? 'active' : 'pending_review',
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

            $program = Program::create($programPayload);

            $listing->update(['program_id' => $program->id]);

            $program = $program->fresh(['listing']);

            if ($autoActive) {
                return $this->activate($program);
            }

            return $program;
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
            'program' => $program,
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
