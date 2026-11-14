<?php

namespace App\Services\Listings;

use App\Models\Creator;
use App\Models\Listing;
use App\Models\Niche;
use App\Services\Creators\CreatorOnboardingService;
use App\Services\Platform\PlatformSettingsService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

class ListingIngestionService
{
    public function __construct(
        private CreatorOnboardingService $onboarding,
        private PlatformSettingsService $settings,
    ) {}

    /**
     * @return array{imported: int, expired: int}
     */
    public function runIngest(string $source = 'aggregator'): array
    {
        $items = $this->loadFeedItems();

        return $this->upsertFeed($items, $source);
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array{imported: int, expired: int}
     */
    public function upsertFeed(array $items, string $source = 'aggregator'): array
    {
        $seenIds = [];

        foreach ($items as $item) {
            if (empty($item['external_id']) || empty($item['title']) || empty($item['destination_url'])) {
                continue;
            }

            $listing = Listing::updateOrCreate(
                [
                    'external_id' => (string) $item['external_id'],
                    'source' => $source,
                ],
                [
                    'type' => $item['type'] ?? 'job',
                    'title' => $item['title'],
                    'company_name' => $item['company_name'] ?? null,
                    'location_label' => $item['location_label'] ?? null,
                    'country_code' => isset($item['country_code']) ? strtoupper($item['country_code']) : null,
                    'is_remote' => (bool) ($item['is_remote'] ?? false),
                    'category' => $this->normalizeCategory($item['category'] ?? null),
                    'experience_level' => $item['experience_level'] ?? null,
                    'salary_min' => $item['salary_min'] ?? null,
                    'salary_max' => $item['salary_max'] ?? null,
                    'description' => $item['description'] ?? null,
                    'destination_url' => $item['destination_url'],
                    'ppc_rate_usd' => $item['ppc_rate_usd'] ?? $this->settings->payoutStructure()['ppc_rate_usd'],
                    'ppr_rate_usd' => $item['ppr_rate_usd'] ?? $this->settings->payoutStructure()['ppr_rate_usd'],
                    'status' => 'active',
                    'expires_at' => null,
                ]
            );

            $seenIds[] = $listing->id;
        }

        $expired = 0;
        if ($seenIds !== []) {
            $expired = Listing::query()
                ->where('source', $source)
                ->whereNotIn('id', $seenIds)
                ->where('status', 'active')
                ->update(['status' => 'expired']);
        }

        return ['imported' => count($seenIds), 'expired' => $expired];
    }

    public function refreshAllCreatorFeeds(): int
    {
        $count = 0;
        Creator::query()->each(function (Creator $creator) use (&$count) {
            $this->onboarding->syncMatchedListings($creator);
            $count++;
        });

        return $count;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function loadFeedItems(): array
    {
        if (! config('joborio.listings_ingest_enabled', true)) {
            throw new InvalidArgumentException('Listing ingest is disabled (JOBORIO_LISTINGS_INGEST_ENABLED).');
        }

        $source = config('joborio.listings_ingest_source', 'file');

        if ($source === 'url') {
            $url = config('joborio.listings_ingest_url');
            if (! $url) {
                throw new InvalidArgumentException('JOBORIO_LISTINGS_INGEST_URL is not set.');
            }

            $response = Http::timeout(30)->get($url);
            if (! $response->successful()) {
                throw new InvalidArgumentException('Failed to fetch listings feed URL.');
            }

            $items = $response->json();
        } else {
            $path = config('joborio.listings_ingest_file');
            if (! is_readable($path)) {
                throw new InvalidArgumentException("Listings feed file not readable: {$path}");
            }

            $items = json_decode(file_get_contents($path), true);
        }

        if (! is_array($items)) {
            throw new InvalidArgumentException('Listings feed must be a JSON array.');
        }

        return $items;
    }

    private function normalizeCategory(?string $category): ?string
    {
        if (! $category) {
            return null;
        }

        $code = strtolower(trim($category));
        if (Niche::where('code', $code)->exists()) {
            return $code;
        }

        return $code;
    }
}
