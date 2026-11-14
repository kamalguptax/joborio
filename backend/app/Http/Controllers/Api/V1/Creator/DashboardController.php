<?php

namespace App\Http\Controllers\Api\V1\Creator;

use App\Http\Controllers\Controller;
use App\Models\AttributionEvent;
use App\Models\EarningLedger;
use App\Models\Listing;
use App\Models\Program;
use App\Models\Creator;
use App\Services\Creators\TopPerformersService;
use App\Services\Creators\TrustTierService;
use App\Services\Earnings\CampaignEarningsService;
use App\Services\Platform\PlatformSettingsService;
use App\Support\ApiResponse;
use App\Support\ClickDedup;
use App\Support\MoneyCurrencies;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use ApiResponse;

    /** @var list<string> */
    private const CAMPAIGN_CHANNELS = ['all', 'ppc', 'ppr', 'course', 'ppa', 'ppe', 'branding'];

    public function show(Request $request, TrustTierService $trustTiers): JsonResponse
    {
        $creator = $request->user()->creator;
        if (! $creator) {
            return $this->error('NOT_A_CREATOR', 'Creator profile not found.', 404);
        }

        $sinceToday = now()->startOfDay();
        $since3 = now()->subDays(3);
        $since7 = now()->subDays(7);
        $since30 = now()->subDays(30);

        $byCampaign = $this->metricsByCampaign($creator->id, $sinceToday, $since3, $since7, $since30);
        $metrics = $byCampaign['all']['metrics'];
        $earningsByType = $this->earningsByType($creator->id);
        $earnings = [
            'pending_usd' => EarningLedger::where('creator_id', $creator->id)->where('state', 'pending')->sum('net_usd'),
            'approved_usd' => EarningLedger::where('creator_id', $creator->id)->where('state', 'approved')->sum('net_usd'),
            'payable_usd' => EarningLedger::where('creator_id', $creator->id)->where('state', 'payable')->sum('net_usd'),
            'paid_usd' => EarningLedger::where('creator_id', $creator->id)->where('state', 'paid')->sum('net_usd'),
        ];

        $top = AttributionEvent::query()
            ->where('creator_id', $creator->id)
            ->verifiedClicks()
            ->selectRaw('listing_id, count(*) as clicks')
            ->groupBy('listing_id')
            ->orderByDesc('clicks')
            ->limit(5)
            ->with('listing:id,title,company_name')
            ->get();

        $platformMoney = app(PlatformSettingsService::class)->moneyMeta();
        $chosen = Schema::hasColumn('creators', 'payout_currency')
            ? ($creator->payout_currency ?: $platformMoney['code'])
            : $platformMoney['code'];
        $money = MoneyCurrencies::meta($chosen);

        $listingsOnPage = $creator->listings()->wherePivot('is_hidden', false)->count();
        $campaignsJoined = $creator->programs()->wherePivot('status', 'active')->count();

        $recentClicks = AttributionEvent::query()
            ->where('creator_id', $creator->id)
            ->whereIn('event_type', ['click', 'page_view', 'job_view', 'job_apply'])
            ->with(['listing:id,title,type,program_id', 'listing.program:id,pricing_model,promotion_type'])
            ->orderByDesc('created_at')
            ->limit(40)
            ->get(['id', 'event_type', 'listing_id', 'ip_address', 'is_counted', 'fraud_status', 'meta', 'created_at']);

        return $this->success([
            'creator' => $creator->load('niches'),
            'public_url' => $creator->publicUrl(),
            'metrics' => $metrics,
            'metrics_by_campaign' => $byCampaign,
            'campaign_filters' => [
                ['id' => 'all', 'label' => 'All campaigns'],
                ['id' => 'ppc', 'label' => 'Pay Per Click (PPC)'],
                ['id' => 'ppr', 'label' => 'Pay Per Registration (PPR)'],
                ['id' => 'course', 'label' => 'Courses'],
                ['id' => 'ppa', 'label' => 'Pay Per Lead (PPA)'],
                ['id' => 'ppe', 'label' => 'Post promote (PPE)'],
                ['id' => 'branding', 'label' => 'Brand awareness'],
            ],
            'earnings_usd' => $earnings,
            'earnings_by_type' => $earningsByType,
            'earnings_by_campaign' => app(CampaignEarningsService::class)->forCreator($creator->id),
            'ppr' => [
                'can_earn' => $trustTiers->canEarnPpr($creator),
                'hold_days' => $trustTiers->holdDaysFor($creator, 'ppr'),
            ],
            'top_listings' => $top,
            'top_performers' => app(TopPerformersService::class)->forPeriod(30, $creator->id, 8),
            'referrals' => [
                'code' => $creator->referral_code,
                'signups' => Creator::query()
                    ->where('referred_by_creator_id', $creator->id)
                    ->count(),
                'recent' => Creator::query()
                    ->where('referred_by_creator_id', $creator->id)
                    ->orderByDesc('created_at')
                    ->limit(5)
                    ->get(['id', 'handle', 'created_at', 'onboarding_completed_at'])
                    ->map(fn (Creator $c) => [
                        'id' => $c->id,
                        'handle' => $c->handle,
                        'joined_at' => $c->created_at,
                        'onboarded' => (bool) $c->onboarding_completed_at,
                    ])
                    ->values(),
            ],
            'trust_tier' => $trustTiers->metrics($creator),
            'modules' => [
                'listings_on_page' => $listingsOnPage,
                'listings_total' => $creator->listings()->count(),
                'campaigns_joined' => $campaignsJoined,
                'onboarding_complete' => (bool) $creator->onboarding_completed_at,
            ],
            'recent_traffic' => $recentClicks->take(12)->values(),
            'recent_traffic_all' => $recentClicks,
            'click_dedup_minutes' => (int) config('joborio.click_dedup_minutes', 10),
            'currency' => $money['code'],
            'currency_symbol' => $money['symbol'],
        ]);
    }

    public function earnings(Request $request): JsonResponse
    {
        $creator = $request->user()->creator;
        if (! $creator) {
            return $this->error('NOT_A_CREATOR', 'Creator profile not found.', 404);
        }

        $entries = EarningLedger::where('creator_id', $creator->id)
            ->latest()
            ->paginate(20);

        return $this->success($entries->items(), 200, [
            'current_page' => $entries->currentPage(),
            'last_page' => $entries->lastPage(),
            'total' => $entries->total(),
        ]);
    }

    public function clicks(Request $request): JsonResponse
    {
        $creator = $request->user()->creator;
        if (! $creator) {
            return $this->error('NOT_A_CREATOR', 'Creator profile not found.', 404);
        }

        $rows = AttributionEvent::query()
            ->where('creator_id', $creator->id)
            ->whereIn('event_type', ['click', 'job_view', 'job_apply'])
            ->with('listing:id,title')
            ->orderByDesc('created_at')
            ->paginate(min((int) $request->input('per_page', 40), 100));

        return $this->success($rows->items(), 200, [
            'current_page' => $rows->currentPage(),
            'last_page' => $rows->lastPage(),
            'total' => $rows->total(),
            'counted' => ClickDedup::tally($creator->id)['verified'],
            'duplicates' => ClickDedup::tally($creator->id)['duplicates'],
        ]);
    }

    /**
     * @return array<string, array{metrics: array<string, int|float>, earnings_usd: array<string, float>}>
     */
    private function metricsByCampaign(
        int $creatorId,
        Carbon $sinceToday,
        Carbon $since3,
        Carbon $since7,
        Carbon $since30,
    ): array {
        $emptyMetrics = [
            'clicks' => 0,
            'clicks_1d' => 0,
            'clicks_3d' => 0,
            'clicks_7d' => 0,
            'clicks_30d' => 0,
            'clicks_duplicate' => 0,
            'registrations' => 0,
            'registrations_1d' => 0,
            'registrations_3d' => 0,
            'registrations_7d' => 0,
            'registrations_30d' => 0,
            'registrations_pending' => 0,
        ];
        $emptyEarnings = [
            'pending_usd' => 0.0,
            'approved_usd' => 0.0,
            'payable_usd' => 0.0,
            'paid_usd' => 0.0,
        ];

        $out = [];
        foreach (self::CAMPAIGN_CHANNELS as $channel) {
            $out[$channel] = [
                'metrics' => $emptyMetrics,
                'earnings_usd' => $emptyEarnings,
            ];
        }

        $listingChannels = $this->listingChannelMap();

        $clickEvents = AttributionEvent::query()
            ->where('creator_id', $creatorId)
            ->whereIn('event_type', ['click', 'job_view', 'job_apply'])
            ->orderBy('id')
            ->get(['id', 'event_type', 'listing_id', 'ip_address', 'is_counted', 'fraud_status', 'meta', 'created_at']);

        $seen = [];
        foreach ($clickEvents as $event) {
            $channels = $this->channelsForListingId((int) ($event->listing_id ?? 0), $listingChannels);
            $jobKey = ClickDedup::fromMeta($event->meta ?? []);
            $bucket = $jobKey.'|'.(string) $event->ip_address;
            $isDup = $event->fraud_status === 'dedup'
                || ($jobKey !== '' && isset($seen['all'][$bucket]));

            if ($jobKey !== '' && ! $isDup) {
                $seen['all'][$bucket] = true;
            }

            $created = $event->created_at;
            $counted = $event->is_counted || $event->event_type === 'job_view';

            foreach ($channels as $channel) {
                if ($isDup) {
                    $out[$channel]['metrics']['clicks_duplicate']++;
                    continue;
                }
                if (! $counted) {
                    continue;
                }
                $out[$channel]['metrics']['clicks']++;
                if ($created && $created->gte($sinceToday)) {
                    $out[$channel]['metrics']['clicks_1d']++;
                }
                if ($created && $created->gte($since3)) {
                    $out[$channel]['metrics']['clicks_3d']++;
                }
                if ($created && $created->gte($since7)) {
                    $out[$channel]['metrics']['clicks_7d']++;
                }
                if ($created && $created->gte($since30)) {
                    $out[$channel]['metrics']['clicks_30d']++;
                }
            }
        }

        $regs = AttributionEvent::query()
            ->where('creator_id', $creatorId)
            ->where('event_type', 'registration')
            ->where('is_counted', true)
            ->get(['id', 'listing_id', 'created_at']);

        foreach ($regs as $event) {
            $channels = $this->channelsForListingId((int) ($event->listing_id ?? 0), $listingChannels);
            $created = $event->created_at;
            foreach ($channels as $channel) {
                $out[$channel]['metrics']['registrations']++;
                if ($created && $created->gte($sinceToday)) {
                    $out[$channel]['metrics']['registrations_1d']++;
                }
                if ($created && $created->gte($since3)) {
                    $out[$channel]['metrics']['registrations_3d']++;
                }
                if ($created && $created->gte($since7)) {
                    $out[$channel]['metrics']['registrations_7d']++;
                }
                if ($created && $created->gte($since30)) {
                    $out[$channel]['metrics']['registrations_30d']++;
                }
            }
        }

        $pending = \App\Models\PprRegistration::query()
            ->where('creator_id', $creatorId)
            ->where('status', 'pending_verification')
            ->get(['id', 'listing_id', 'program_id']);

        foreach ($pending as $row) {
            $channels = ['all', 'ppr'];
            $listingId = (int) ($row->listing_id ?? 0);
            if ($listingId > 0) {
                $channels = $this->channelsForListingId($listingId, $listingChannels);
            } elseif (! empty($row->program_id)) {
                $program = Program::query()->find($row->program_id);
                if ($program) {
                    $channels = $this->channelsForProgram($program);
                }
            }
            foreach ($channels as $channel) {
                $out[$channel]['metrics']['registrations_pending']++;
            }
        }

        $ledgers = EarningLedger::query()
            ->where('creator_id', $creatorId)
            ->leftJoin('attribution_events', 'attribution_events.id', '=', 'earning_ledgers.attribution_event_id')
            ->get([
                'earning_ledgers.id',
                'earning_ledgers.earning_type',
                'earning_ledgers.state',
                'earning_ledgers.net_usd',
                'attribution_events.listing_id',
            ]);

        foreach ($ledgers as $row) {
            $channels = ['all'];
            $type = strtolower((string) $row->earning_type);
            if (in_array($type, ['ppc', 'ppr', 'ppa', 'ppe'], true)) {
                $channels[] = $type;
            }
            $listingId = (int) ($row->listing_id ?? 0);
            if ($listingId > 0) {
                foreach ($this->channelsForListingId($listingId, $listingChannels) as $ch) {
                    if ($ch !== 'all') {
                        $channels[] = $ch;
                    }
                }
            }
            $channels = array_values(array_unique($channels));
            $state = (string) $row->state;
            $net = (float) $row->net_usd;
            $key = match ($state) {
                'pending' => 'pending_usd',
                'approved' => 'approved_usd',
                'payable' => 'payable_usd',
                'paid' => 'paid_usd',
                default => null,
            };
            if ($key === null) {
                continue;
            }
            foreach ($channels as $channel) {
                if (! isset($out[$channel])) {
                    continue;
                }
                $out[$channel]['earnings_usd'][$key] += $net;
            }
        }

        return $out;
    }

    /**
     * @return array<int, list<string>>
     */
    private function listingChannelMap(): array
    {
        $map = [];
        $listings = Listing::query()
            ->with('program:id,pricing_model,promotion_type')
            ->get(['id', 'type', 'program_id']);

        foreach ($listings as $listing) {
            $channels = ['all'];
            $type = strtolower((string) ($listing->type ?? 'job'));
            if ($type === 'course') {
                $channels[] = 'course';
            }
            if ($type === 'branding') {
                $channels[] = 'branding';
            }
            if ($type === 'post_promote') {
                $channels[] = 'ppe';
            }
            $program = $listing->program;
            if ($program) {
                foreach ($this->channelsForProgram($program) as $ch) {
                    if ($ch !== 'all') {
                        $channels[] = $ch;
                    }
                }
            } elseif (in_array($type, ['job', 'tool', 'other', ''], true)) {
                $channels[] = 'ppc';
            }
            $map[(int) $listing->id] = array_values(array_unique($channels));
        }

        return $map;
    }

    /**
     * @param  array<int, list<string>>  $listingChannels
     * @return list<string>
     */
    private function channelsForListingId(int $listingId, array $listingChannels): array
    {
        if ($listingId > 0 && isset($listingChannels[$listingId])) {
            return $listingChannels[$listingId];
        }

        return ['all', 'ppc'];
    }

    /**
     * @return list<string>
     */
    private function channelsForProgram(Program $program): array
    {
        $channels = ['all'];
        $pricing = strtolower((string) ($program->pricing_model ?? 'ppc'));
        $promo = strtolower((string) ($program->promotion_type ?? ''));
        if (in_array($pricing, ['ppc', 'ppr', 'ppa', 'ppe'], true)) {
            $channels[] = $pricing;
        }
        if ($promo === 'course') {
            $channels[] = 'course';
        }
        if ($promo === 'branding') {
            $channels[] = 'branding';
        }
        if ($promo === 'post_promote') {
            $channels[] = 'ppe';
        }

        return array_values(array_unique($channels));
    }

    /**
     * @return array<string, array<string, float>>
     */
    private function earningsByType(int $creatorId): array
    {
        $types = ['ppc', 'ppr', 'ppa', 'ppe'];
        $out = [];

        foreach ($types as $type) {
            $base = EarningLedger::query()->where('creator_id', $creatorId)->where('earning_type', $type);
            $out[$type] = [
                'pending_usd' => (float) (clone $base)->where('state', 'pending')->sum('net_usd'),
                'approved_usd' => (float) (clone $base)->where('state', 'approved')->sum('net_usd'),
                'payable_usd' => (float) (clone $base)->where('state', 'payable')->sum('net_usd'),
                'paid_usd' => (float) (clone $base)->where('state', 'paid')->sum('net_usd'),
            ];
        }

        return $out;
    }
}
