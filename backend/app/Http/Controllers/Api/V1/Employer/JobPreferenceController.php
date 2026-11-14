<?php

namespace App\Http\Controllers\Api\V1\Employer;

use App\Http\Controllers\Controller;
use App\Services\Listings\JobPreferenceMatchingService;
use App\Support\ApiResponse;
use App\Support\PromoteJobTypes;
use Illuminate\Validation\Rule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JobPreferenceController extends Controller
{
    use ApiResponse;

    public function __construct(private JobPreferenceMatchingService $matching) {}

    public function show(Request $request): JsonResponse
    {
        $employer = $request->user()->employer;
        if (! $employer) {
            return $this->error('NOT_AN_EMPLOYER', 'Complete employer registration first.', 404);
        }

        return $this->success($this->normalizePreferences($employer->job_preferences));
    }

    public function update(Request $request): JsonResponse
    {
        $employer = $request->user()->employer;
        if (! $employer) {
            return $this->error('NOT_AN_EMPLOYER', 'Complete employer registration first.', 404);
        }

        $data = $request->validate([
            'niche_ids' => ['required', 'array', 'min:1'],
            'niche_ids.*' => ['integer', 'exists:niches,id'],
            'countries' => ['array'],
            'countries.*' => ['string', 'size:2'],
            'remote_only' => ['sometimes', 'boolean'],
            'job_types' => ['sometimes', 'array'],
            'job_types.*' => ['string', Rule::in(PromoteJobTypes::IDS)],
        ]);

        $current = $this->normalizePreferences($employer->job_preferences);
        $employer->job_preferences = [
            'niche_ids' => $data['niche_ids'],
            'countries' => $data['countries'] ?? [],
            'remote_only' => $request->boolean('remote_only'),
            'job_types' => PromoteJobTypes::clean($data['job_types'] ?? $current['job_types']),
        ];
        $employer->save();

        return $this->success($this->normalizePreferences($employer->job_preferences));
    }

    public function preferredJobs(Request $request): JsonResponse
    {
        $employer = $request->user()->employer;
        if (! $employer) {
            return $this->error('NOT_AN_EMPLOYER', 'Complete employer registration first.', 404);
        }

        $prefs = $this->normalizePreferences($employer->job_preferences);
        $jobs = $this->matching->preferredListings(
            $prefs['niche_ids'],
            $prefs['countries'],
            $prefs['remote_only'],
            24,
        );

        return $this->success($jobs);
    }

    /**
     * @param  array<string, mixed>|null  $raw
     * @return array{niche_ids: list<int>, countries: list<string>, remote_only: bool, job_types: list<string>}
     */
    private function normalizePreferences(?array $raw): array
    {
        $raw ??= [];

        return [
            'niche_ids' => array_values(array_map('intval', $raw['niche_ids'] ?? [])),
            'countries' => array_values($raw['countries'] ?? []),
            'remote_only' => (bool) ($raw['remote_only'] ?? false),
            'job_types' => PromoteJobTypes::clean($raw['job_types'] ?? []),
        ];
    }
}
