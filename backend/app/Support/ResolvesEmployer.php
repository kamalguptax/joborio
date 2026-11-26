<?php

namespace App\Support;

use App\Models\Employer;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

trait ResolvesEmployer
{
    protected function employerOrFail(Request $request): Employer
    {
        $employer = $request->user()?->employer;
        if (! $employer) {
            throw new HttpException(404, 'Complete employer registration first.');
        }

        return $employer;
    }
}
