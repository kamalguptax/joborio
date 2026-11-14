<?php

namespace App\Http\Controllers\Api\V1\Creator;

use App\Http\Controllers\Controller;
use App\Models\Listing;
use App\Services\Tracking\ClickTrackingService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrackingLinkController extends Controller
{
    use ApiResponse;

    public function __construct(private ClickTrackingService $tracking) {}

    public function show(Request $request, Listing $listing): JsonResponse
    {
        $creator = $request->user()->creator;
        if (! $creator) {
            return $this->error('NOT_A_CREATOR', 'Creator profile not found.', 404);
        }

        $token = $this->tracking->getOrCreateToken($creator, $listing);
        $redirectUrl = url('/r/'.$token->token);

        return $this->success([
            'listing_id' => $listing->id,
            'token' => $token->token,
            'tracked_url' => $redirectUrl,
        ]);
    }
}
