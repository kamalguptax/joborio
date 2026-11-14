<?php

namespace App\Http\Controllers\Api\V1\Employer;

use App\Http\Controllers\Controller;
use App\Models\PpaApplication;
use App\Models\Program;
use App\Services\Disputes\AttributionDisputeService;
use App\Services\Programs\PpaApplicationService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PpaApplicationController extends Controller
{
    use ApiResponse;

    public function __construct(
        private PpaApplicationService $ppa,
        private AttributionDisputeService $disputes,
    ) {}

    public function index(Request $request, Program $program): JsonResponse
    {
        $this->authorizeEmployerProgram($request, $program);

        $applications = PpaApplication::query()
            ->where('program_id', $program->id)
            ->with(['creator.user', 'listing'])
            ->latest()
            ->paginate(25);

        return $this->success($applications->items(), 200, [
            'current_page' => $applications->currentPage(),
            'last_page' => $applications->lastPage(),
            'total' => $applications->total(),
        ]);
    }

    public function confirm(Request $request, Program $program, PpaApplication $application): JsonResponse
    {
        $this->authorizeEmployerProgram($request, $program);

        try {
            $application = $this->ppa->confirmByEmployer($application, $program);
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return $this->error('PPA_REJECTED', $e->getMessage(), $e->getStatusCode());
        }

        return $this->success(['application' => $application]);
    }

    public function reject(Request $request, Program $program, PpaApplication $application): JsonResponse
    {
        $this->authorizeEmployerProgram($request, $program);

        try {
            $application = $this->ppa->rejectByEmployer($application, $program);
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return $this->error('PPA_REJECTED', $e->getMessage(), $e->getStatusCode());
        }

        return $this->success(['application' => $application]);
    }

    public function dispute(Request $request, Program $program, PpaApplication $application): JsonResponse
    {
        $this->authorizeEmployerProgram($request, $program);

        if ((int) $application->program_id !== (int) $program->id) {
            abort(404);
        }

        $data = $request->validate([
            'reason' => ['required', 'string', 'min:10', 'max:2000'],
        ]);

        try {
            $dispute = $this->disputes->openForPpaApplication(
                $application,
                $program,
                $request->user(),
                $data['reason'],
            );
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return $this->error('DISPUTE_FAILED', $e->getMessage(), $e->getStatusCode());
        }

        return $this->success(['dispute' => $dispute], 201);
    }

    private function authorizeEmployerProgram(Request $request, Program $program): void
    {
        $employer = $request->user()->employer;
        if (! $employer || (int) $program->employer_id !== (int) $employer->id) {
            abort(404);
        }
    }
}
