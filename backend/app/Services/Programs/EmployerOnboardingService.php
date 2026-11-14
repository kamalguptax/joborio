<?php

namespace App\Services\Programs;

use App\Models\Employer;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class EmployerOnboardingService
{
    public function register(User $user, array $data): Employer
    {
        if ($user->employer) {
            throw ValidationException::withMessages(['company' => ['Already registered as employer.']]);
        }

        $employer = Employer::create([
            'user_id' => $user->id,
            'company_name' => $data['company_name'],
            'website' => $data['website'] ?? null,
            'country_code' => isset($data['country_code']) ? strtoupper($data['country_code']) : null,
        ]);

        $user->assignRole('employer');

        return $employer;
    }
}
