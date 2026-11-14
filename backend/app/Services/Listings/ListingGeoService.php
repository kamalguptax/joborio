<?php

namespace App\Services\Listings;

use App\Models\Listing;
use App\Services\Geo\GoogleGeocodingService;
use App\Support\CountryCentroids;

class ListingGeoService
{
    public function __construct(private GoogleGeocodingService $geocoder) {}

    public function syncCoordinates(Listing $listing): Listing
    {
        if ($listing->is_remote && ! $listing->location_label) {
            $centroid = CountryCentroids::forCountry($listing->country_code);
            if ($centroid) {
                $listing->latitude = $centroid['lat'];
                $listing->longitude = $centroid['lng'];
                $listing->save();
            }

            return $listing;
        }

        $parts = array_filter([
            $listing->location_label,
            $listing->country_code,
        ]);
        if ($parts === []) {
            return $listing;
        }

        $result = $this->geocoder->geocodeAddress(implode(', ', $parts));
        if (! $result) {
            return $listing;
        }

        $listing->latitude = $result['lat'];
        $listing->longitude = $result['lng'];
        $listing->geo_place_id = $result['place_id'];
        $listing->save();

        return $listing;
    }
}
