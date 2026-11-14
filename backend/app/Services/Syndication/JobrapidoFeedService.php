<?php

namespace App\Services\Syndication;

use App\Models\SyndicationFeed;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use SimpleXMLElement;
use Throwable;

class JobrapidoFeedService
{
    private const MERGED_CACHE_KEY = 'syndication:merged:v2';

    /**
     * @return array{jobs: list<array<string, mixed>>, source: array<string, mixed>}
     */
    public function loadFeed(): array
    {
        $this->ensureDefaultFeedFromConfig();

        $ttl = (int) config('joborio.jobrapido_feed_cache_seconds', 900);

        return $this->cache()->remember(self::MERGED_CACHE_KEY, $ttl, function () {
            return $this->buildMergedFeed();
        });
    }

    public function clearCache(): void
    {
        $this->cache()->forget(self::MERGED_CACHE_KEY);
        SyndicationFeed::query()->pluck('id')->each(function (int $id) {
            $this->cache()->forget($this->feedCacheKey($id));
        });
    }

    public function clearFeedCache(SyndicationFeed $feed): void
    {
        $this->cache()->forget($this->feedCacheKey($feed->id));
        $this->cache()->forget(self::MERGED_CACHE_KEY);
    }

    /**
     * @return array{jobs: list<array<string, mixed>>, source: array<string, mixed>}
     */
    public function refreshFeed(SyndicationFeed $feed): array
    {
        $this->clearFeedCache($feed);
        $payload = $this->loadSingleFeed($feed, true);
        $this->cache()->put($this->feedCacheKey($feed->id), $payload, (int) config('joborio.jobrapido_feed_cache_seconds', 900));
        $this->cache()->forget(self::MERGED_CACHE_KEY);

        return $payload;
    }

    /**
     * @return array<string, mixed>
     */
    public function probeFeed(SyndicationFeed $feed): array
    {
        $payload = $this->fetchAndParseForFeed($feed);

        return [
            'job_count' => count($payload['jobs']),
            'source' => $payload['source'],
            'sample_jobs' => array_slice($payload['jobs'], 0, 3),
        ];
    }

    private function cache(): Repository
    {
        $store = (string) config('joborio.jobrapido_feed_cache_store', 'file');

        return Cache::store($store);
    }

    private function feedCacheKey(int $feedId): string
    {
        return 'syndication:feed:'.$feedId.':v1';
    }

    private function ensureDefaultFeedFromConfig(): void
    {
        if (SyndicationFeed::query()->exists()) {
            return;
        }

        $url = (string) config('joborio.jobrapido_feed_url');
        if ($url === '') {
            return;
        }

        SyndicationFeed::create([
            'name' => 'Default Jobrapido feed',
            'slug' => 'default',
            'feed_url' => $url,
            'format' => 'jobrapido',
            'job_xpath' => '//job',
            'country_code' => 'IN',
            'is_active' => true,
            'use_sample_when_empty' => (bool) config('joborio.jobrapido_feed_use_sample_when_empty', true),
            'sample_path' => is_readable((string) config('joborio.jobrapido_feed_sample_path'))
                ? (string) config('joborio.jobrapido_feed_sample_path')
                : null,
            'sort_order' => 0,
        ]);
    }

    /**
     * @return array{jobs: list<array<string, mixed>>, source: array<string, mixed>}
     */
    private function buildMergedFeed(): array
    {
        $feeds = SyndicationFeed::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $allJobs = [];
        $feedMeta = [];

        foreach ($feeds as $feed) {
            $payload = $this->loadSingleFeed($feed, false);
            $feedMeta[] = array_merge($payload['source'], [
                'feed_id' => $feed->id,
                'feed_name' => $feed->name,
                'feed_slug' => $feed->slug,
                'job_count' => count($payload['jobs']),
            ]);
            foreach ($payload['jobs'] as $job) {
                $allJobs[] = $job;
            }
        }

        return [
            'jobs' => $allJobs,
            'source' => [
                'feeds' => $feedMeta,
                'feed_count' => count($feedMeta),
                'total_jobs' => count($allJobs),
                'storage' => 'live_feed_cache_only',
            ],
        ];
    }

    /**
     * @return array{jobs: list<array<string, mixed>>, source: array<string, mixed>}
     */
    private function loadSingleFeed(SyndicationFeed $feed, bool $forceFresh): array
    {
        $ttl = (int) config('joborio.jobrapido_feed_cache_seconds', 900);
        $key = $this->feedCacheKey($feed->id);

        if ($forceFresh) {
            return $this->fetchAndParseForFeed($feed);
        }

        return $this->cache()->remember($key, $ttl, function () use ($feed) {
            return $this->fetchAndParseForFeed($feed);
        });
    }

    /**
     * @return array{jobs: list<array<string, mixed>>, source: array<string, mixed>}
     */
    private function fetchAndParseForFeed(SyndicationFeed $feed): array
    {
        $url = $feed->feed_url;
        $error = null;
        $source = [
            'url' => $url,
            'publisher' => null,
            'lastbuilddate' => null,
        ];

        try {
            $response = Http::timeout(60)->retry(2, 500)->get($url);
        } catch (Throwable $e) {
            $error = 'FETCH_FAILED';
            $payload = $this->mergeSampleIfNeeded($feed, [
                'jobs' => [],
                'source' => array_merge($source, ['error' => $error]),
            ]);
            $this->persistFeedStats($feed, $payload, $error);

            return $payload;
        }

        if (! $response->successful()) {
            $error = 'HTTP_'.$response->status();
            $payload = $this->mergeSampleIfNeeded($feed, [
                'jobs' => [],
                'source' => array_merge($source, ['error' => $error]),
            ]);
            $this->persistFeedStats($feed, $payload, $error);

            return $payload;
        }

        $body = trim($response->body());
        if ($body === '') {
            $error = 'EMPTY_BODY';
            $payload = $this->mergeSampleIfNeeded($feed, [
                'jobs' => [],
                'source' => array_merge($source, ['error' => $error]),
            ]);
            $this->persistFeedStats($feed, $payload, $error);

            return $payload;
        }

        libxml_use_internal_errors(true);
        $xml = simplexml_load_string($body, SimpleXMLElement::class, LIBXML_NOCDATA);
        if ($xml === false) {
            $error = 'INVALID_XML';
            $payload = ['jobs' => [], 'source' => array_merge($source, ['error' => $error])];
            $this->persistFeedStats($feed, $payload, $error);

            return $payload;
        }

        $source['publisher'] = $this->text($xml->publisher ?? null);
        $source['lastbuilddate'] = $this->text($xml->lastbuilddate ?? null);

        $jobs = $this->parseJobsFromXml($xml, $feed);
        $payload = $this->mergeSampleIfNeeded($feed, ['jobs' => $jobs, 'source' => $source]);
        $this->persistFeedStats($feed, $payload, $payload['source']['error'] ?? null);

        return $payload;
    }

    /**
     * @param  array{jobs: list<array<string, mixed>>, source: array<string, mixed>}  $payload
     */
    private function persistFeedStats(SyndicationFeed $feed, array $payload, ?string $error): void
    {
        $feed->update([
            'last_fetched_at' => now(),
            'last_job_count' => count($payload['jobs']),
            'last_error' => $error,
            'last_publisher' => $payload['source']['publisher'] ?? null,
            'last_build_date' => $payload['source']['lastbuilddate'] ?? null,
        ]);
    }

    /**
     * @param  array{jobs: list<array<string, mixed>>, source: array<string, mixed>}  $payload
     * @return array{jobs: list<array<string, mixed>>, source: array<string, mixed>}
     */
    private function mergeSampleIfNeeded(SyndicationFeed $feed, array $payload): array
    {
        if (count($payload['jobs']) > 0) {
            return $payload;
        }

        if (! $feed->use_sample_when_empty) {
            $payload['source']['feed_note'] = 'Live feed has no job entries yet.';

            return $payload;
        }

        $samplePath = $feed->sample_path
            ?: (string) config('joborio.jobrapido_feed_sample_path');

        if (! is_readable($samplePath)) {
            $payload['source']['feed_note'] = 'Live feed empty; no sample file configured.';

            return $payload;
        }

        $body = file_get_contents($samplePath);
        if ($body === false || trim($body) === '') {
            return $payload;
        }

        libxml_use_internal_errors(true);
        $xml = simplexml_load_string($body, SimpleXMLElement::class, LIBXML_NOCDATA);
        if ($xml === false) {
            return $payload;
        }

        $sampleJobs = $this->parseJobsFromXml($xml, $feed);
        if ($sampleJobs === []) {
            return $payload;
        }

        foreach ($sampleJobs as &$job) {
            $job['is_sample'] = true;
        }
        unset($job);

        $payload['jobs'] = $sampleJobs;
        $payload['source']['sample_fallback'] = true;
        $payload['source']['sample_path'] = basename($samplePath);
        $payload['source']['feed_note'] =
            'Live XML has no <job> rows yet. Showing sample jobs until the feed is populated.';

        return $payload;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function parseJobsFromXml(SimpleXMLElement $xml, SyndicationFeed $feed): array
    {
        $xpath = $feed->job_xpath ?: '//job';
        $jobs = [];
        $nodes = $xml->xpath($xpath) ?: [];
        foreach ($nodes as $node) {
            $mapped = $this->mapJob($node, $feed);
            if ($mapped !== null) {
                $jobs[] = $mapped;
            }
        }

        return $jobs;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function mapJob(SimpleXMLElement $node, SyndicationFeed $feed): ?array
    {
        $title = $this->text($node->title ?? null);
        $url = $this->text($node->url ?? null);
        if ($url === '') {
            $url = $this->text($node->urlDeeplink ?? null);
        }
        if ($title === '' || $url === '') {
            return null;
        }

        $referenceId = $this->text($node->reference_id ?? null);
        if ($referenceId === '') {
            $referenceId = $this->text($node->id ?? null);
        }
        if ($referenceId === '') {
            $referenceId = 'ref_'.substr(sha1($url), 0, 16);
        }

        $referenceId = $feed->slug.':'.$referenceId;

        $descriptionHtml = $this->text($node->description ?? null);
        $category = $this->text($node->category ?? null);
        if ($category === '') {
            $category = 'Uncategorized';
        }

        $company = $this->companyName($node);

        $location = $this->text($node->location ?? null);
        $state = $this->text($node->state ?? null);
        $country = $this->text($node->country ?? null);
        if ($location === '' && isset($node->locations->location)) {
            $loc = $node->locations->location;
            $location = $this->text($loc->city ?? null);
            if ($state === '') {
                $state = $this->text($loc->state ?? null);
            }
            if ($country === '') {
                $country = $this->text($loc->country ?? null);
            }
        }
        $country = strtoupper($country !== '' ? $country : ($feed->country_code ?: 'IN'));
        if ($country === 'INDIA') {
            $country = 'IN';
        }

        return [
            'reference_id' => $referenceId,
            'syndication_feed_id' => $feed->id,
            'syndication_feed_slug' => $feed->slug,
            'syndication_feed_name' => $feed->name,
            'title' => $title,
            'company' => $company,
            'location' => $location,
            'state' => $state,
            'country' => $country,
            'postalcode' => $this->text($node->postalcode ?? null),
            'url' => $url,
            'email' => $this->text($node->email ?? null),
            'website' => $this->text($node->website ?? null),
            'description_html' => $descriptionHtml,
            'description_text' => $this->plainText($descriptionHtml),
            'salary' => $this->text($node->salary ?? null),
            'education' => $this->text($node->education ?? null),
            'jobtype' => $this->text($node->jobtype ?? null),
            'category' => $category,
            'experience' => $this->text($node->experience ?? null),
            'publishdate' => $this->text($node->publishdate ?? null) ?: $this->text($node->timePosted ?? null),
            'expirydate' => $this->text($node->expirydate ?? null),
            'location_label' => $this->locationLabel($location, $state, $country),
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $jobs
     * @return array<string, list<string>>
     */
    public function buildFilterOptions(array $jobs): array
    {
        $pick = static function (string $key) use ($jobs): array {
            $values = [];
            foreach ($jobs as $job) {
                $v = trim((string) ($job[$key] ?? ''));
                if ($v !== '') {
                    $values[$v] = true;
                }
            }
            $list = array_keys($values);
            sort($list, SORT_NATURAL | SORT_FLAG_CASE);

            return $list;
        };

        return [
            'categories' => $pick('category'),
            'locations' => $pick('location'),
            'states' => $pick('state'),
            'countries' => $pick('country'),
            'companies' => $pick('company'),
            'jobtypes' => $pick('jobtype'),
            'experience_levels' => $pick('experience'),
            'education_levels' => $pick('education'),
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $jobs
     * @return list<array<string, mixed>>
     */
    public function applyFilters(array $jobs, array $filters): array
    {
        $search = Str::lower(trim((string) ($filters['search'] ?? '')));
        $feedSlug = trim((string) ($filters['feed'] ?? ''));

        return array_values(array_filter($jobs, function (array $job) use ($filters, $search, $feedSlug): bool {
            if ($feedSlug !== '') {
                if (strcasecmp((string) ($job['syndication_feed_slug'] ?? ''), $feedSlug) !== 0) {
                    return false;
                }
            }

            if ($search !== '') {
                $hay = Str::lower(implode(' ', [
                    $job['title'] ?? '',
                    $job['company'] ?? '',
                    $job['description_text'] ?? '',
                    $job['category'] ?? '',
                    $job['location'] ?? '',
                ]));
                if (! str_contains($hay, $search)) {
                    return false;
                }
            }

            foreach ([
                'category' => 'category',
                'location' => 'location',
                'state' => 'state',
                'country' => 'country',
                'company' => 'company',
                'jobtype' => 'jobtype',
                'experience' => 'experience',
                'education' => 'education',
            ] as $param => $field) {
                $want = trim((string) ($filters[$param] ?? ''));
                if ($want === '') {
                    continue;
                }
                if (strcasecmp((string) ($job[$field] ?? ''), $want) !== 0) {
                    return false;
                }
            }

            return true;
        }));
    }

    /**
     * @param  list<array<string, mixed>>  $jobs
     * @return array<string, list<array<string, mixed>>>
     */
    public function groupByCategory(array $jobs): array
    {
        $groups = [];
        foreach ($jobs as $job) {
            $cat = (string) ($job['category'] ?? 'Uncategorized');
            $groups[$cat][] = $job;
        }
        ksort($groups, SORT_NATURAL | SORT_FLAG_CASE);

        return $groups;
    }

    private function companyName(SimpleXMLElement $node): string
    {
        if (isset($node->company->name)) {
            $name = $this->text($node->company->name);
            if ($name !== '') {
                return $name;
            }
        }

        $raw = $this->text($node->company ?? null);
        $raw = preg_replace('#https?://\S+#i', ' ', $raw) ?? $raw;
        $raw = preg_replace('/\s+/u', ' ', $raw) ?? $raw;

        return trim($raw);
    }

    private function text(mixed $node): string
    {
        if ($node === null) {
            return '';
        }

        return trim(html_entity_decode(strip_tags((string) $node), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
    }

    private function plainText(string $html): string
    {
        $text = html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = preg_replace('/\s+/u', ' ', $text) ?? $text;

        return trim($text);
    }

    private function locationLabel(string $location, string $state, string $country): string
    {
        $parts = array_values(array_filter([$location, $state, $country]));

        return implode(', ', $parts);
    }
}
