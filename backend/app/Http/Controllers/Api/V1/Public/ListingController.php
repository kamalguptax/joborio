<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\Listing;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ListingController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = Listing::query()->active();

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('country_code')) {
            $query->where('country_code', strtoupper($request->string('country_code')->toString()));
        }

        if ($request->filled('category')) {
            $query->where('category', strtolower($request->string('category')->toString()));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->string('type')->toString());
        }

        if ($request->has('is_remote')) {
            $query->where('is_remote', $request->boolean('is_remote'));
        }

        if ($request->filled('experience_level')) {
            $query->where('experience_level', $request->string('experience_level')->toString());
        }

        $listings = $query->orderByDesc('updated_at')->paginate(
            min((int) $request->input('per_page', 20), 50)
        );

        return $this->success($listings->items(), 200, [
            'current_page' => $listings->currentPage(),
            'last_page' => $listings->lastPage(),
            'per_page' => $listings->perPage(),
            'total' => $listings->total(),
        ]);
    }

    public function show(Listing $listing): JsonResponse
    {
        if ($listing->status !== 'active') {
            return $this->error('NOT_FOUND', 'Listing is not available.', 404);
        }

        return $this->success($listing);
    }
}
