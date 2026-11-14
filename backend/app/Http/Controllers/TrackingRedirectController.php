<?php

namespace App\Http\Controllers;

use App\Models\TrackingToken;
use App\Services\Tracking\ClickTrackingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TrackingRedirectController extends Controller
{
    public function __construct(private ClickTrackingService $tracking) {}

    public function __invoke(Request $request, string $token): RedirectResponse
    {
        $trackingToken = TrackingToken::with('listing')->where('token', $token)->firstOrFail();

        $this->tracking->recordClick($trackingToken, $request);

        return redirect()->away($trackingToken->listing->destination_url);
    }
}
