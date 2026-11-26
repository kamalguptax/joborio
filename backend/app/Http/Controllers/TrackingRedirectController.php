<?php

namespace App\Http\Controllers;

use App\Models\TrackingToken;
use App\Services\Tracking\ClickTrackingService;
use App\Support\PprTrackingUrl;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TrackingRedirectController extends Controller
{
    public function __construct(private ClickTrackingService $tracking) {}

    public function __invoke(Request $request, string $token): RedirectResponse
    {
        $trackingToken = TrackingToken::with(['listing', 'creator.user'])
            ->where('token', $token)
            ->firstOrFail();

        $this->tracking->recordClick($trackingToken, $request);

        $destination = (string) ($trackingToken->listing?->destination_url ?? '');
        if ($destination === '') {
            abort(404);
        }

        // Hand attribution to the employer site so PPR webhooks can send the same token back.
        $subid = $trackingToken->creator?->user?->public_code;
        $outbound = PprTrackingUrl::append($destination, $trackingToken->token, $subid);

        return redirect()->away($outbound);
    }
}
