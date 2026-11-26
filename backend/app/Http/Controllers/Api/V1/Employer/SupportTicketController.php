<?php

namespace App\Http\Controllers\Api\V1\Employer;

use App\Http\Controllers\Controller;
use App\Models\EmployerSupportTicket;
use App\Models\EmployerSupportTicketEvent;
use App\Support\ApiResponse;
use App\Support\ResolvesEmployer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SupportTicketController extends Controller
{
    use ApiResponse;
    use ResolvesEmployer;

    public function index(Request $request): JsonResponse
    {
        $employer = $this->employerOrFail($request);
        $tickets = EmployerSupportTicket::query()
            ->where('employer_id', $employer->id)
            ->with('events')
            ->latest()
            ->get()
            ->map(fn (EmployerSupportTicket $t) => $this->serialize($t));

        return $this->success(['tickets' => $tickets]);
    }

    public function store(Request $request): JsonResponse
    {
        $employer = $this->employerOrFail($request);
        $data = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:64'],
            'priority' => ['required', Rule::in(['Low', 'Normal', 'High', 'low', 'normal', 'high'])],
            'description' => ['required', 'string', 'max:5000'],
        ]);

        $code = 'TK-'.(3200 + EmployerSupportTicket::query()->count() + random_int(1, 50));
        $ticket = EmployerSupportTicket::create([
            'employer_id' => $employer->id,
            'code' => $code,
            'subject' => $data['subject'],
            'category' => $data['category'],
            'priority' => ucfirst(strtolower($data['priority'])),
            'status' => 'open',
            'description' => $data['description'],
        ]);

        EmployerSupportTicketEvent::create([
            'employer_support_ticket_id' => $ticket->id,
            'message' => 'Ticket opened by brand',
            'actor' => 'brand',
        ]);
        EmployerSupportTicketEvent::create([
            'employer_support_ticket_id' => $ticket->id,
            'message' => 'Queued for JobOrio triage',
            'actor' => 'system',
        ]);

        return $this->success(['ticket' => $this->serialize($ticket->load('events'))], 201);
    }

    public function show(Request $request, EmployerSupportTicket $ticket): JsonResponse
    {
        $employer = $this->employerOrFail($request);
        if ((int) $ticket->employer_id !== (int) $employer->id) {
            return $this->error('NOT_FOUND', 'Ticket not found.', 404);
        }

        return $this->success(['ticket' => $this->serialize($ticket->load('events'))]);
    }

    private function serialize(EmployerSupportTicket $t): array
    {
        $status = match (strtolower($t->status)) {
            'open' => 'Open',
            'in_progress' => 'In Progress',
            'waiting_for_brand' => 'Waiting for Brand',
            'resolved' => 'Resolved',
            'closed' => 'Closed',
            default => ucfirst(str_replace('_', ' ', $t->status)),
        };

        return [
            'id' => $t->code,
            'numeric_id' => $t->id,
            'subj' => $t->subject,
            'cat' => $t->category,
            'pri' => $t->priority,
            'status' => $status,
            'description' => $t->description,
            'timeline' => $t->events->map(fn ($e) => [
                'text' => $e->message,
                'at' => optional($e->created_at)->format('d M, H:i'),
                'actor' => $e->actor,
            ])->values(),
        ];
    }
}
