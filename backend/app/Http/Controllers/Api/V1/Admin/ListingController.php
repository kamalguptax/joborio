<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Listing;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ListingController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = Listing::query()->orderByDesc('updated_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('source')) {
            $query->where('source', $request->string('source')->toString());
        }

        $listings = $query->paginate(min((int) $request->input('per_page', 30), 100));

        return $this->success($listings->items(), 200, [
            'current_page' => $listings->currentPage(),
            'last_page' => $listings->lastPage(),
            'total' => $listings->total(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $data['source'] = $data['source'] ?? 'manual';

        $listing = Listing::create($data);
        $listing = app(\App\Services\Listings\ListingGeoService::class)->syncCoordinates($listing);

        return $this->success($listing, 201);
    }

    public function update(Request $request, Listing $listing): JsonResponse
    {
        $listing->update($this->validated($request, partial: true));
        $listing = app(\App\Services\Listings\ListingGeoService::class)->syncCoordinates($listing->fresh());

        return $this->success($listing);
    }

    public function destroy(Listing $listing): JsonResponse
    {
        $listing->update(['status' => 'expired']);

        return $this->success(['message' => 'Listing marked expired.']);
    }

    public function ingestNow(): JsonResponse
    {
        $result = app(\App\Services\Listings\ListingIngestionService::class)->runIngest();
        $creators = app(\App\Services\Listings\ListingIngestionService::class)->refreshAllCreatorFeeds();

        return $this->success([
            'ingest' => $result,
            'creators_refreshed' => $creators,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, bool $partial = false): array
    {
        $rules = [
            'type' => ['sometimes', Rule::in(['job', 'course', 'tool', 'branding', 'other'])],
            'external_id' => ['nullable', 'string', 'max:120'],
            'title' => [$partial ? 'sometimes' : 'required', 'string', 'max:255'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'location_label' => ['nullable', 'string', 'max:255'],
            'country_code' => ['nullable', 'string', 'size:2'],
            'is_remote' => ['boolean'],
            'category' => ['nullable', 'string', 'max:64'],
            'experience_level' => ['nullable', 'string', 'max:64'],
            'salary_min' => ['nullable', 'numeric', 'min:0'],
            'salary_max' => ['nullable', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'destination_url' => [$partial ? 'sometimes' : 'required', 'url', 'max:2048'],
            'source' => ['nullable', 'string', 'max:32'],
            'status' => ['sometimes', Rule::in(['active', 'paused', 'expired', 'budget_exhausted'])],
            'ppc_rate_usd' => ['nullable', 'numeric', 'min:0'],
            'ppr_rate_usd' => ['nullable', 'numeric', 'min:0'],
            'expires_at' => ['nullable', 'date'],
        ];

        return $request->validate($rules);
    }
}
