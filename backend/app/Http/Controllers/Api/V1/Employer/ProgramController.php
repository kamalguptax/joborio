<?php

namespace App\Http\Controllers\Api\V1\Employer;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Services\Ads\PlatformAdsSyncService;
use App\Services\Programs\ProgramService;
use App\Support\ApiResponse;
use App\Support\CampaignTypes;
use App\Support\EmployerBilling;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProgramController extends Controller
{
    use ApiResponse;

    public function __construct(
        private ProgramService $programs,
        private PlatformAdsSyncService $ads,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $employer = $request->user()->employer;
        if (! $employer) {
            return $this->error('NOT_AN_EMPLOYER', 'Complete employer registration first.', 404);
        }

        $items = Program::query()
            ->where('employer_id', $employer->id)
            ->with('listing')
            ->latest()
            ->get();

        return $this->success($items);
    }

    public function store(Request $request): JsonResponse
    {
        $employer = $request->user()->employer;
        if (! $employer) {
            return $this->error('NOT_AN_EMPLOYER', 'Complete employer registration first.', 404);
        }

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'destination_url' => ['required', 'url', 'max:2000'],
            'pricing_model' => ['required', 'in:ppc,ppr,ppa,ppe'],
            'promotion_type' => ['sometimes', Rule::in(CampaignTypes::IDS)],
            'rate_usd' => ['required', 'numeric', 'min:0'],
            'budget_total_usd' => ['required', 'numeric', 'min:0'],
            'trial_without_ip' => ['sometimes', 'boolean'],
            'target_niche_ids' => ['nullable', 'array'],
            'target_niche_ids.*' => ['integer', 'exists:niches,id'],
            'target_countries' => ['nullable', 'array'],
            'target_countries.*' => ['string', 'size:2'],
            'min_trust_tier' => ['nullable', 'in:nano,micro,mid,macro'],
            'country_code' => ['nullable', 'string', 'size:2'],
            'is_remote' => ['nullable', 'boolean'],
            'category' => ['nullable', 'string', 'max:120'],
            'auto_ads_platforms' => ['nullable', 'array'],
            'auto_ads_platforms.*' => ['string', Rule::in(PlatformAdsSyncService::PLATFORMS)],
            'post_url' => ['nullable', 'url', 'max:2000'],
            'engagement_actions' => ['nullable', 'array'],
            'engagement_actions.*' => ['string', Rule::in(CampaignTypes::ENGAGEMENT_ACTIONS)],
            'engage_brief' => ['nullable', 'string', 'max:5000'],
        ]);

        if (($data['promotion_type'] ?? null) === 'post_promote' || ($data['pricing_model'] ?? null) === 'ppe') {
            if (empty($data['post_url'])) {
                return $this->error('VALIDATION', 'Post URL is required for post promote campaigns.', 422);
            }
            $data['promotion_type'] = 'post_promote';
            $data['pricing_model'] = 'ppe';
        }

        $isTrial = (bool) ($data['trial_without_ip'] ?? false);
        if (! $isTrial && (float) $data['budget_total_usd'] < 10) {
            return $this->error('VALIDATION', 'Budget must be at least 10 for paid programs.', 422);
        }
        if (! $isTrial && (float) $data['rate_usd'] < 0.01) {
            return $this->error('VALIDATION', 'Rate must be at least 0.01 for paid programs.', 422);
        }

        $program = $this->programs->create($employer, $data);
        $live = $program->status === 'active';

        return $this->success([
            'program' => $program,
            'went_live' => $live,
            'can_go_live' => $employer->canGoLive(),
            'billing_missing' => $employer->billingMissing(),
            'message' => $live
                ? 'Campaign is live.'
                : ($isTrial
                    ? 'Trial campaign created.'
                    : 'Campaign saved as pending. Complete company GST, business email, and payment to go live.'),
        ], 201);
    }

    public function show(Request $request, Program $program): JsonResponse
    {
        $this->authorizeEmployerProgram($request, $program);

        return $this->success($this->programs->stats($program));
    }

    public function pause(Request $request, Program $program): JsonResponse
    {
        $this->authorizeEmployerProgram($request, $program);

        if ($program->status !== 'active') {
            return $this->error('INVALID_STATE', 'Only active programs can be paused.', 422);
        }

        return $this->success(['program' => $this->programs->pause($program)]);
    }

    public function resume(Request $request, Program $program): JsonResponse
    {
        $this->authorizeEmployerProgram($request, $program);

        if (! in_array($program->status, ['paused', 'pending_review'], true)) {
            return $this->error('INVALID_STATE', 'Only paused or pending programs can go live.', 422);
        }

        $employer = $request->user()->employer;
        try {
            if (! ($program->trial_without_ip ?? false)) {
                EmployerBilling::assertCanGoLive($employer);
            }
        } catch (ValidationException $e) {
            return $this->error(
                'BILLING_REQUIRED',
                'Complete company details, GST, business email, and payment before going live.',
                422,
                ['missing' => $employer?->billingMissing() ?? []],
            );
        }

        return $this->success(['program' => $this->programs->activate($program)]);
    }

    public function syncAds(Request $request, Program $program): JsonResponse
    {
        $this->authorizeEmployerProgram($request, $program);

        if ($program->status !== 'active') {
            return $this->error('INVALID_STATE', 'Only live campaigns can sync ads.', 422);
        }

        $data = $request->validate([
            'platforms' => ['nullable', 'array'],
            'platforms.*' => ['string', Rule::in(PlatformAdsSyncService::PLATFORMS)],
        ]);

        $platforms = $data['platforms'] ?? ($program->auto_ads_platforms ?: PlatformAdsSyncService::PLATFORMS);
        $this->ads->queueForProgram($program, $platforms);
        $results = $this->ads->syncNow($program->fresh(['listing']));

        return $this->success([
            'ad_syncs' => array_values($results),
            'message' => 'Platform ads sync finished.',
        ]);
    }

    private function authorizeEmployerProgram(Request $request, Program $program): void
    {
        $employer = $request->user()->employer;
        if (! $employer || (int) $program->employer_id !== (int) $employer->id) {
            abort(404);
        }
    }
}
