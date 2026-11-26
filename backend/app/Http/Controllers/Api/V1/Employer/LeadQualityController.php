<?php

namespace App\Http\Controllers\Api\V1\Employer;

use App\Http\Controllers\Controller;
use App\Models\PpaApplication;
use App\Models\Program;
use App\Services\Disputes\AttributionDisputeService;
use App\Support\ApiResponse;
use App\Support\ResolvesEmployer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeadQualityController extends Controller
{
    use ApiResponse;
    use ResolvesEmployer;

    public function __construct(private AttributionDisputeService $disputes) {}

    public function index(Request $request): JsonResponse
    {
        $employer = $this->employerOrFail($request);
        $programIds = Program::query()
            ->where('employer_id', $employer->id)
            ->pluck('id');

        $status = $request->query('status');
        $q = trim((string) $request->query('q', ''));

        $query = PpaApplication::query()
            ->whereIn('program_id', $programIds)
            ->with(['program:id,title,rate_usd', 'attributionEvent'])
            ->latest();

        if ($status && $status !== 'all') {
            $mapped = $this->mapFilterStatus($status);
            if ($mapped) {
                $query->whereIn('status', $mapped);
            }
        }

        if ($q !== '') {
            $query->where(function ($inner) use ($q) {
                $inner->where('id', $q)
                    ->orWhere('email', 'like', "%{$q}%")
                    ->orWhere('external_application_id', 'like', "%{$q}%");
            });
        }

        $rows = $query->limit(200)->get()->map(fn (PpaApplication $a) => $this->serialize($a));

        $all = PpaApplication::query()->whereIn('program_id', $programIds)->get();
        $stats = [
            ['l' => 'Received', 'v' => $all->whereIn('status', ['pending_employer', 'pending'])->count()],
            ['l' => 'Verified', 'v' => $all->where('status', 'verified')->count()],
            ['l' => 'Approved', 'v' => $all->whereIn('status', ['confirmed', 'approved'])->count()],
            ['l' => 'Rejected', 'v' => $all->whereIn('status', ['rejected', 'employer_rejected'])->count()],
            ['l' => 'Billable', 'v' => $all->whereIn('status', ['confirmed', 'approved'])->count()],
            ['l' => 'Total', 'v' => $all->count()],
        ];

        return $this->success([
            'stats' => $stats,
            'leads' => $rows,
        ]);
    }

    public function dispute(Request $request, PpaApplication $application): JsonResponse
    {
        $employer = $this->employerOrFail($request);
        $program = Program::query()->find($application->program_id);
        if (! $program || (int) $program->employer_id !== (int) $employer->id) {
            return $this->error('NOT_FOUND', 'Lead not found.', 404);
        }

        $data = $request->validate([
            'reason' => ['required', 'string', 'min:3', 'max:2000'],
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

    private function serialize(PpaApplication $a): array
    {
        $uiStatus = match ($a->status) {
            'confirmed', 'approved' => 'Approved',
            'rejected', 'employer_rejected' => 'Rejected',
            'verified' => 'Verified',
            default => 'Received',
        };

        $billable = in_array($a->status, ['confirmed', 'approved'], true);
        $rate = (float) ($a->program?->rate_usd ?? 0);

        return [
            'id' => 'LD-'.$a->id,
            'numeric_id' => $a->id,
            'camp' => $a->program_id ? 'JO-C-'.$a->program_id : '—',
            'campaign_title' => $a->program?->title,
            'ev' => $a->meta['event'] ?? 'application',
            'ts' => optional($a->created_at)->format('d M H:i'),
            'clk' => $a->external_application_id ?: ('clk_'.$a->tracking_token_id),
            'src' => $a->meta['source'] ?? 'Partner · masked',
            'ver' => $a->employer_confirmed_at ? 'Confirmed' : ($uiStatus === 'Received' ? 'Pending' : 'Verified'),
            'elig' => $uiStatus === 'Rejected' ? 'Not eligible' : ($uiStatus === 'Received' ? 'Pending' : 'Eligible'),
            'status' => $uiStatus,
            'reason' => $a->meta['reject_reason'] ?? '—',
            'amt' => $billable ? round($rate, 2) : null,
            'can_dispute' => in_array($uiStatus, ['Approved', 'Rejected'], true),
            'program_id' => $a->program_id,
        ];
    }

    private function mapFilterStatus(string $status): ?array
    {
        return match (strtolower($status)) {
            'approved' => ['confirmed', 'approved'],
            'rejected' => ['rejected', 'employer_rejected'],
            'verified' => ['verified'],
            'received' => ['pending_employer', 'pending'],
            default => null,
        };
    }
}
