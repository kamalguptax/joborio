<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\AttributionEvent;
use App\Models\Creator;
use App\Services\Tracking\ClickTrackingService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CreatorPageController extends Controller
{
    use ApiResponse;

    public function __construct(private ClickTrackingService $tracking) {}

    public function show(Request $request, string $handle): JsonResponse
    {
        $creator = Creator::where('handle', $handle)
            ->with(['niches'])
            ->first();

        if (! $creator) {
            return $this->error('NOT_FOUND', 'Creator not found.', 404);
        }

        $listings = $creator->listings()
            ->active()
            ->wherePivot('is_hidden', false)
            ->orderByDesc('creator_listing.is_pinned')
            ->orderByDesc('listings.updated_at')
            ->get();

        $creator->setRelation('listings', $listings);

        AttributionEvent::create([
            'tracking_token_id' => null,
            'creator_id' => $creator->id,
            'listing_id' => null,
            'event_type' => 'page_view',
            'ip_address' => $request->ip(),
            'device_fingerprint' => null,
            'geo_country' => $request->header('CF-IPCountry'),
            'referrer' => $request->headers->get('referer'),
            'is_counted' => false,
            'fraud_status' => 'clean',
        ]);

        $listingPayload = $listings->map(function ($listing) use ($creator) {
            $token = $this->tracking->getOrCreateToken($creator, $listing);

            return array_merge($listing->toArray(), [
                'tracked_url' => url('/r/'.$token->token),
                'is_pinned' => (bool) $listing->pivot->is_pinned,
            ]);
        });

        return $this->success([
            'creator' => [
                'handle' => $creator->handle,
                'bio' => $creator->bio,
                'profile_photo_path' => $creator->profile_photo_path,
                'accent_color' => $creator->accent_color,
                'social_links' => $creator->social_links,
                'niches' => $creator->niches,
            ],
            'listings' => $listingPayload,
        ]);
    }
}
