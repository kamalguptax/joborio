<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AttributionEvent;
use App\Models\Creator;
use App\Models\EarningLedger;
use App\Models\PprRegistration;
use App\Models\User;
use App\Services\Earnings\CampaignEarningsService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $creatorCols = ['id', 'user_id', 'handle', 'trust_tier', 'onboarding_completed_at', 'social_links'];
        if (Schema::hasColumn('creators', 'approval_status')) {
            $creatorCols[] = 'approval_status';
            $creatorCols[] = 'approved_at';
        }

        $query = User::query()
            ->with([
                'roles:id,name',
                'creator:'.implode(',', $creatorCols),
                'employer:id,user_id,company_name',
            ])
            ->orderByDesc('created_at');

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($role = $request->string('role')->toString()) {
            $query->whereHas('roles', fn ($q) => $q->where('name', $role));
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if (
            Schema::hasColumn('creators', 'approval_status')
            && ($approval = $request->string('approval_status')->toString())
        ) {
            $query->whereHas('creator', fn ($q) => $q->where('approval_status', $approval));
        }

        $users = $query->paginate(min((int) $request->input('per_page', 25), 100));

        return $this->success($users->items(), 200, [
            'current_page' => $users->currentPage(),
            'last_page' => $users->lastPage(),
            'total' => $users->total(),
        ]);
    }

    public function show(User $user, CampaignEarningsService $campaignEarnings): JsonResponse
    {
        $user->load([
            'roles:id,name',
            'creator.niches:id,name',
            'employer',
        ]);

        $creator = $user->creator;

        $recentActivity = AttributionEvent::query()
            ->where(function ($q) use ($user) {
                $q->whereHas('creator', fn ($c) => $c->where('user_id', $user->id));
            })
            ->with(['listing:id,title,company_name', 'creator:id,handle'])
            ->orderByDesc('created_at')
            ->limit(30)
            ->get();

        $registrations = PprRegistration::query()
            ->whereHas('creator', fn ($c) => $c->where('user_id', $user->id))
            ->with(['listing:id,title'])
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        $activitySummary = [
            'clicks_total' => 0,
            'clicks_counted' => 0,
            'signups_total' => 0,
            'ppr_total' => $registrations->count(),
        ];

        $earningsSummary = null;
        $earningsByType = null;
        $earningsByCampaign = [];
        $recentEarnings = [];

        if ($creator) {
            $activitySummary['clicks_total'] = (int) AttributionEvent::query()
                ->where('creator_id', $creator->id)
                ->where('event_type', 'click')
                ->count();
            $activitySummary['clicks_counted'] = (int) AttributionEvent::query()
                ->where('creator_id', $creator->id)
                ->verifiedClicks()
                ->count();
            $activitySummary['signups_total'] = (int) AttributionEvent::query()
                ->where('creator_id', $creator->id)
                ->whereIn('event_type', ['signup', 'ppr', 'registration'])
                ->count();
            $activitySummary['ppr_total'] = (int) PprRegistration::query()
                ->where('creator_id', $creator->id)
                ->count();

            $earningsSummary = [
                'pending_usd' => round((float) EarningLedger::where('creator_id', $creator->id)->where('state', 'pending')->sum('net_usd'), 4),
                'approved_usd' => round((float) EarningLedger::where('creator_id', $creator->id)->where('state', 'approved')->sum('net_usd'), 4),
                'payable_usd' => round((float) EarningLedger::where('creator_id', $creator->id)->where('state', 'payable')->sum('net_usd'), 4),
                'paid_usd' => round((float) EarningLedger::where('creator_id', $creator->id)->where('state', 'paid')->sum('net_usd'), 4),
                'gross_usd' => round((float) EarningLedger::where('creator_id', $creator->id)->sum('gross_usd'), 4),
                'net_usd' => round((float) EarningLedger::where('creator_id', $creator->id)->sum('net_usd'), 4),
                'ledger_count' => (int) EarningLedger::where('creator_id', $creator->id)->count(),
            ];

            $earningsByType = [];
            foreach (['ppc', 'ppr', 'ppa', 'ref_bonus', 'ref_override'] as $type) {
                $base = EarningLedger::query()->where('creator_id', $creator->id)->where('earning_type', $type);
                $earningsByType[$type] = [
                    'pending_usd' => round((float) (clone $base)->where('state', 'pending')->sum('net_usd'), 4),
                    'approved_usd' => round((float) (clone $base)->where('state', 'approved')->sum('net_usd'), 4),
                    'payable_usd' => round((float) (clone $base)->where('state', 'payable')->sum('net_usd'), 4),
                    'paid_usd' => round((float) (clone $base)->where('state', 'paid')->sum('net_usd'), 4),
                    'net_usd' => round((float) (clone $base)->sum('net_usd'), 4),
                    'count' => (int) (clone $base)->count(),
                ];
            }

            $earningsByCampaign = $campaignEarnings->forCreator($creator->id);

            $recentEarnings = EarningLedger::query()
                ->where('creator_id', $creator->id)
                ->orderByDesc('id')
                ->limit(25)
                ->get(['id', 'earning_type', 'gross_usd', 'platform_fee_usd', 'net_usd', 'state', 'hold_until', 'approved_at', 'created_at']);
        }

        return $this->success([
            'user' => $user,
            'recent_attribution_events' => $recentActivity,
            'ppr_registrations' => $registrations,
            'activity_summary' => $activitySummary,
            'earnings_summary' => $earningsSummary,
            'earnings_by_type' => $earningsByType,
            'earnings_by_campaign' => $earningsByCampaign,
            'recent_earnings' => $recentEarnings,
        ]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'is_active' => ['sometimes', 'boolean'],
            'name' => ['sometimes', 'string', 'max:120'],
            'creator_approval_status' => ['sometimes', 'string', Rule::in(['pending', 'approved', 'rejected'])],
        ]);

        if ($request->user()->id === $user->id && isset($data['is_active']) && ! $data['is_active']) {
            return $this->error('FORBIDDEN', 'You cannot deactivate your own account.', 403);
        }

        $userFields = collect($data)->only(['is_active', 'name'])->all();
        if ($userFields !== []) {
            $user->update($userFields);
        }

        if (
            isset($data['creator_approval_status'])
            && Schema::hasColumn('creators', 'approval_status')
            && $user->creator
        ) {
            $this->applyCreatorApproval($user->creator, $data['creator_approval_status'], $request->user()->id);
        }

        return $this->success($user->fresh()->load('roles:id,name', 'creator', 'employer'));
    }

    private function applyCreatorApproval(Creator $creator, string $status, int $adminId): void
    {
        $payload = ['approval_status' => $status];
        if ($status === 'approved') {
            $payload['approved_at'] = now();
            $payload['approved_by'] = $adminId;
        } else {
            $payload['approved_at'] = null;
            $payload['approved_by'] = null;
        }
        $creator->fill($payload)->save();
    }
}
