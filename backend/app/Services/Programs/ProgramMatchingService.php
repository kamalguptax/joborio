<?php

namespace App\Services\Programs;

use App\Models\Creator;
use App\Models\Program;
use App\Support\CreatorRelevance;
use Illuminate\Support\Collection;

class ProgramMatchingService
{
    /**
     * @return array{matched_count: int, avg_fit_score: float, sample_tiers: array<string, int>}
     */
    public function preview(Program $program): array
    {
        $creators = $this->matchedCreators($program);
        $scores = $creators->map(fn (Creator $c) => $this->fitScore($program, $c));

        $tierCounts = $creators->groupBy('trust_tier')->map->count()->all();

        return [
            'matched_count' => $creators->count(),
            'avg_fit_score' => $scores->isEmpty() ? 0 : round($scores->avg(), 1),
            'sample_tiers' => $tierCounts,
        ];
    }

    /**
     * @return Collection<int, Creator>
     */
    public function matchedCreators(Program $program): Collection
    {
        $query = Creator::query()->whereHas('user', fn ($q) => $q->where('is_active', true));

        $nicheIds = collect($program->target_niche_ids ?? [])->filter();
        if ($nicheIds->isNotEmpty()) {
            $query->whereHas('niches', fn ($q) => $q->whereIn('niches.id', $nicheIds));
        }

        $countries = collect($program->target_countries ?? [])->filter()->map(fn ($c) => strtoupper($c));
        if ($countries->isNotEmpty()) {
            $query->where(function ($q) use ($countries) {
                foreach ($countries as $code) {
                    $q->orWhereJsonContains('audience_countries', $code);
                }
            });
        }

        // min_trust_tier ignored — features are by account type (creator/employer).

        return $query->limit(500)->get();
    }

    public function creatorEligible(Program $program, Creator $creator): bool
    {
        if ($program->status !== 'active') {
            return false;
        }

        $creator->loadMissing('niches');
        if ($creator->niches->isEmpty() || ! $this->matchesCreatorFocus($program, $creator)) {
            return false;
        }

        $countries = collect($program->target_countries ?? [])->filter()->map(fn ($c) => strtoupper($c));
        if ($countries->isNotEmpty()) {
            $audience = collect($creator->audience_countries ?? [])->map(fn ($c) => strtoupper($c));
            if ($audience->intersect($countries)->isEmpty()) {
                return false;
            }
        }

        // min_trust_tier ignored — any creator can match active programs by niche/geo.

        return true;
    }

    private function matchesCreatorFocus(Program $program, Creator $creator): bool
    {
        $creatorIds = $creator->niches->pluck('id')->map(fn ($id) => (int) $id);
        $target = collect($program->target_niche_ids ?? [])->map(fn ($id) => (int) $id)->filter()->values();
        if ($target->isNotEmpty()) {
            return $creatorIds->intersect($target)->isNotEmpty();
        }

        $listing = $program->relationLoaded('listing') ? $program->listing : $program->listing()->first();
        $hay = implode(' ', array_filter([
            $program->title,
            $program->description,
            $listing?->title,
            $listing?->category,
            $listing?->description,
            $listing?->location_label,
        ]));

        return CreatorRelevance::textMatchesNames($hay, $creator->niches->pluck('name')->all());
    }

    public function fitScore(Program $program, Creator $creator): float
    {
        $score = 50.0;
        $nicheIds = collect($program->target_niche_ids ?? []);
        if ($nicheIds->isNotEmpty()) {
            $overlap = $creator->niches()->whereIn('niches.id', $nicheIds)->count();
            $score += min(30, $overlap * 15);
        }

        $countries = collect($program->target_countries ?? [])->map(fn ($c) => strtoupper($c));
        $audience = collect($creator->audience_countries ?? [])->map(fn ($c) => strtoupper($c));
        if ($countries->isNotEmpty() && $audience->intersect($countries)->isNotEmpty()) {
            $score += 20;
        }

        return min(100, $score);
    }

    /**
     * @return list<string>
     */
    private function tiersAtOrAbove(string $tier): array
    {
        $order = ['nano', 'micro', 'mid', 'macro'];
        $idx = array_search($tier, $order, true);

        return $idx === false ? $order : array_slice($order, $idx);
    }
}
