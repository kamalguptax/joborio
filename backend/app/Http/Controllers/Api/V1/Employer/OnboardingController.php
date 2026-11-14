<?php

namespace App\Http\Controllers\Api\V1\Employer;

use App\Http\Controllers\Controller;
use App\Services\Programs\EmployerOnboardingService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OnboardingController extends Controller
{
    use ApiResponse;

    public function __construct(private EmployerOnboardingService $onboarding) {}

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'company_name' => ['required', 'string', 'max:255'],
            'website' => ['nullable', 'url', 'max:500'],
            'country_code' => ['nullable', 'string', 'size:2'],
        ]);

        $employer = $this->onboarding->register($request->user(), $data);

        return $this->success(['employer' => $employer], 201);
    }

    public function show(Request $request): JsonResponse
    {
        $employer = $request->user()->employer;
        if (! $employer) {
            return $this->error('NOT_AN_EMPLOYER', 'Complete employer registration first.', 404);
        }

        return $this->success([
            'employer' => $employer,
            'can_go_live' => $employer->canGoLive(),
            'billing_missing' => $employer->billingMissing(),
        ]);
    }
}
