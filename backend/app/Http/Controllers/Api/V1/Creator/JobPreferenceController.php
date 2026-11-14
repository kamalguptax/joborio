<?php

namespace App\Http\Controllers\Api\V1\Creator;

use App\Http\Controllers\Controller;
use App\Services\Creators\CreatorOnboardingService;
use App\Services\Listings\JobPreferenceMatchingService;
use App\Support\ApiResponse;
use App\Support\OpportunityCategories;
use App\Support\PromoteJobTypes;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class JobPreferenceController extends Controller
{
    use ApiResponse;

    public function __construct(
        private CreatorOnboardingService $onboarding,
        private JobPreferenceMatchingService $matching,
    ) {}

    public function show(Request $request): JsonResponse
    {
        $creator = $request->user()->creator;
        if (! $creator) {
            return $this->error('NOT_A_CREATOR', 'Creator profile not found.', 404);
        }

        $creator->load('niches');
        $categories = $this->categories($creator);

        return $this->success([
            'niche_ids' => $creator->niches->pluck('id')->values()->all(),
            'countries' => $creator->audience_countries ?? [],
            'prefer_remote' => (bool) $creator->prefer_remote,
            'job_types' => $this->jobTypes($creator),
            'opportunity_categories' => $categories,
            'opportunity_targeting' => OpportunityCategories::cleanTargeting(
                $creator->opportunity_targeting ?? [],
            ),
            'opportunity_preferences' => OpportunityCategories::cleanPreferences(
                $creator->opportunity_preferences ?? [],
                $categories,
            ),
            'visible_preference_keys' => OpportunityCategories::visiblePreferenceKeys($categories),
            'options' => [
                'categories' => OpportunityCategories::IDS,
                'experience_levels' => OpportunityCategories::EXPERIENCE_LEVELS,
                'work_modes' => OpportunityCategories::WORK_MODES,
                'currencies' => OpportunityCategories::CURRENCIES,
                'preference_keys_by_category' => OpportunityCategories::PREFERENCE_KEYS_BY_CATEGORY,
            ],
            'niches' => $creator->niches,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $creator = $request->user()->creator;
        if (! $creator) {
            return $this->error('NOT_A_CREATOR', 'Creator profile not found.', 404);
        }

        $data = $request->validate([
            'niche_ids' => ['sometimes', 'array'],
            'niche_ids.*' => ['integer', 'exists:niches,id'],
            'countries' => ['sometimes', 'array'],
            'countries.*' => ['string', 'size:2'],
            'prefer_remote' => ['sometimes', 'boolean'],
            'job_types' => ['sometimes', 'array'],
            'job_types.*' => ['string', Rule::in(PromoteJobTypes::IDS)],
            'opportunity_categories' => ['sometimes', 'array'],
            'opportunity_categories.*' => ['string', Rule::in(OpportunityCategories::IDS)],
            'opportunity_targeting' => ['sometimes', 'array'],
            'opportunity_targeting.keywords' => ['sometimes', 'array'],
            'opportunity_targeting.keywords.*' => ['string', 'max:80'],
            'opportunity_targeting.industry' => ['sometimes', 'array'],
            'opportunity_targeting.industry.*' => ['string', 'max:80'],
            'opportunity_targeting.brands' => ['sometimes', 'array'],
            'opportunity_targeting.brands.*' => ['string', 'max:80'],
            'opportunity_targeting.audience_type' => ['sometimes', 'array'],
            'opportunity_targeting.audience_type.*' => ['string', Rule::in(OpportunityCategories::EXPERIENCE_LEVELS)],
            'opportunity_targeting.work_mode' => ['sometimes', 'array'],
            'opportunity_targeting.work_mode.*' => ['string', Rule::in(OpportunityCategories::WORK_MODES)],
            'opportunity_targeting.currency' => ['sometimes', 'string', Rule::in(OpportunityCategories::CURRENCIES)],
            'opportunity_preferences' => ['sometimes', 'array'],
            'opportunity_preferences.salary_min' => ['nullable', 'numeric', 'min:0'],
            'opportunity_preferences.salary_max' => ['nullable', 'numeric', 'min:0'],
            'opportunity_preferences.experience' => ['sometimes', 'array'],
            'opportunity_preferences.experience.*' => ['string', Rule::in(OpportunityCategories::EXPERIENCE_LEVELS)],
            'opportunity_preferences.duration' => ['nullable', 'string', 'max:80'],
            'opportunity_preferences.education' => ['sometimes', 'array'],
            'opportunity_preferences.education.*' => ['string', 'max:80'],
            'opportunity_preferences.skills' => ['sometimes', 'array'],
            'opportunity_preferences.skills.*' => ['string', 'max:80'],
        ]);

        $categories = array_key_exists('opportunity_categories', $data)
            ? OpportunityCategories::clean($data['opportunity_categories'])
            : $this->categories($creator);

        $niches = $data['niche_ids'] ?? null;
        $types = $data['job_types'] ?? null;
        $hasCategories = $categories !== [];
        if (
            (! is_array($niches) || $niches === [])
            && (! is_array($types) || $types === [])
            && ! $hasCategories
        ) {
            return $this->error(
                'PREFERENCES_REQUIRED',
                'Choose an opportunity category, niche, or job type.',
                422,
            );
        }

        $creator = $this->onboarding->updateJobPreferences($creator, $data);
        $categories = $this->categories($creator);

        return $this->success([
            'niche_ids' => $creator->niches->pluck('id')->values()->all(),
            'countries' => $creator->audience_countries ?? [],
            'prefer_remote' => (bool) $creator->prefer_remote,
            'job_types' => $this->jobTypes($creator),
            'opportunity_categories' => $categories,
            'opportunity_targeting' => OpportunityCategories::cleanTargeting(
                $creator->opportunity_targeting ?? [],
            ),
            'opportunity_preferences' => OpportunityCategories::cleanPreferences(
                $creator->opportunity_preferences ?? [],
                $categories,
            ),
            'visible_preference_keys' => OpportunityCategories::visiblePreferenceKeys($categories),
            'options' => [
                'categories' => OpportunityCategories::IDS,
                'experience_levels' => OpportunityCategories::EXPERIENCE_LEVELS,
                'work_modes' => OpportunityCategories::WORK_MODES,
                'currencies' => OpportunityCategories::CURRENCIES,
                'preference_keys_by_category' => OpportunityCategories::PREFERENCE_KEYS_BY_CATEGORY,
            ],
            'niches' => $creator->niches,
            'listings_synced' => $creator->listings()->count(),
        ]);
    }

    public function preferredJobs(Request $request): JsonResponse
    {
        $creator = $request->user()->creator;
        if (! $creator) {
            return $this->error('NOT_A_CREATOR', 'Creator profile not found.', 404);
        }

        $creator->load('niches');
        $nicheIds = $creator->niches->pluck('id')->all();
        $countries = $creator->audience_countries ?? [];

        $jobs = $this->matching->preferredListings(
            $nicheIds,
            $countries,
            (bool) $creator->prefer_remote,
            24,
            $this->jobTypes($creator),
        );

        return $this->success($jobs);
    }

    /**
     * @return list<string>
     */
    private function jobTypes(\App\Models\Creator $creator): array
    {
        if (! Schema::hasColumn('creators', 'promote_job_types')) {
            return [];
        }

        return PromoteJobTypes::clean($creator->promote_job_types ?? []);
    }

    /**
     * @return list<string>
     */
    private function categories(\App\Models\Creator $creator): array
    {
        if (! Schema::hasColumn('creators', 'opportunity_categories')) {
            return [];
        }

        return OpportunityCategories::clean($creator->opportunity_categories ?? []);
    }
}
