<?php

namespace App\Http\Controllers\Api\V1\Creator;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Services\Programs\PostPromoteService;
use App\Support\ApiResponse;
use App\Support\CampaignTypes;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PostPromoteController extends Controller
{
    use ApiResponse;

    public function __construct(private PostPromoteService $promote) {}

    public function store(Request $request, Program $program): JsonResponse
    {
        $creator = $request->user()->creator;
        if (! $creator) {
            return $this->error('NOT_A_CREATOR', 'Complete creator registration first.', 404);
        }

        $data = $request->validate([
            'actions_done' => ['required', 'array', 'min:1'],
            'actions_done.*' => ['string', Rule::in(CampaignTypes::ENGAGEMENT_ACTIONS)],
            'proof_url' => ['nullable', 'url', 'max:2000'],
            'proof_note' => ['nullable', 'string', 'max:2000'],
        ]);

        $row = $this->promote->submit($creator, $program, $data);

        return $this->success(['submission' => $row], 201);
    }
}
