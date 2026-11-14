<?php

namespace App\Services\Listings;

use App\Models\Listing;
use App\Models\Niche;
use App\Support\PromoteJobTypes;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class JobPreferenceMatchingService
{
    /**
     * @param  list<int>  $nicheIds
     * @param  list<string>  $countries
     */
    public function matchingQuery(array $nicheIds, array $countries, bool $remoteOnly = false): Builder
    {
        $query = Listing::active();

        $nicheIds = collect($nicheIds)->filter()->values();
        if ($nicheIds->isNotEmpty()) {
            $niches = Niche::whereIn('id', $nicheIds)->get(['id', 'code', 'name']);
            $query->where(function ($q) use ($niches) {
                foreach ($niches as $niche) {
                    $code = trim((string) ($niche->code ?? ''));
                    $name = trim((string) ($niche->name ?? ''));
                    if ($code !== '') {
                        $q->orWhere('category', 'like', '%'.$code.'%')
                            ->orWhere('title', 'like', '%'.$code.'%')
                            ->orWhere('description', 'like', '%'.$code.'%');
                    }
                    if ($name !== '') {
                        $q->orWhere('category', 'like', '%'.$name.'%')
                            ->orWhere('title', 'like', '%'.$name.'%')
                            ->orWhere('description', 'like', '%'.$name.'%');
                    }
                }
            });
        }

        $countries = collect($countries)->filter()->map(fn ($c) => strtoupper($c))->values();
        if ($countries->isNotEmpty()) {
            $query->where(function ($q) use ($countries) {
                $q->whereIn('country_code', $countries->all())
                    ->orWhereNull('country_code')
                    ->orWhere('country_code', '')
                    ->orWhere('is_remote', true);
            });
        }

        if ($remoteOnly) {
            $query->where('is_remote', true);
        }

        return $query;
    }

    /**
     * @param  list<int>  $nicheIds
     * @param  list<string>  $countries
     * @param  list<string>  $jobTypes
     * @return Collection<int, Listing>
     */
    public function preferredListings(
        array $nicheIds,
        array $countries,
        bool $remoteOnly = false,
        int $limit = 20,
        array $jobTypes = [],
    ): Collection {
        $jobTypes = PromoteJobTypes::clean($jobTypes);

        $jobs = $this->matchingQuery($nicheIds, $countries, $remoteOnly)
            ->orderByDesc('updated_at')
            ->limit($jobTypes === [] ? max($limit, 40) : 250)
            ->get();

        // Soft fallback: if niche+country returned nothing, retry without country.
        if ($jobs->isEmpty() && $countries !== [] && $nicheIds !== []) {
            $jobs = $this->matchingQuery($nicheIds, [], $remoteOnly)
                ->orderByDesc('updated_at')
                ->limit(250)
                ->get();
        }

        // Soft fallback: job types only when niches still empty.
        if ($jobs->isEmpty() && $jobTypes !== []) {
            $jobs = Listing::active()
                ->orderByDesc('updated_at')
                ->limit(250)
                ->get();
        }

        if ($jobTypes === []) {
            return $jobs->take($limit)->values();
        }

        return $jobs
            ->filter(function (Listing $job) use ($jobTypes): bool {
                $hay = implode(' ', array_filter([
                    $job->title,
                    $job->category,
                    $job->description,
                    $job->location_label,
                    $job->is_remote ? 'remote' : '',
                ]));

                return PromoteJobTypes::matches($hay, $jobTypes);
            })
            ->take($limit)
            ->values();
    }
}
