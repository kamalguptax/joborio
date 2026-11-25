<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AttributionEvent;
use App\Models\Creator;
use App\Models\Employer;
use App\Models\EarningLedger;
use App\Models\FraudReview;
use App\Models\Listing;
use App\Models\PpaApplication;
use App\Models\PprRegistration;
use App\Models\Program;
use App\Models\Publisher;
use App\Models\PublisherCommunity;
use App\Models\SyndicationFeed;
use App\Models\User;
use App\Models\WithdrawalRequest;
use App\Services\Syndication\JobrapidoFeedService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly JobrapidoFeedService $syndication) {}

    public function overview(): JsonResponse
    {
        $syndication = $this->syndication->loadFeed();
        $feeds = SyndicationFeed::query()->orderBy('sort_order')->orderBy('name')->get();

        $recentClicks = AttributionEvent::query()
            ->with(['creator:id,handle,user_id', 'creator.user:id,name,email', 'listing:id,title,company_name'])
            ->orderByDesc('created_at')
            ->limit(15)
            ->get();

        $recentSignups = PprRegistration::query()
            ->with(['creator:id,handle', 'listing:id,title'])
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        return $this->success([
            'counts' => [
                'users' => User::count(),
                'creators' => Creator::count(),
                'employers' => Employer::count(),
                'listings_total' => Listing::count(),
                'listings_active' => Listing::where('status', 'active')->count(),
                'programs' => Program::count(),
                'attribution_events' => AttributionEvent::count(),
                'clicks_counted' => AttributionEvent::where('is_counted', true)->count(),
                'clicks_duplicate' => AttributionEvent::where('event_type', 'click')
                    ->where('fraud_status', 'dedup')->count(),
                'ppr_registrations' => PprRegistration::count(),
                'ppa_applications' => PpaApplication::count(),
                'earnings_ledger' => EarningLedger::count(),
                'fraud_open' => FraudReview::where('status', 'open')->count(),
                'syndication_jobs' => count($syndication['jobs']),
                'syndication_feeds' => $feeds->where('is_active', true)->count(),
                'syndication_feeds_total' => $feeds->count(),
                'publishers' => Publisher::count(),
                'publishers_activated' => Publisher::where('status', Publisher::STATUS_ACTIVATED)->count(),
                'publishers_pending' => Publisher::whereIn('status', [
                    Publisher::STATUS_SUBMITTED,
                    Publisher::STATUS_EMAIL_VERIFIED,
                    Publisher::STATUS_SOCIAL_REVIEWED,
                    Publisher::STATUS_COMMERCIAL_APPROVED,
                ])->count(),
                'communities' => PublisherCommunity::count(),
                'communities_active' => PublisherCommunity::where('status', 'active')->count(),
                'withdrawals_pending' => $this->safeCount(
                    fn () => WithdrawalRequest::where('status', 'pending')->count(),
                ),
                'withdrawals_total' => $this->safeCount(
                    fn () => WithdrawalRequest::count(),
                ),
            ],
            'syndication_source' => $syndication['source'],
            'syndication_feeds' => $feeds,
            'recent_clicks' => $recentClicks,
            'recent_signups' => $recentSignups,
            'click_dedup_minutes' => (int) config('joborio.click_dedup_minutes', 10),
        ]);
    }

    /**
     * Avoid breaking overview when a migration has not been applied yet.
     */
    private function safeCount(callable $fn): int
    {
        try {
            return (int) $fn();
        } catch (\Throwable) {
            return 0;
        }
    }
}
