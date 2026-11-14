<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AttributionEvent;
use App\Models\PprRegistration;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class AdminActivityController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $type = $request->string('type')->toString() ?: 'clicks';

        if ($type === 'signups') {
            return $this->signups($request);
        }

        return $this->clicks($request);
    }

    private function clicks(Request $request): JsonResponse
    {
        if ($request->string('view')->toString() === 'users') {
            return $this->clicksByUser($request);
        }

        $query = AttributionEvent::query()
            ->with([
                'creator:id,handle,user_id',
                'creator.user:id,name,email,public_code',
                'listing:id,title,company_name,type,category,program_id',
                'listing.program:id,title,promotion_type,status,pricing_model',
                'earning:id,attribution_event_id,net_usd,gross_usd,state,earning_type',
            ])
            ->orderByDesc('created_at');

        if ($request->filled('event_type')) {
            $query->where('event_type', $request->string('event_type')->toString());
        } else {
            $query->whereIn('event_type', ['click', 'job_view', 'job_apply']);
        }

        if ($request->filled('fraud_status')) {
            $query->where('fraud_status', $request->string('fraud_status')->toString());
        }

        if ($request->has('is_counted')) {
            $query->where('is_counted', $request->boolean('is_counted'));
        }

        if ($creatorId = $request->integer('creator_id')) {
            $query->where('creator_id', $creatorId);
        }

        if ($userId = $request->integer('user_id')) {
            $query->whereHas('creator', fn ($creator) => $creator->where('user_id', $userId));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->string('date_from')->toString());
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->string('date_to')->toString());
        }

        if ($request->filled('earning')) {
            $earning = $request->string('earning')->toString();
            if ($earning === 'with') {
                $query->whereHas('earning');
            } elseif ($earning === 'without') {
                $query->whereDoesntHave('earning');
            } elseif (in_array($earning, ['pending', 'approved', 'payable', 'paid'], true)) {
                $query->whereHas('earning', fn ($q) => $q->where('state', $earning));
            }
        }

        if ($category = trim($request->string('category')->toString())) {
            $query->where(function ($inner) use ($category) {
                $inner->whereHas('listing', function ($listing) use ($category) {
                    $listing->where('type', $category)
                        ->orWhere('category', 'like', '%'.$category.'%')
                        ->orWhereHas('program', function ($program) use ($category) {
                            $program->where('promotion_type', $category)
                                ->orWhere('title', 'like', '%'.$category.'%');
                        });
                })->orWhere('meta->category', 'like', '%'.$category.'%');
            });
        }

        if ($search = trim($request->string('search')->toString())) {
            $this->applySearch($query, $search);
        }

        $rows = $query->paginate(min((int) $request->input('per_page', 40), 100));
        $items = collect($rows->items())->map(fn (AttributionEvent $event) => $this->presentClick($event))->all();

        return $this->success($items, 200, [
            'type' => 'clicks',
            'current_page' => $rows->currentPage(),
            'last_page' => $rows->lastPage(),
            'total' => $rows->total(),
        ]);
    }

    private function clicksByUser(Request $request): JsonResponse
    {
        $query = AttributionEvent::query()
            ->whereIn('event_type', ['click', 'job_view', 'job_apply']);

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->string('date_from')->toString());
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->string('date_to')->toString());
        }
        if ($search = trim($request->string('search')->toString())) {
            $this->applySearch($query, $search);
        }

        $rows = $query
            ->select('creator_id')
            ->selectRaw('COUNT(*) as clicks')
            ->selectRaw('SUM(CASE WHEN is_counted THEN 1 ELSE 0 END) as counted_clicks')
            ->selectRaw("SUM(CASE WHEN fraud_status = 'dedup' THEN 1 ELSE 0 END) as duplicate_clicks")
            ->selectRaw('MAX(created_at) as last_click_at')
            ->groupBy('creator_id')
            ->orderByDesc('clicks')
            ->with([
                'creator:id,handle,user_id',
                'creator.user:id,name,email,public_code',
                'creator.programs' => fn ($q) => $q->wherePivot('status', 'active')->select('programs.id', 'programs.title', 'programs.status', 'programs.promotion_type'),
            ])
            ->get()
            ->map(function ($row) {
                $user = $row->creator?->user;
                $campaigns = $row->creator?->programs?->map(fn ($p) => [
                    'id' => $p->id,
                    'title' => $p->title,
                    'promotion_type' => $p->promotion_type ?? null,
                    'status' => $p->status,
                ])->values()->all() ?? [];

                return [
                    'creator_id' => $row->creator_id,
                    'user_id' => $user?->id,
                    'creator_name' => $user?->name,
                    'creator_email' => $user?->email,
                    'creator_handle' => $row->creator?->handle,
                    'public_code' => $user?->public_code ?: ($user ? User::codeForId((int) $user->id) : null),
                    'clicks' => (int) $row->clicks,
                    'counted_clicks' => (int) $row->counted_clicks,
                    'duplicate_clicks' => (int) $row->duplicate_clicks,
                    'last_click_at' => $row->last_click_at,
                    'running_campaigns' => $campaigns,
                    'running_campaign_count' => count($campaigns),
                    'creator' => $row->creator,
                ];
            });

        $page = max(1, (int) $request->input('page', 1));
        $perPage = min(max(1, (int) $request->input('per_page', 40)), 100);
        $slice = $rows->slice(($page - 1) * $perPage, $perPage)->values();

        return $this->success($slice, 200, [
            'type' => 'users',
            'current_page' => $page,
            'last_page' => max(1, (int) ceil($rows->count() / $perPage)),
            'total' => $rows->count(),
        ]);
    }

    private function signups(Request $request): JsonResponse
    {
        $query = PprRegistration::query()
            ->with([
                'creator:id,handle,user_id',
                'creator.user:id,name,email,public_code',
                'listing:id,title,company_name',
            ])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->string('date_from')->toString());
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->string('date_to')->toString());
        }

        $rows = $query->paginate(min((int) $request->input('per_page', 40), 100));

        return $this->success($rows->items(), 200, [
            'type' => 'signups',
            'current_page' => $rows->currentPage(),
            'last_page' => $rows->lastPage(),
            'total' => $rows->total(),
        ]);
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<\App\Models\AttributionEvent>  $query
     */
    private function applySearch($query, string $search): void
    {
        $like = '%'.$search.'%';
        $digits = preg_replace('/\D+/', '', $search) ?: '';
        $code = strtoupper(trim($search));

        $query->where(function ($inner) use ($like, $search, $digits, $code) {
            $inner->where('ip_address', 'like', $like)
                ->orWhere('meta->title', 'like', $like)
                ->orWhere('meta->reference_id', 'like', $like)
                ->orWhere('meta->subid', 'like', $like)
                ->orWhereHas('listing', fn ($listing) => $listing->where('title', 'like', $like)
                    ->orWhere('company_name', 'like', $like)
                    ->orWhere('category', 'like', $like))
                ->orWhereHas('creator', function ($creator) use ($like, $digits, $code) {
                    $creator->where('handle', 'like', $like)
                        ->orWhereHas('user', function ($user) use ($like, $digits, $code) {
                            $user->where('name', 'like', $like)
                                ->orWhere('email', 'like', $like);
                            if (Schema::hasColumn('users', 'public_code')) {
                                $user->orWhere('public_code', 'like', $like)
                                    ->orWhere('public_code', $code);
                            }
                            if ($digits !== '') {
                                $user->orWhere('id', (int) $digits);
                            }
                        });
                    if ($digits !== '') {
                        $creator->orWhere('id', (int) $digits)
                            ->orWhere('user_id', (int) $digits);
                    }
                });

            if ($digits !== '' && ctype_digit($search)) {
                $inner->orWhere('id', (int) $digits)
                    ->orWhere('creator_id', (int) $digits);
            }
        });
    }

    /**
     * @return array<string, mixed>
     */
    private function presentClick(AttributionEvent $event): array
    {
        $user = $event->creator?->user;
        $listing = $event->listing;
        $program = $listing?->program;
        $earning = $event->earning;
        $meta = is_array($event->meta) ? $event->meta : [];

        return [
            'id' => $event->id,
            'event_type' => $event->event_type,
            'is_counted' => (bool) $event->is_counted,
            'fraud_status' => $event->fraud_status,
            'is_duplicate' => $event->fraud_status === 'dedup',
            'ip_address' => $event->ip_address,
            'created_at' => optional($event->created_at)?->toIso8601String(),
            'geo_country' => $event->geo_country,
            'meta' => $meta,
            'creator_id' => $event->creator_id,
            'user_id' => $user?->id,
            'creator_name' => $user?->name,
            'creator_email' => $user?->email,
            'creator_handle' => $event->creator?->handle,
            'public_code' => $user?->public_code ?: ($user ? User::codeForId((int) $user->id) : null),
            'job_title' => $listing?->title ?: ($meta['title'] ?? 'Job'),
            'company_name' => $listing?->company_name ?: ($meta['company'] ?? null),
            'work_category' => $program?->promotion_type
                ?: $listing?->type
                ?: $listing?->category
                ?: ($meta['category'] ?? null),
            'running_campaign' => $program ? [
                'id' => $program->id,
                'title' => $program->title,
                'status' => $program->status,
                'promotion_type' => $program->promotion_type,
                'pricing_model' => $program->pricing_model,
            ] : null,
            'earning' => $earning ? [
                'id' => $earning->id,
                'net_usd' => (float) $earning->net_usd,
                'gross_usd' => (float) $earning->gross_usd,
                'state' => $earning->state,
                'earning_type' => $earning->earning_type,
            ] : null,
            'listing' => $listing,
            'creator' => $event->creator,
        ];
    }
}
