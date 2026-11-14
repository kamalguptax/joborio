<?php

namespace App\Http\Controllers\Api\V1\Creator;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Services\Programs\CreatorProgramService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProgramController extends Controller
{
    use ApiResponse;

    public function __construct(private CreatorProgramService $programs) {}

    public function index(Request $request): JsonResponse
    {
        $creator = $request->user()->creator;
        if (! $creator) {
            return $this->error('NOT_A_CREATOR', 'Complete creator registration first.', 404);
        }

        $available = $this->programs->availableFor($creator);
        $joined = $creator->programs()
            ->wherePivot('status', 'active')
            ->with(['listing', 'employer'])
            ->get();
        $campaigns = $available->concat($joined)->unique('id')->values();
        $joinedIds = $joined->pluck('id');

        return $this->success([
            'campaigns' => $campaigns->map(fn (Program $p) => [
                'program' => $p,
                'joined' => $joinedIds->contains($p->id),
            ]),
        ]);
    }

    public function optIn(Request $request, Program $program): JsonResponse
    {
        $creator = $request->user()->creator;
        if (! $creator) {
            return $this->error('NOT_A_CREATOR', 'Complete creator registration first.', 404);
        }

        $this->programs->optIn($creator, $program);

        return $this->success(['joined' => true], 201);
    }

    public function optOut(Request $request, Program $program): JsonResponse
    {
        $creator = $request->user()->creator;
        if (! $creator) {
            return $this->error('NOT_A_CREATOR', 'Complete creator registration first.', 404);
        }

        $this->programs->optOut($creator, $program);

        return $this->success(['joined' => false]);
    }
}
