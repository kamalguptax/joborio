<?php

namespace App\Http\Controllers\Api\V1\Employer;

use App\Http\Controllers\Controller;
use App\Models\EmployerContentComplaint;
use App\Models\Program;
use App\Support\ApiResponse;
use App\Support\ResolvesEmployer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ContentComplaintController extends Controller
{
    use ApiResponse;
    use ResolvesEmployer;

    public function index(Request $request): JsonResponse
    {
        $employer = $this->employerOrFail($request);
        $rows = EmployerContentComplaint::query()
            ->where('employer_id', $employer->id)
            ->with('program:id,title')
            ->latest()
            ->get()
            ->map(fn (EmployerContentComplaint $c) => $this->serialize($c));

        $stats = [
            ['l' => 'Open', 'v' => $rows->where('status', 'Open')->count()],
            ['l' => 'Investigating', 'v' => $rows->where('status', 'Investigating')->count()],
            ['l' => 'Resolved', 'v' => $rows->where('status', 'Resolved')->count()],
            ['l' => 'Closed', 'v' => $rows->where('status', 'Closed')->count()],
            ['l' => 'Total', 'v' => $rows->count()],
        ];

        return $this->success(['stats' => $stats, 'complaints' => $rows]);
    }

    public function store(Request $request): JsonResponse
    {
        $employer = $this->employerOrFail($request);
        $data = $request->validate([
            'campaign_id' => ['required', 'integer', 'exists:programs,id'],
            'campaign_ref' => ['nullable', 'string', 'max:64'],
            'platform' => ['required', 'string', 'max:64'],
            'post_url' => ['required', 'url', 'max:2000'],
            'category' => ['required', 'string', 'max:120'],
            'urgency' => ['nullable', Rule::in(['Low', 'Normal', 'High', 'Critical'])],
            'description' => ['required', 'string', 'max:5000'],
            'additional_urls' => ['nullable', 'string', 'max:5000'],
            'evidence' => ['nullable', 'array'],
            'evidence.*' => ['string', 'max:64'],
            'seen_on' => ['required', 'date'],
        ]);

        $program = Program::query()
            ->where('id', $data['campaign_id'])
            ->where('employer_id', $employer->id)
            ->first();
        if (! $program) {
            return $this->error('NOT_FOUND', 'Campaign not found.', 404);
        }

        $code = 'CMP-'.(1000 + EmployerContentComplaint::query()->count() + random_int(1, 99));
        $payload = [
            'employer_id' => $employer->id,
            'program_id' => $program->id,
            'code' => $code,
            'campaign_ref' => $data['campaign_ref'] ?? ('JO-C-'.$program->id),
            'platform' => $data['platform'],
            'post_url' => $data['post_url'],
            'category' => $data['category'],
            'description' => $data['description'],
            'seen_on' => $data['seen_on'],
            'status' => 'open',
            'outcome' => null,
            'timeline' => [
                ['text' => 'Complaint received and queued', 'at' => now()->toIso8601String()],
            ],
        ];

        if (Schema::hasColumn('employer_content_complaints', 'urgency')) {
            $payload['urgency'] = $data['urgency'] ?? 'Normal';
        }
        if (Schema::hasColumn('employer_content_complaints', 'additional_urls')) {
            $payload['additional_urls'] = $data['additional_urls'] ?? null;
        }
        if (Schema::hasColumn('employer_content_complaints', 'evidence')) {
            $payload['evidence'] = $data['evidence'] ?? [];
        }

        $complaint = EmployerContentComplaint::create($payload);
        $complaint->load('program:id,title');

        return $this->success(['complaint' => $this->serialize($complaint)], 201);
    }

    public function show(Request $request, EmployerContentComplaint $complaint): JsonResponse
    {
        $employer = $this->employerOrFail($request);
        if ((int) $complaint->employer_id !== (int) $employer->id) {
            return $this->error('NOT_FOUND', 'Complaint not found.', 404);
        }

        return $this->success(['complaint' => $this->serialize($complaint->loadMissing('program:id,title'))]);
    }

    private function serialize(EmployerContentComplaint $c): array
    {
        $status = Str::title(str_replace('_', ' ', $c->status));
        $evidence = is_array($c->evidence) ? $c->evidence : [];
        $evidenceLabel = $evidence === []
            ? 'None'
            : implode(', ', $evidence);

        return [
            'id' => $c->code,
            'numeric_id' => $c->id,
            'camp' => $c->campaign_ref ?: ($c->program_id ? 'JO-C-'.$c->program_id : '—'),
            'camp_name' => $c->program?->title,
            'plat' => $c->platform,
            'cat' => $c->category,
            'urgency' => $c->urgency ?: 'Normal',
            'date' => optional($c->seen_on)->format('d M Y') ?: optional($c->created_at)->format('d M Y'),
            'status' => $status,
            'upd' => optional($c->updated_at)->format('d M'),
            'outcome' => $c->outcome ?: '—',
            'post_url' => $c->post_url,
            'description' => $c->description,
            'additional_urls' => $c->additional_urls,
            'evidence' => $evidence,
            'evidence_label' => $evidenceLabel,
            'timeline' => $c->timeline ?? [],
        ];
    }
}
