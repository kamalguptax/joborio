<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Employer;
use App\Models\Program;
use App\Models\User;
use App\Services\Programs\ProgramService;
use App\Support\ApiResponse;
use App\Support\CampaignTypes;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class ProgramController extends Controller
{
    use ApiResponse;

    public function __construct(private ProgramService $programs) {}

    public function index(Request $request): JsonResponse
    {
        $query = Program::query()
            ->with(['employer', 'listing'])
            ->latest();

        if (
            Schema::hasColumn('programs', 'promotion_type')
            && $request->filled('promotion_type')
            && CampaignTypes::isValid($request->string('promotion_type')->toString())
        ) {
            $query->where('promotion_type', $request->string('promotion_type')->toString());
        }

        $items = $query->paginate(50);

        return $this->success($items->items(), 200, [
            'current_page' => $items->currentPage(),
            'last_page' => $items->lastPage(),
            'total' => $items->total(),
            'promotion_types' => CampaignTypes::LABELS,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'destination_url' => ['required', 'url', 'max:2000'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'promotion_type' => ['required', Rule::in(CampaignTypes::IDS)],
            'pricing_model' => ['required', 'in:ppc,ppr,ppa,ppe'],
            'rate_usd' => ['required', 'numeric', 'min:0'],
            'budget_total_usd' => ['required', 'numeric', 'min:0'],
            'trial_without_ip' => ['sometimes', 'boolean'],
            'target_niche_ids' => ['nullable', 'array'],
            'target_niche_ids.*' => ['integer', 'exists:niches,id'],
            'target_countries' => ['nullable', 'array'],
            'target_countries.*' => ['string', 'size:2'],
            'country_code' => ['nullable', 'string', 'size:2'],
            'is_remote' => ['nullable', 'boolean'],
            'category' => ['nullable', 'string', 'max:120'],
            'post_url' => ['nullable', 'url', 'max:2000'],
            'engagement_actions' => ['nullable', 'array'],
            'engagement_actions.*' => ['string', Rule::in(CampaignTypes::ENGAGEMENT_ACTIONS)],
            'engage_brief' => ['nullable', 'string', 'max:2000'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
            'lead_type' => ['nullable', Rule::in(CampaignTypes::LEAD_TYPES)],
            'required_fields' => ['nullable', 'array'],
            'required_fields.*' => ['string', Rule::in(CampaignTypes::REQUIRED_FIELD_OPTIONS)],
            'qualification_rules' => ['nullable', 'string', 'max:5000'],
            'auto_pause_on_budget' => ['sometimes', 'boolean'],
        ]);

        if (($data['promotion_type'] ?? null) === 'post_promote' || ($data['pricing_model'] ?? null) === 'ppe') {
            if (empty($data['post_url'])) {
                return $this->error('VALIDATION', 'Post promote (PPE) campaigns need the social post URL.', 422);
            }
            $data['pricing_model'] = 'ppe';
            $data['promotion_type'] = 'post_promote';
            $data['engagement_actions'] = $data['engagement_actions'] ?? CampaignTypes::ENGAGEMENT_ACTIONS;
        }

        if ($scheduleError = $this->scheduleValidationError($data['pricing_model'] ?? null, $data)) {
            return $this->error('VALIDATION', $scheduleError, 422);
        }

        $isTrial = (bool) ($data['trial_without_ip'] ?? false);
        if (! $isTrial && (float) $data['budget_total_usd'] < 10) {
            return $this->error('VALIDATION', 'Budget must be at least 10 for paid campaigns.', 422);
        }
        if (! $isTrial && (float) $data['rate_usd'] < 0.01) {
            return $this->error('VALIDATION', 'Rate must be at least 0.01 for paid campaigns.', 422);
        }

        $data['source'] = 'manual';
        $data['force_active'] = true;
        $data['skip_billing_gate'] = true;

        $program = $this->programs->create($this->platformEmployer($request->user()), $data);

        return $this->success(['program' => $program], 201);
    }

    public function show(Program $program): JsonResponse
    {
        return $this->success([
            'program' => $program->load(['listing', 'employer']),
        ]);
    }

    public function update(Request $request, Program $program): JsonResponse
    {
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'destination_url' => ['sometimes', 'url', 'max:2000'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'promotion_type' => ['sometimes', Rule::in(CampaignTypes::IDS)],
            'pricing_model' => ['sometimes', 'in:ppc,ppr,ppa,ppe'],
            'rate_usd' => ['sometimes', 'numeric', 'min:0'],
            'budget_total_usd' => ['sometimes', 'numeric', 'min:0'],
            'trial_without_ip' => ['sometimes', 'boolean'],
            'target_niche_ids' => ['nullable', 'array'],
            'target_niche_ids.*' => ['integer', 'exists:niches,id'],
            'target_countries' => ['nullable', 'array'],
            'target_countries.*' => ['string', 'size:2'],
            'country_code' => ['nullable', 'string', 'size:2'],
            'is_remote' => ['nullable', 'boolean'],
            'category' => ['nullable', 'string', 'max:120'],
            'post_url' => ['nullable', 'url', 'max:2000'],
            'engagement_actions' => ['nullable', 'array'],
            'engagement_actions.*' => ['string', Rule::in(CampaignTypes::ENGAGEMENT_ACTIONS)],
            'engage_brief' => ['nullable', 'string', 'max:2000'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
            'lead_type' => ['nullable', Rule::in(CampaignTypes::LEAD_TYPES)],
            'required_fields' => ['nullable', 'array'],
            'required_fields.*' => ['string', Rule::in(CampaignTypes::REQUIRED_FIELD_OPTIONS)],
            'qualification_rules' => ['nullable', 'string', 'max:5000'],
            'auto_pause_on_budget' => ['sometimes', 'boolean'],
        ]);

        $promo = $data['promotion_type'] ?? $program->promotion_type;
        $pricing = $data['pricing_model'] ?? $program->pricing_model;
        if ($promo === 'post_promote' || $pricing === 'ppe') {
            $postUrl = $data['post_url'] ?? $program->post_url;
            if (empty($postUrl)) {
                return $this->error('VALIDATION', 'Post promote (PPE) campaigns need the social post URL.', 422);
            }
            $data['pricing_model'] = 'ppe';
            $data['promotion_type'] = 'post_promote';
            $data['post_url'] = $postUrl;
        }

        $schedulePayload = [
            'starts_at' => array_key_exists('starts_at', $data) ? $data['starts_at'] : $program->starts_at,
            'ends_at' => array_key_exists('ends_at', $data) ? $data['ends_at'] : $program->ends_at,
        ];
        if ($scheduleError = $this->scheduleValidationError($pricing, $schedulePayload)) {
            return $this->error('VALIDATION', $scheduleError, 422);
        }

        $isTrial = array_key_exists('trial_without_ip', $data)
            ? (bool) $data['trial_without_ip']
            : $program->isTrialWithoutIp();
        $budget = (float) ($data['budget_total_usd'] ?? $program->budget_total_usd);
        $rate = (float) ($data['rate_usd'] ?? $program->rate_usd);
        if (! $isTrial && $budget < 10) {
            return $this->error('VALIDATION', 'Budget must be at least 10 for paid campaigns.', 422);
        }
        if (! $isTrial && $rate < 0.01) {
            return $this->error('VALIDATION', 'Rate must be at least 0.01 for paid campaigns.', 422);
        }

        return $this->success([
            'program' => $this->programs->update($program, $data),
        ]);
    }

    private function scheduleValidationError(?string $pricingModel, array $data): ?string
    {
        if (! in_array((string) $pricingModel, ['ppc', 'ppr', 'ppa', 'ppe'], true)) {
            return null;
        }

        if (empty($data['starts_at']) || empty($data['ends_at'])) {
            return 'Campaigns need a start date and end date.';
        }

        if (strtotime((string) $data['ends_at']) <= strtotime((string) $data['starts_at'])) {
            return 'End date must be after the start date.';
        }

        return null;
    }

    public function exportLeads(Request $request, Program $program): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $format = strtolower($request->string('format', 'csv')->toString());
        if (! in_array($format, ['csv', 'xlsx', 'excel'], true)) {
            $format = 'csv';
        }

        $filename = 'campaign-'.$program->id.'-leads-'.now()->format('Ymd-His').'.csv';

        $rows = [];
        $rows[] = [
            'type', 'id', 'status', 'email', 'name', 'phone', 'creator_handle',
            'external_id', 'created_at', 'meta',
        ];

        $ppa = \App\Models\PpaApplication::query()
            ->where('program_id', $program->id)
            ->with(['creator:id,handle'])
            ->orderBy('id')
            ->get();

        foreach ($ppa as $app) {
            $meta = is_array($app->meta) ? $app->meta : [];
            $rows[] = [
                'application',
                $app->id,
                $app->status,
                $app->email ?? ($meta['email'] ?? ''),
                $meta['name'] ?? '',
                $meta['phone'] ?? '',
                $app->creator?->handle ?? '',
                $app->external_application_id ?? '',
                optional($app->created_at)?->toDateTimeString() ?? '',
                json_encode($meta),
            ];
        }

        if ($program->listing_id) {
            $regs = \App\Models\PprRegistration::query()
                ->where('listing_id', $program->listing_id)
                ->with(['creator:id,handle'])
                ->orderBy('id')
                ->get();
            foreach ($regs as $reg) {
                $meta = is_array($reg->meta) ? $reg->meta : [];
                $rows[] = [
                    'signup',
                    $reg->id,
                    $reg->status,
                    $reg->email ?? ($meta['email'] ?? ''),
                    $meta['name'] ?? '',
                    $meta['phone'] ?? '',
                    $reg->creator?->handle ?? '',
                    '',
                    optional($reg->created_at)?->toDateTimeString() ?? '',
                    json_encode($meta),
                ];
            }
        }

        return response()->streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            foreach ($rows as $row) {
                fputcsv($out, $row);
            }
            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    private function platformEmployer(User $admin): Employer
    {
        $existing = Employer::query()
            ->whereIn('company_name', ['Upclift Platform', 'JobOrio Platform'])
            ->first();
        if ($existing) {
            return $existing;
        }

        if ($admin->employer) {
            return $admin->employer;
        }

        $any = Employer::query()->first();
        if ($any) {
            return $any;
        }

        return Employer::create([
            'user_id' => $admin->id,
            'company_name' => 'Upclift Platform',
            'website' => 'https://joborio.com',
            'country_code' => 'IN',
        ]);
    }

    public function activate(Program $program): JsonResponse
    {
        if (! in_array($program->status, ['pending_review', 'paused', 'budget_exhausted'], true)) {
            return $this->error('INVALID_STATE', 'Program cannot be activated.', 422);
        }

        if ($program->status === 'budget_exhausted' && $program->budgetRemaining() <= 0) {
            return $this->error(
                'BUDGET_EXHAUSTED',
                'Add budget before reactivating this campaign.',
                422,
            );
        }

        return $this->success(['program' => $this->programs->activate($program)]);
    }

    public function pause(Program $program): JsonResponse
    {
        if (! in_array($program->status, ['active', 'budget_exhausted'], true)) {
            return $this->error('INVALID_STATE', 'Only active programs can be paused.', 422);
        }

        return $this->success(['program' => $this->programs->pause($program)]);
    }
}
