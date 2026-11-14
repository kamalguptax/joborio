<?php

namespace App\Http\Controllers\Api\V1\Creator;

use App\Http\Controllers\Controller;
use App\Models\Listing;
use App\Services\Tracking\ClickTrackingService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CreatorListingController extends Controller
{
    use ApiResponse;

    public function __construct(private ClickTrackingService $tracking) {}

    public function index(Request $request): JsonResponse
    {
        $creator = $request->user()->creator;
        if (! $creator) {
            return $this->error('NOT_A_CREATOR', 'Creator profile not found.', 404);
        }

        $listings = $creator->listings()
            ->active()
            ->orderByDesc('creator_listing.is_pinned')
            ->orderByDesc('listings.updated_at')
            ->get()
            ->map(function (Listing $listing) use ($creator) {
                $token = $this->tracking->getOrCreateToken($creator, $listing);

                return [
                    'listing' => $listing,
                    'is_pinned' => (bool) $listing->pivot->is_pinned,
                    'is_hidden' => (bool) $listing->pivot->is_hidden,
                    'tracked_url' => url('/r/'.$token->token),
                ];
            });

        return $this->success($listings);
    }

    public function update(Request $request, Listing $listing): JsonResponse
    {
        $creator = $request->user()->creator;
        if (! $creator) {
            return $this->error('NOT_A_CREATOR', 'Creator profile not found.', 404);
        }

        if (! $creator->listings()->where('listings.id', $listing->id)->exists()) {
            return $this->error('NOT_ON_PAGE', 'Listing is not on your creator page.', 404);
        }

        $request->validate([
            'is_pinned' => ['sometimes', 'boolean'],
            'is_hidden' => ['sometimes', 'boolean'],
        ]);

        $pivot = [];
        if ($request->has('is_pinned')) {
            $pivot['is_pinned'] = $request->boolean('is_pinned');
        }
        if ($request->has('is_hidden')) {
            $pivot['is_hidden'] = $request->boolean('is_hidden');
        }

        if ($pivot !== []) {
            $creator->listings()->updateExistingPivot($listing->id, $pivot);
        }

        $fresh = $creator->listings()->where('listings.id', $listing->id)->first();
        $token = $this->tracking->getOrCreateToken($creator, $listing);

        return $this->success([
            'listing' => $fresh,
            'is_pinned' => (bool) $fresh->pivot->is_pinned,
            'is_hidden' => (bool) $fresh->pivot->is_hidden,
            'tracked_url' => url('/r/'.$token->token),
        ]);
    }
}
