<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\TrackedWebsite;
use App\Models\WebsiteTrackingEvent;
use App\Services\Tracking\WebsiteTrackingService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminTrackedWebsiteController extends Controller
{
    use ApiResponse;

    public function __construct(private WebsiteTrackingService $tracking) {}

    public function index(): JsonResponse
    {
        $sites = TrackedWebsite::query()
            ->withCount([
                'events as pageviews_count' => fn ($q) => $q->where('event_type', 'pageview'),
                'events as events_total_count',
            ])
            ->withMax('events as last_event_at', 'created_at')
            ->orderByDesc('id')
            ->get();

        $apiBase = rtrim((string) config('app.url'), '/');

        return $this->success($sites->map(function (TrackedWebsite $site) use ($apiBase) {
            return $this->sitePayload($site, $apiBase);
        }));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'domain' => ['required', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $site = TrackedWebsite::create([
            'name' => $data['name'],
            'domain' => $data['domain'],
            'is_active' => $data['is_active'] ?? true,
            'created_by_user_id' => $request->user()->id,
        ]);

        $apiBase = rtrim((string) config('app.url'), '/');

        return $this->success($this->sitePayload($site->fresh(), $apiBase), 201);
    }

    public function show(TrackedWebsite $trackedWebsite): JsonResponse
    {
        $since = now()->subDays(7);
        $apiBase = rtrim((string) config('app.url'), '/');

        $stats = [
            'pageviews_7d' => WebsiteTrackingEvent::query()
                ->where('tracked_website_id', $trackedWebsite->id)
                ->where('event_type', 'pageview')
                ->where('created_at', '>=', $since)
                ->count(),
            'events_7d' => WebsiteTrackingEvent::query()
                ->where('tracked_website_id', $trackedWebsite->id)
                ->where('created_at', '>=', $since)
                ->count(),
            'unique_pages_7d' => WebsiteTrackingEvent::query()
                ->where('tracked_website_id', $trackedWebsite->id)
                ->where('created_at', '>=', $since)
                ->distinct('page_url')
                ->count('page_url'),
        ];

        $recent = WebsiteTrackingEvent::query()
            ->where('tracked_website_id', $trackedWebsite->id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return $this->success([
            'site' => $this->sitePayload($trackedWebsite, $apiBase),
            'stats' => $stats,
            'recent_events' => $recent,
        ]);
    }

    public function update(Request $request, TrackedWebsite $trackedWebsite): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'domain' => ['sometimes', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $trackedWebsite->update($data);
        $apiBase = rtrim((string) config('app.url'), '/');

        return $this->success($this->sitePayload($trackedWebsite->fresh(), $apiBase));
    }

    public function destroy(TrackedWebsite $trackedWebsite): JsonResponse
    {
        $trackedWebsite->delete();

        return $this->success(['deleted' => true]);
    }

    /**
     * @return array<string, mixed>
     */
    private function sitePayload(TrackedWebsite $site, string $apiBase): array
    {
        $scriptUrl = $apiBase.'/api/v1/track/script/'.$site->public_key.'.js';
        $snippet = '<script async src="'.$scriptUrl.'" data-joborio-site="'.$site->public_key.'"></script>';

        return [
            'id' => $site->id,
            'name' => $site->name,
            'domain' => $site->domain,
            'public_key' => $site->public_key,
            'is_active' => $site->is_active,
            'created_at' => $site->created_at,
            'pageviews_count' => $site->pageviews_count ?? null,
            'events_total_count' => $site->events_total_count ?? null,
            'last_event_at' => $site->last_event_at ?? null,
            'script_url' => $scriptUrl,
            'embed_snippet' => $snippet,
            'install_note' => 'Paste before </head> on every page of '.$site->domain,
        ];
    }
}
