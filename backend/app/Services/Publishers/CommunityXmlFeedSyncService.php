<?php

namespace App\Services\Publishers;

use App\Models\PublisherCommunity;
use App\Services\Syndication\JobrapidoFeedService;

class CommunityXmlFeedSyncService
{
    public function __construct(private JobrapidoFeedService $feeds) {}

    /**
     * Match live syndication jobs to one or more community niche labels.
     *
     * @param  list<string>  $categories
     * @return list<string> reference ids
     */
    public function refsForCategories(array $categories, ?int $limit = 500): array
    {
        $needles = $this->normalizeCategoryList($categories);
        if ($needles === []) {
            return [];
        }

        $jobs = $this->feeds->loadFeed()['jobs'] ?? [];
        $refs = [];
        foreach ($jobs as $job) {
            if (! is_array($job)) {
                continue;
            }
            $ref = trim((string) ($job['reference_id'] ?? ''));
            if ($ref === '') {
                continue;
            }
            if (! $this->jobMatchesCategories($job, $needles)) {
                continue;
            }
            $refs[$ref] = true;
            if ($limit !== null && count($refs) >= $limit) {
                break;
            }
        }

        return array_keys($refs);
    }

    /**
     * Refresh xml_job_refs for every community that has niches set.
     *
     * @return array{communities: int, updated: int, refs: int}
     */
    public function syncAllCommunities(): array
    {
        $communities = PublisherCommunity::query()
            ->whereNotNull('category')
            ->where('category', '!=', '')
            ->get();

        $updated = 0;
        $refs = 0;
        foreach ($communities as $community) {
            $before = is_array($community->xml_job_refs) ? $community->xml_job_refs : [];
            $next = $this->syncCommunity($community);
            if ($next !== $before) {
                $updated++;
            }
            $refs += count($next);
        }

        return [
            'communities' => $communities->count(),
            'updated' => $updated,
            'refs' => $refs,
        ];
    }

    /**
     * @return list<string>
     */
    public function syncCommunity(PublisherCommunity $community): array
    {
        $categories = $this->categoriesFromCommunity($community);
        if ($categories === []) {
            return is_array($community->xml_job_refs) ? array_values($community->xml_job_refs) : [];
        }

        $refs = $this->refsForCategories($categories);
        $community->xml_job_refs = $refs !== [] ? $refs : null;
        $community->save();

        return $refs;
    }

    /**
     * @param  list<string>|null  $categories
     * @param  list<string>|null  $existingRefs
     * @return list<string>
     */
    public function resolveRefsForCreate(?array $categories, ?array $existingRefs = null): array
    {
        $fromCategories = $this->refsForCategories($categories ?? []);
        $manual = array_values(array_unique(array_filter(array_map(
            static fn ($r) => trim((string) $r),
            is_array($existingRefs) ? $existingRefs : [],
        ))));

        if ($fromCategories === []) {
            return $manual;
        }

        // Category match is the live source of truth; keep any extra manual picks too.
        return array_values(array_unique([...$fromCategories, ...$manual]));
    }

    /**
     * @param  array<string, mixed>  $job
     * @param  list<string>  $needles  already lowercased
     */
    public function jobMatchesCategories(array $job, array $needles): bool
    {
        if ($needles === []) {
            return true;
        }

        $hay = strtolower(trim(implode(' ', [
            (string) ($job['category'] ?? ''),
            (string) ($job['title'] ?? ''),
            (string) ($job['jobtype'] ?? ''),
            (string) ($job['description_text'] ?? ''),
        ])));

        if ($hay === '') {
            return false;
        }

        foreach ($needles as $needle) {
            if ($needle === '') {
                continue;
            }
            if (str_contains($hay, $needle) || str_contains($needle, $hay)) {
                return true;
            }
            // Token overlap for multi-word niches vs short feed categories.
            $tokens = preg_split('/[\s\/,&-]+/', $needle) ?: [];
            foreach ($tokens as $token) {
                $token = trim($token);
                if (strlen($token) >= 3 && str_contains($hay, $token)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * @return list<string>
     */
    public function categoriesFromCommunity(PublisherCommunity $community): array
    {
        return $this->normalizeCategoryList(
            preg_split('/\s*,\s*/', (string) ($community->category ?? '')) ?: [],
        );
    }

    /**
     * @param  list<string>|array<int, mixed>  $categories
     * @return list<string> lowercased unique labels
     */
    public function normalizeCategoryList(array $categories): array
    {
        $out = [];
        foreach ($categories as $item) {
            $label = strtolower(trim((string) $item));
            if ($label === '' || $label === 'uncategorized') {
                continue;
            }
            $out[$label] = $label;
        }

        return array_values($out);
    }
}
