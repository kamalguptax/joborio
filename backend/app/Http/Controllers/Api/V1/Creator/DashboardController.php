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
        $yesterdayStart = now()->subDay()->startOfDay();
        $since3 = now()->subDays(3);
        $since7 = now()->subDays(7);
        $since30 = now()->subDays(30);

        $byCampaign = $this->metricsByCampaign(
            $creator->id,
            $sinceToday,
            $yesterdayStart,
            $since3,
            $since7,
            $since30,
        );
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
            'earnings_by_job' => app(\App\Services\Payouts\TransactionHistoryService::class)
                ->forCreatorByJob($creator->id),
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

        $events = AttributionEvent::query()
            ->where('creator_id', $creator->id)
            ->whereIn('event_type', ['click', 'job_view', 'job_apply'])
            ->with([
                'listing:id,title,program_id,type,ppc_rate_usd,ppr_rate_usd,ppa_rate_usd',
                'listing.program:id,pricing_model,promotion_type',
                'earning:id,attribution_event_id,earning_type',
            ])
            ->orderByDesc('created_at')
            ->get([
                'id',
                'event_type',
                'listing_id',
                'ip_address',
                'is_counted',
                'fraud_status',
                'meta',
                'created_at',
            ]);

        $groups = [];
        foreach ($events as $event) {
            $meta = is_array($event->meta) ? $event->meta : [];
            $listingId = (int) ($event->listing_id ?? 0);
            $referenceId = strtolower(trim((string) ($meta['reference_id'] ?? $meta['job_key'] ?? '')));
            $title = trim((string) ($event->listing?->title ?? $meta['title'] ?? 'Job'));
            $titleKey = strtolower($title);
            $models = $this->pricingModelsForClickEvent($event, $meta);

            if ($listingId > 0) {
                $key = 'listing:'.$listingId;
            } elseif ($referenceId !== '') {
                $raw = str_contains($referenceId, ':')
                    ? substr($referenceId, (int) strrpos($referenceId, ':') + 1)
                    : $referenceId;
                $key = 'ref:'.($raw !== '' ? $raw : $referenceId);
            } else {
                $key = 'title:'.$titleKey;
            }

            if (! isset($groups[$key])) {
                $groups[$key] = [
                    'id' => (int) $event->id,
                    'event_type' => (string) $event->event_type,
                    'is_counted' => (bool) $event->is_counted,
                    'fraud_status' => $event->fraud_status,
                    'ip_address' => $event->ip_address,
                    'created_at' => $event->created_at?->toIso8601String(),
                    'meta' => array_merge($meta, [
                        'title' => $title,
                        'reference_id' => $meta['reference_id'] ?? null,
                        'clicked_at' => $meta['clicked_at'] ?? $event->created_at?->toIso8601String(),
                    ]),
                    'listing' => $event->listing
                        ? ['id' => (int) $event->listing->id, 'title' => $event->listing->title]
                        : ['id' => null, 'title' => $title],
                    'pricing_models' => [],
                    'click_count' => 0,
                    'counted_count' => 0,
                    'duplicate_count' => 0,
                    'unique_ips' => [],
                ];
            }

            foreach (array_keys($models) as $model) {
                $groups[$key]['pricing_models'][$model] = true;
            }

            $group = &$groups[$key];
            $group['click_count']++;
            if ($event->fraud_status === 'dedup' || ! $event->is_counted) {
                if ($event->fraud_status === 'dedup') {
                    $group['duplicate_count']++;
                }
            }
            if ($event->is_counted || $event->event_type === 'job_view') {
                $group['counted_count']++;
                $group['is_counted'] = true;
            }
            if ($event->ip_address) {
                $group['unique_ips'][$event->ip_address] = true;
            }

            $existingTs = strtotime((string) ($group['meta']['clicked_at'] ?? $group['created_at'] ?? '')) ?: 0;
            $rowTs = strtotime((string) ($meta['clicked_at'] ?? $event->created_at)) ?: 0;
            if ($rowTs >= $existingTs) {
                $group['id'] = (int) $event->id;
                $group['event_type'] = (string) $event->event_type;
                $group['fraud_status'] = $event->is_counted
                    ? $event->fraud_status
                    : ($group['fraud_status'] ?? $event->fraud_status);
                $group['ip_address'] = $event->ip_address ?? $group['ip_address'];
                $group['created_at'] = $event->created_at?->toIso8601String() ?? $group['created_at'];
                $group['meta']['clicked_at'] = $meta['clicked_at'] ?? $group['meta']['clicked_at'];
                $group['meta']['title'] = $title;
                if ($event->listing) {
                    $group['listing'] = [
                        'id' => (int) $event->listing->id,
                        'title' => $event->listing->title,
                    ];
                }
            }
            unset($group);
        }

        $merged = array_values(array_map(function (array $group): array {
            $group['unique_ip_count'] = count($group['unique_ips']);
            unset($group['unique_ips']);
            $models = array_keys($group['pricing_models'] ?? []);
            $models = $this->orderPricingModels($models);
            $group['pricing_models'] = $models;
            $group['pricing_model'] = $models[0] ?? 'ppc';

            return $group;
        }, $groups));

        usort($merged, function (array $a, array $b): int {
            return ($b['click_count'] <=> $a['click_count'])
                ?: (strtotime((string) ($b['meta']['clicked_at'] ?? $b['created_at'] ?? ''))
                    <=> strtotime((string) ($a['meta']['clicked_at'] ?? $a['created_at'] ?? '')));
        });

        $perPage = min(max((int) $request->input('per_page', 40), 1), 100);
        $page = max((int) $request->input('page', 1), 1);
        $totalJobs = count($merged);
        $lastPage = max((int) ceil($totalJobs / $perPage), 1);
        $page = min($page, $lastPage);
        $slice = array_slice($merged, ($page - 1) * $perPage, $perPage);

        $tally = ClickDedup::tally($creator->id);

        return $this->success($slice, 200, [
            'current_page' => $page,
            'last_page' => $lastPage,
            'total' => $tally['verified'] + $tally['duplicates'],
            'total_jobs' => $totalJobs,
            'counted' => $tally['verified'],
            'duplicates' => $tally['duplicates'],
            'grouped' => true,
        ]);
    }

    /**
     * @return array<string, array{metrics: array<string, int|float>, earnings_usd: array<string, float>}>
     */
    private function metricsByCampaign(
        int $creatorId,
        Carbon $sinceToday,
        Carbon $yesterdayStart,
        Carbon $since3,
        Carbon $since7,
        Carbon $since30,
    ): array {
        $emptyMetrics = [
            'clicks' => 0,
            'clicks_1d' => 0,
            'clicks_yesterday' => 0,
            'clicks_3d' => 0,
            'clicks_7d' => 0,
            'clicks_30d' => 0,
            'clicks_duplicate' => 0,
            'registrations' => 0,
            'registrations_1d' => 0,
            'registrations_yesterday' => 0,
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
                if ($created && $created->gte($yesterdayStart) && $created->lt($sinceToday)) {
                    $out[$channel]['metrics']['clicks_yesterday']++;
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
                if ($created && $created->gte($yesterdayStart) && $created->lt($sinceToday)) {
                    $out[$channel]['metrics']['registrations_yesterday']++;
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

        // ppr_registrations are listing-scoped (no program_id column); resolve program via listing when needed.
        $pending = \App\Models\PprRegistration::query()
            ->where('creator_id', $creatorId)
            ->where('status', 'pending_verification')
            ->with(['listing:id,program_id'])
            ->get(['id', 'listing_id']);

        foreach ($pending as $row) {
            $channels = ['all', 'ppr'];
            $listingId = (int) ($row->listing_id ?? 0);
            if ($listingId > 0) {
                $channels = $this->channelsForListingId($listingId, $listingChannels);
            } elseif (! empty($row->listing?->program_id)) {
                $program = Program::query()->find($row->listing->program_id);
                if ($program) {
                    $channels = $this->channelsForProgram($program);
                }
            }
            foreach ($channels as $channel) {
                $out[$channel]['metrics']['registrations_pending']++;
            }
        }

        $ledgers = EarningLedger::query()
            ->where('earning_ledgers.creator_id', $creatorId)
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
     * Resolve PPC/PPR/PPA/PPE for a click card.
     * Prefer the campaign program model, then listing rates — never force PPC on a PPR campaign.
     *
     * @param  array<string, mixed>  $meta
     * @return array<string, true>
     */
    private function pricingModelsForClickEvent(AttributionEvent $event, array $meta): array
    {
        $models = [];
        $listing = $event->listing;
        $programModel = strtolower(trim((string) (
            $listing?->program?->pricing_model
            ?? $meta['pricing_model']
            ?? ''
        )));
        if (in_array($programModel, ['ppc', 'ppr', 'ppa', 'ppe'], true)) {
            $models[$programModel] = true;

            return $models;
        }

        $promo = strtolower(trim((string) ($listing?->program?->promotion_type ?? $meta['promotion_type'] ?? '')));
        if ($promo === 'post_promote') {
            $models['ppe'] = true;

            return $models;
        }

        if ($listing) {
            if ((float) ($listing->ppr_rate_usd ?? 0) > 0) {
                $models['ppr'] = true;
            }
            if ((float) ($listing->ppa_rate_usd ?? 0) > 0) {
                $models['ppa'] = true;
            }
            if ((float) ($listing->ppc_rate_usd ?? 0) > 0) {
                $models['ppc'] = true;
            }
            if ($models !== []) {
                return $models;
            }
        }

        $earningType = strtolower(trim((string) ($event->earning?->earning_type ?? '')));
        if (in_array($earningType, ['ppc', 'ppr', 'ppa', 'ppe'], true)) {
            $models[$earningType] = true;

            return $models;
        }

        // Syndicated / XML jobs with no campaign → PPC.
        if (in_array((string) $event->event_type, ['click', 'job_view', 'job_apply'], true)) {
            $models['ppc'] = true;
        }

        return $models;
    }

    /**
     * @param  list<string>  $models
     * @return list<string>
     */
    private function orderPricingModels(array $models): array
    {
        $rank = ['ppr' => 0, 'ppa' => 1, 'ppe' => 2, 'ppc' => 3];
        usort($models, function (string $a, string $b) use ($rank): int {
            return ($rank[$a] ?? 99) <=> ($rank[$b] ?? 99);
        });

        return array_values($models);
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
