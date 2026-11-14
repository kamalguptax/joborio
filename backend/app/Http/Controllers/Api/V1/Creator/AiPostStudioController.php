<?php

namespace App\Http\Controllers\Api\V1\Creator;

use App\Http\Controllers\Controller;
use App\Models\Listing;
use App\Services\AiStudio\AiPostStudioService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiPostStudioController extends Controller
{
    use ApiResponse;

    public function __construct(private AiPostStudioService $studio) {}

    public function quota(Request $request): JsonResponse
    {
        $creator = $request->user()->creator;
        if (! $creator) {
            return $this->error('NOT_A_CREATOR', 'Creator profile not found.', 404);
        }

        return $this->success($this->studio->quota($creator));
    }

    public function generate(Request $request): JsonResponse
    {
        $creator = $request->user()->creator;
        if (! $creator) {
            return $this->error('NOT_A_CREATOR', 'Creator profile not found.', 404);
        }

        $data = $request->validate([
            'listing_id' => ['required', 'integer', 'exists:listings,id'],
            'platform' => ['required', 'string', 'max:24'],
        ]);

        $listing = Listing::findOrFail($data['listing_id']);

        $result = $this->studio->generate($creator, $listing, $data['platform']);

        return $this->success($result, 201);
    }
}
