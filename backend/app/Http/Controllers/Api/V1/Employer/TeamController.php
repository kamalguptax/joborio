<?php

namespace App\Http\Controllers\Api\V1\Employer;

use App\Http\Controllers\Controller;
use App\Models\EmployerTeamMember;
use App\Support\ApiResponse;
use App\Support\ResolvesEmployer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TeamController extends Controller
{
    use ApiResponse;
    use ResolvesEmployer;

    public const ROLES = [
        'Owner',
        'Admin',
        'Campaign Manager',
        'Analyst',
        'Finance',
        'Reviewer',
    ];

    public const MATRIX = [
        ['Owner', 'Full', 'Full', 'Full', 'Full', 'Full'],
        ['Admin', 'Full', 'Full', 'Full', 'View', 'Full'],
        ['Campaign Manager', 'Create, edit', 'View', 'Submit', 'None', 'None'],
        ['Analyst', 'View', 'Full', 'View', 'None', 'None'],
        ['Finance', 'View', 'View', 'None', 'Full', 'None'],
        ['Reviewer', 'View', 'View', 'Submit', 'None', 'None'],
    ];

    public function index(Request $request): JsonResponse
    {
        $employer = $this->employerOrFail($request);
        $members = EmployerTeamMember::query()
            ->where('employer_id', $employer->id)
            ->orderBy('id')
            ->get()
            ->map(fn (EmployerTeamMember $m) => $this->serialize($m));

        if ($members->isEmpty() && $request->user()) {
            $owner = EmployerTeamMember::create([
                'employer_id' => $employer->id,
                'name' => $employer->primary_contact ?: $employer->company_name ?: 'Owner',
                'email' => $request->user()->email,
                'role' => 'Owner',
                'status' => 'active',
                'user_id' => $request->user()->id,
                'invited_at' => now(),
            ]);
            $members = collect([$this->serialize($owner)]);
        }

        return $this->success([
            'members' => $members,
            'roles' => self::ROLES,
            'permission_matrix' => self::MATRIX,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $employer = $this->employerOrFail($request);
        $data = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'name' => ['nullable', 'string', 'max:120'],
            'role' => ['required', Rule::in(self::ROLES)],
        ]);

        if ($data['role'] === 'Owner') {
            return $this->error('VALIDATION', 'Owner role cannot be invited.', 422);
        }

        $email = strtolower($data['email']);
        $member = EmployerTeamMember::updateOrCreate(
            [
                'employer_id' => $employer->id,
                'email' => $email,
            ],
            [
                'name' => $data['name'] ?: (explode('@', $email)[0] ?? $email),
                'role' => $data['role'],
                'status' => 'invited',
                'invited_at' => now(),
            ]
        );

        return $this->success(['member' => $this->serialize($member)], 201);
    }

    public function update(Request $request, EmployerTeamMember $member): JsonResponse
    {
        $employer = $this->employerOrFail($request);
        if ((int) $member->employer_id !== (int) $employer->id) {
            return $this->error('NOT_FOUND', 'Member not found.', 404);
        }
        if ($member->role === 'Owner') {
            return $this->error('FORBIDDEN', 'Owner role cannot be changed.', 403);
        }

        $data = $request->validate([
            'role' => ['required', Rule::in(array_values(array_filter(self::ROLES, fn ($r) => $r !== 'Owner')))],
        ]);

        $member->update(['role' => $data['role']]);

        return $this->success(['member' => $this->serialize($member->fresh())]);
    }

    public function destroy(Request $request, EmployerTeamMember $member): JsonResponse
    {
        $employer = $this->employerOrFail($request);
        if ((int) $member->employer_id !== (int) $employer->id) {
            return $this->error('NOT_FOUND', 'Member not found.', 404);
        }
        if ($member->role === 'Owner') {
            return $this->error('FORBIDDEN', 'Owner cannot be removed.', 403);
        }

        $member->delete();

        return $this->success(['deleted' => true]);
    }

    private function serialize(EmployerTeamMember $m): array
    {
        return [
            'id' => $m->id,
            'name' => $m->name,
            'email' => $m->email,
            'role' => $m->role,
            'status' => match (strtolower($m->status)) {
                'active' => 'Active',
                'invited' => 'Invited',
                default => ucfirst($m->status),
            },
            'can_remove' => $m->role !== 'Owner',
        ];
    }
}
