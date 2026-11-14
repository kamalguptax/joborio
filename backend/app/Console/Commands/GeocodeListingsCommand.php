<?php

namespace App\Console\Commands;

use App\Models\Listing;
use App\Services\Listings\ListingGeoService;
use Illuminate\Console\Command;

class GeocodeListingsCommand extends Command
{
    protected $signature = 'listings:geocode {--limit=50}';

    protected $description = 'Geocode active listings missing coordinates (Google Maps Geocoding API)';

    public function handle(ListingGeoService $geo): int
    {
        $limit = max(1, (int) $this->option('limit'));

        $listings = Listing::query()
            ->active()
            ->where(function ($q) {
                $q->whereNull('latitude')->orWhereNull('longitude');
            })
            ->orderByDesc('updated_at')
            ->limit($limit)
            ->get();

        $updated = 0;
        foreach ($listings as $listing) {
            $before = [$listing->latitude, $listing->longitude];
            $geo->syncCoordinates($listing->fresh());
            $listing->refresh();
            if ($listing->latitude !== $before[0] || $listing->longitude !== $before[1]) {
                $updated++;
            }
        }

        $this->info("Processed {$listings->count()} listings, updated {$updated}.");

        return self::SUCCESS;
    }
}
