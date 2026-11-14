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
            'pricing_model' => ['required', 'in:ppc,ppr,ppa'],
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
        ]);

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

    private function platformEmployer(User $admin): Employer
    {
        $existing = Employer::query()
            ->where('company_name', 'JobOrio Platform')
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
            'company_name' => 'JobOrio Platform',
            'website' => 'https://joborio.com',
            'country_code' => 'IN',
        ]);
    }

    public function activate(Program $program): JsonResponse
    {
        if (! in_array($program->status, ['pending_review', 'paused'], true)) {
            return $this->error('INVALID_STATE', 'Program cannot be activated.', 422);
        }

        return $this->success(['program' => $this->programs->activate($program)]);
    }

    public function pause(Program $program): JsonResponse
    {
        if ($program->status !== 'active') {
            return $this->error('INVALID_STATE', 'Only active programs can be paused.', 422);
        }

        return $this->success(['program' => $this->programs->pause($program)]);
    }
}
