<?php

namespace App\Http\Controllers\Api\V1\Employer;

use App\Http\Controllers\Controller;
use App\Models\PostPromoteSubmission;
use App\Models\Program;
use App\Services\Programs\PostPromoteService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostPromoteReviewController extends Controller
{
    use ApiResponse;

    public function __construct(private PostPromoteService $promote) {}

    public function index(Request $request, Program $program): JsonResponse
    {
        $this->authorizeEmployerProgram($request, $program);

        $rows = PostPromoteSubmission::query()
            ->where('program_id', $program->id)
            ->with('creator:id,handle,user_id')
            ->latest()
            ->get();

        return $this->success(['submissions' => $rows]);
    }

    public function approve(Request $request, Program $program, PostPromoteSubmission $submission): JsonResponse
    {
        $this->authorizeEmployerProgram($request, $program);
        $data = $request->validate(['review_note' => ['nullable', 'string', 'max:2000']]);
        $row = $this->promote->approve($program, $submission, $data['review_note'] ?? null);

        return $this->success(['submission' => $row]);
    }

    public function reject(Request $request, Program $program, PostPromoteSubmission $submission): JsonResponse
    {
        $this->authorizeEmployerProgram($request, $program);
        $data = $request->validate(['review_note' => ['nullable', 'string', 'max:2000']]);
        $row = $this->promote->reject($program, $submission, $data['review_note'] ?? null);

        return $this->success(['submission' => $row]);
    }

    private function authorizeEmployerProgram(Request $request, Program $program): void
    {
        $employer = $request->user()->employer;
        if (! $employer || (int) $program->employer_id !== (int) $employer->id) {
            abort(404);
        }
    }
}
