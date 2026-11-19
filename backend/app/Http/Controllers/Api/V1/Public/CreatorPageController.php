<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\AttributionEvent;
use App\Models\Creator;
use App\Models\EarningLedger;
use App\Services\Tracking\ClickTrackingService;
use App\Support\ApiResponse;
use App\Support\TrackingPublicUrl;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class CreatorPageController extends Controller
{
    use ApiResponse;

    public function __construct(private ClickTrackingService $tracking) {}

    /**
     * Directory of approved ("real") creators shown on the public website.
     */
    public function index(Request $request): JsonResponse
    {
        $limit = min(max((int) $request->input('per_page', 24), 1), 60);

        $query = Creator::query()
            ->with(['user:id,name,public_code', 'niches:id,name'])
            ->whereNotNull('onboarding_completed_at')
            ->whereNotNull('handle');

        if (Schema::hasColumn('creators', 'approval_status')) {
            $query->where('approval_status', 'approved');
        }

        if (Schema::hasColumn('creators', 'approved_at')) {
            $query->orderByDesc('approved_at');
        }

        $rows = $query
            ->orderByDesc('id')
            ->paginate($limit);

        $creatorIds = collect($rows->items())->pluck('id')->all();
        $paidByCreator = $this->paidTotals($creatorIds);
        $clicksByCreator = $this->verifiedClickTotals($creatorIds);

        $items = collect($rows->items())->map(function (Creator $creator) use ($paidByCreator, $clicksByCreator) {
            return $this->presentPublicCreator($creator, [
                'paid_usd' => $paidByCreator[$creator->id] ?? 0.0,
                'verified_clicks' => $clicksByCreator[$creator->id] ?? 0,
            ]);
        })->values()->all();

        return $this->success($items, 200, [
            'current_page' => $rows->currentPage(),
            'last_page' => $rows->lastPage(),
            'total' => $rows->total(),
        ]);
    }

    public function show(Request $request, string $handle): JsonResponse
    {
        $creator = Creator::where('handle', $handle)
            ->with(['niches', 'user:id,name,public_code'])
            ->first();

        if (! $creator || ! $creator->onboarding_completed_at) {
            return $this->error('NOT_FOUND', 'Creator not found.', 404);
        }

        if (! $creator->isApproved()) {
            return $this->error('NOT_PUBLIC', 'This creator profile is not public yet.', 404);
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
                'tracked_url' => TrackingPublicUrl::forToken($token->token),
                'is_pinned' => (bool) $listing->pivot->is_pinned,
            ]);
        });

        $paid = $this->paidTotals([$creator->id]);
        $clicks = $this->verifiedClickTotals([$creator->id]);

        return $this->success([
            'creator' => $this->presentPublicCreator($creator, [
                'paid_usd' => $paid[$creator->id] ?? 0.0,
                'verified_clicks' => $clicks[$creator->id] ?? 0,
            ]),
            'listings' => $listingPayload,
        ]);
    }

    /**
     * @param  array{paid_usd?: float, verified_clicks?: int}  $stats
     * @return array<string, mixed>
     */
    private function presentPublicCreator(Creator $creator, array $stats = []): array
    {
        $payoutReady = filled($creator->payout_method);
        $methodLabel = match ($creator->payout_method) {
            'upi' => 'UPI',
            'paypal' => 'PayPal',
            'bank_transfer' => 'Bank transfer',
            default => null,
        };

        return [
            'handle' => $creator->handle,
            'name' => $creator->user?->name,
            'bio' => $creator->bio,
            'profile_photo_path' => $creator->profile_photo_path,
            'accent_color' => $creator->accent_color,
            'social_links' => $creator->social_links,
            'niches' => $creator->niches,
            'audience_countries' => $creator->audience_countries ?? [],
            'public_code' => $creator->user?->public_code,
            'payout' => [
                'ready' => $payoutReady,
                'method_label' => $methodLabel,
                'currency' => $creator->payout_currency ?: 'USD',
                'paid_usd' => round((float) ($stats['paid_usd'] ?? 0), 2),
                'policy_path' => '/payout-policy',
            ],
            'stats' => [
                'verified_clicks' => (int) ($stats['verified_clicks'] ?? 0),
                'paid_usd' => round((float) ($stats['paid_usd'] ?? 0), 2),
            ],
        ];
    }

    /**
     * @param  list<int>  $creatorIds
     * @return array<int, float>
     */
    private function paidTotals(array $creatorIds): array
    {
        if ($creatorIds === []) {
            return [];
        }

        return EarningLedger::query()
            ->selectRaw('creator_id, COALESCE(SUM(net_usd), 0) as paid_usd')
            ->whereIn('creator_id', $creatorIds)
            ->where('state', 'paid')
            ->groupBy('creator_id')
            ->pluck('paid_usd', 'creator_id')
            ->map(fn ($v) => (float) $v)
            ->all();
    }

    /**
     * @param  list<int>  $creatorIds
     * @return array<int, int>
     */
    private function verifiedClickTotals(array $creatorIds): array
    {
        if ($creatorIds === []) {
            return [];
        }

        return AttributionEvent::query()
            ->selectRaw('creator_id, COUNT(*) as clicks')
            ->whereIn('creator_id', $creatorIds)
            ->verifiedClicks()
            ->groupBy('creator_id')
            ->pluck('clicks', 'creator_id')
            ->map(fn ($v) => (int) $v)
            ->all();
    }
}
