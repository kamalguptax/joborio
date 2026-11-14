<?php

namespace App\Http\Controllers\Api\V1\Creator;

use App\Http\Controllers\Controller;
use App\Services\Creators\CreatorOnboardingService;
use App\Support\ApiResponse;
use App\Support\PromoteJobTypes;
use Illuminate\Validation\Rule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OnboardingController extends Controller
{
    use ApiResponse;

    public function __construct(private CreatorOnboardingService $onboarding) {}

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'handle' => ['required', 'string', 'min:3', 'max:30', 'regex:/^[a-z0-9_]+$/'],
            'bio' => ['nullable', 'string', 'max:500'],
            'social_links' => ['required', 'array'],
            'social_links.linkedin' => ['nullable', 'string', 'max:500'],
            'social_links.instagram' => ['nullable', 'string', 'max:500'],
            'social_links.community' => ['nullable', 'string', 'max:500'],
            'social_links.website' => ['nullable', 'string', 'max:500'],
            'niche_ids' => ['array'],
            'niche_ids.*' => ['integer', 'exists:niches,id'],
            'audience_countries' => ['array'],
            'audience_countries.*' => ['string', 'size:2'],
            'audience_size_estimate' => ['nullable', 'integer', 'min:0'],
            'referral_code' => ['nullable', 'string', 'max:32'],
            'promote_job_types' => ['array'],
            'promote_job_types.*' => ['string', Rule::in(PromoteJobTypes::IDS)],
        ]);

        $creator = $this->onboarding->register($request->user(), $data);

        return $this->success([
            'creator' => $creator,
            'public_url' => $creator->publicUrl(),
        ], 201);
    }

    public function update(Request $request): JsonResponse
    {
        $creator = $request->user()->creator;
        if (! $creator) {
            return $this->error('NOT_A_CREATOR', 'Complete creator registration first.', 404);
        }

        $data = $request->validate([
            'bio' => ['nullable', 'string', 'max:500'],
            'profile_photo_path' => ['nullable', 'string', 'max:500'],
            'accent_color' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'social_links' => ['required', 'array'],
            'social_links.linkedin' => ['nullable', 'string', 'max:500'],
            'social_links.instagram' => ['nullable', 'string', 'max:500'],
            'social_links.community' => ['nullable', 'string', 'max:500'],
            'social_links.website' => ['nullable', 'string', 'max:500'],
            'niche_ids' => ['array'],
            'niche_ids.*' => ['integer', 'exists:niches,id'],
            'audience_countries' => ['array'],
            'audience_countries.*' => ['string', 'size:2'],
            'audience_size_estimate' => ['nullable', 'integer', 'min:0'],
        ]);

        $creator = $this->onboarding->completeOnboarding($creator, $data);

        return $this->success([
            'creator' => $creator,
            'public_url' => $creator->publicUrl(),
            'link_live' => (bool) $creator->onboarding_completed_at,
        ]);
    }
}
