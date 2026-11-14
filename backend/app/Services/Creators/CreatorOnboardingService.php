<?php

namespace App\Services\Creators;

use App\Models\Creator;
use App\Models\NetworkMember;
use App\Models\User;
use App\Services\Listings\JobPreferenceMatchingService;
use App\Support\CreatorSocialLinks;
use App\Support\OpportunityCategories;
use App\Support\PromoteJobTypes;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class CreatorOnboardingService
{
    public function assertNotActiveNetworkMember(User $user): void
    {
        // Block while membership is active OR removed-but-not-released.
        // Only formal "released" status unlocks independent Creator registration.
        $blocking = NetworkMember::query()
            ->where('user_id', $user->id)
            ->whereIn('status', ['active', 'removed'])
            ->exists();

        if ($blocking) {
            throw ValidationException::withMessages([
                'membership' => [
                    'Network members cannot create a public Creator profile until membership is formally released.',
                ],
            ]);
        }
    }

    public function ensureForUser(User $user): Creator
    {
        $existing = $user->creator;
        if ($existing) {
            return $existing;
        }

        // Never auto-create a public creator for publisher / network-member accounts.
        $this->assertNotActiveNetworkMember($user);

        if ($user->hasRole('publisher') || $user->hasRole('network_member')) {
            throw ValidationException::withMessages([
                'membership' => [
                    'This account cannot become a public Creator while publisher/network membership is active.',
                ],
            ]);
        }

        $base = Str::slug((string) Str::before((string) $user->email, '@'));
        if ($base === '') {
            $base = 'user';
        }
        $handle = $base;
        for ($n = 0; Creator::where('handle', $handle)->exists(); $n++) {
            $handle = $base.'-'.$user->id.($n > 0 ? '-'.$n : '');
        }

        $creator = Creator::create([
            'user_id' => $user->id,
            'handle' => $handle,
            'trust_tier' => 'nano',
            'referral_code' => $this->uniqueReferralCode(),
            'audience_countries' => [],
        ]);

        if (Role::query()->where('name', 'creator')->where('guard_name', 'web')->exists()
            && ! $user->hasRole('creator')) {
            $user->assignRole('creator');
        }

        return $creator;
    }

    public function register(User $user, array $data): Creator
    {
        $this->assertNotActiveNetworkMember($user);

        $handle = Str::lower($data['handle']);
        $existing = $user->creator;
        if ($existing && $existing->onboarding_completed_at) {
            throw ValidationException::withMessages(['email' => ['Already registered as creator.']]);
        }
        if (Creator::where('handle', $handle)->when($existing, fn ($q) => $q->where('id', '!=', $existing->id))->exists()) {
            throw ValidationException::withMessages(['handle' => ['Handle is already taken.']]);
        }

        $socialLinks = CreatorSocialLinks::requireAtLeastOne($data['social_links'] ?? null);

        if ($existing) {
            $payload = [
                'handle' => $handle,
                'bio' => $data['bio'] ?? $existing->bio,
                'social_links' => $socialLinks,
                'audience_countries' => $data['audience_countries'] ?? $existing->audience_countries,
                'audience_size_estimate' => $data['audience_size_estimate'] ?? $existing->audience_size_estimate,
                'onboarding_completed_at' => $existing->onboarding_completed_at ?? now(),
            ];
            if (Schema::hasColumn('creators', 'approval_status') && ! $existing->isApproved()) {
                $payload['approval_status'] = 'pending';
            }
            $existing->fill($payload)->save();

            if (! empty($data['niche_ids'])) {
                $existing->niches()->sync($data['niche_ids']);
            }

            $this->storePromoteTypes($existing, $data['promote_job_types'] ?? null);
            if (! $user->hasRole('creator')) {
                $user->assignRole('creator');
            }
            $this->syncMatchedListings($existing);

            // Draft creators are created at auth/register first — always re-apply invite here.
            $existing->refresh();
            app(\App\Services\Referrals\ReferralService::class)
                ->attachReferrerOnSignup(
                    $existing,
                    $data['referral_code'] ?? $existing->pending_referral_code ?? null,
                );

            return $existing->fresh(['niches']);
        }

        $create = [
            'user_id' => $user->id,
            'handle' => $handle,
            'bio' => $data['bio'] ?? null,
            'social_links' => $socialLinks,
            'audience_countries' => $data['audience_countries'] ?? [],
            'audience_size_estimate' => $data['audience_size_estimate'] ?? null,
            'trust_tier' => 'nano',
            'referral_code' => $this->uniqueReferralCode(),
            'referred_by_creator_id' => null,
            'onboarding_completed_at' => now(),
        ];
        if (Schema::hasColumn('creators', 'approval_status')) {
            $create['approval_status'] = 'pending';
        }

        $creator = Creator::create($create);

        app(\App\Services\Referrals\ReferralService::class)
            ->attachReferrerOnSignup(
                $creator,
                $data['referral_code'] ?? $creator->pending_referral_code ?? null,
            );

        if (! empty($data['niche_ids'])) {
            $creator->niches()->sync($data['niche_ids']);
        }

        $this->storePromoteTypes($creator, $data['promote_job_types'] ?? null);

        $user->assignRole('creator');

        $this->syncMatchedListings($creator);

        return $creator->fresh(['niches']);
    }

    private function uniqueReferralCode(): string
    {
        do {
            $code = Str::upper(Str::random(10));
        } while (Creator::where('referral_code', $code)->exists());

        return $code;
    }

    public function completeOnboarding(Creator $creator, array $data): Creator
    {
        $socialLinks = array_key_exists('social_links', $data)
            ? CreatorSocialLinks::requireAtLeastOne($data['social_links'])
            : CreatorSocialLinks::requireAtLeastOne($creator->social_links);

        $payload = [
            'bio' => $data['bio'] ?? $creator->bio,
            'profile_photo_path' => $data['profile_photo_path'] ?? $creator->profile_photo_path,
            'accent_color' => $data['accent_color'] ?? $creator->accent_color,
            'social_links' => $socialLinks,
            'audience_countries' => $data['audience_countries'] ?? $creator->audience_countries,
            'audience_size_estimate' => $data['audience_size_estimate'] ?? $creator->audience_size_estimate,
            'onboarding_completed_at' => now(),
        ];
        if (Schema::hasColumn('creators', 'approval_status') && ! $creator->isApproved()) {
            $payload['approval_status'] = 'pending';
        }

        $creator->fill($payload)->save();

        if (! empty($data['niche_ids'])) {
            $creator->niches()->sync($data['niche_ids']);
        }

        $this->storePromoteTypes($creator, $data['promote_job_types'] ?? null);

        $this->syncMatchedListings($creator);

        return $creator->fresh(['niches']);
    }

    public function updateJobPreferences(Creator $creator, array $data): Creator
    {
        if (array_key_exists('niche_ids', $data) && is_array($data['niche_ids'])) {
            $creator->niches()->sync($data['niche_ids']);
        }

        if (array_key_exists('countries', $data)) {
            $creator->audience_countries = $data['countries'];
        }

        if (array_key_exists('prefer_remote', $data)) {
            $creator->prefer_remote = (bool) $data['prefer_remote'];
        }

        if (array_key_exists('job_types', $data)) {
            $this->storePromoteTypes($creator, $data['job_types']);
        }

        $categories = OpportunityCategories::clean(
            $data['opportunity_categories']
                ?? ($creator->opportunity_categories ?? []),
        );

        if (array_key_exists('opportunity_categories', $data) && Schema::hasColumn('creators', 'opportunity_categories')) {
            $creator->opportunity_categories = $categories;
        }

        if (array_key_exists('opportunity_targeting', $data) && Schema::hasColumn('creators', 'opportunity_targeting')) {
            $targeting = OpportunityCategories::cleanTargeting(
                is_array($data['opportunity_targeting']) ? $data['opportunity_targeting'] : [],
            );
            $creator->opportunity_targeting = $targeting;

            // Keep legacy prefer_remote in sync with work mode.
            $modes = $targeting['work_mode'] ?? [];
            if (in_array('remote', $modes, true) || in_array('work_from_home', $modes, true)) {
                $creator->prefer_remote = true;
            }
        }

        if (array_key_exists('opportunity_preferences', $data) && Schema::hasColumn('creators', 'opportunity_preferences')) {
            $creator->opportunity_preferences = OpportunityCategories::cleanPreferences(
                is_array($data['opportunity_preferences']) ? $data['opportunity_preferences'] : [],
                $categories,
            );
        }

        $creator->save();

        $this->syncMatchedListings($creator);

        return $creator->fresh(['niches']);
    }

    public function syncMatchedListings(Creator $creator): void
    {
        $nicheIds = $creator->niches()->pluck('niches.id')->all();
        $countries = collect($creator->audience_countries ?? [])->filter()->all();
        $jobTypes = Schema::hasColumn('creators', 'promote_job_types')
            ? PromoteJobTypes::clean($creator->promote_job_types ?? [])
            : [];

        if ($nicheIds === [] && $jobTypes === []) {
            return;
        }

        $listingIds = app(JobPreferenceMatchingService::class)
            ->preferredListings($nicheIds, $countries, (bool) $creator->prefer_remote, 50, $jobTypes)
            ->pluck('id');

        $existing = $creator->listings()->get()->keyBy('id');
        $sync = [];
        foreach ($listingIds as $id) {
            $pivot = $existing->get($id)?->pivot;
            $sync[$id] = [
                'is_pinned' => (bool) ($pivot->is_pinned ?? false),
                'is_hidden' => (bool) ($pivot->is_hidden ?? false),
            ];
        }

        $creator->listings()->sync($sync);
    }

    private function storePromoteTypes(Creator $creator, mixed $types): void
    {
        if (! is_array($types) || ! Schema::hasColumn('creators', 'promote_job_types')) {
            return;
        }

        $creator->promote_job_types = PromoteJobTypes::clean($types);
        $creator->save();
    }
}
