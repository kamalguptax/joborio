<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\TrackedWebsite;
use App\Services\Tracking\WebsiteTrackingService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class WebsiteTrackingController extends Controller
{
    use ApiResponse;

    public function __construct(private WebsiteTrackingService $tracking) {}

    public function script(string $publicKey): Response
    {
        $site = TrackedWebsite::query()
            ->where('public_key', $publicKey)
            ->where('is_active', true)
            ->firstOrFail();

        return response($this->tracking->embedScript($site), 200, [
            'Content-Type' => 'application/javascript; charset=UTF-8',
            'Cache-Control' => 'public, max-age=300',
            'Access-Control-Allow-Origin' => '*',
        ]);
    }

    public function hit(Request $request, string $publicKey): JsonResponse
    {
        $site = TrackedWebsite::query()
            ->where('public_key', $publicKey)
            ->where('is_active', true)
            ->first();

        if (! $site) {
            return $this->error('INVALID_SITE', 'Unknown or inactive tracking site.', 404);
        }

        $payload = $request->validate([
            'event' => ['nullable', 'string', 'max:48'],
            'event_type' => ['nullable', 'string', 'max:48'],
            'url' => ['nullable', 'string', 'max:2000'],
            'page_url' => ['nullable', 'string', 'max:2000'],
            'title' => ['nullable', 'string', 'max:500'],
            'page_title' => ['nullable', 'string', 'max:500'],
            'referrer' => ['nullable', 'string', 'max:2000'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'lat' => ['nullable', 'numeric', 'between:-90,90'],
            'lng' => ['nullable', 'numeric', 'between:-180,180'],
        ]);

        $event = $this->tracking->recordHit($site, $request, $payload);

        return $this->success([
            'ok' => true,
            'event_id' => $event->id,
            'recorded' => $event->event_type !== 'pageview_dedup',
        ]);
    }
}
