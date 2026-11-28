<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\FeedbackSubmission;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class FeedbackController extends Controller
{
    use ApiResponse;

    /** Public "Share feedback" form. Works for guests and signed-in users. */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(['suggestion', 'bug', 'compliment', 'other'])],
            'rating' => ['nullable', 'integer', 'between:1,5'],
            'message' => ['required', 'string', 'min:10', 'max:3000'],
            'name' => ['nullable', 'string', 'max:120'],
            'email' => ['nullable', 'email', 'max:190'],
            'page_url' => ['nullable', 'string', 'max:500'],
            // Honeypot: real users never fill this hidden field.
            'website' => ['nullable', 'string', 'max:255'],
        ]);

        if (filled($data['website'] ?? null)) {
            return $this->success(['received' => true], 201);
        }

        $user = $request->user('sanctum');

        FeedbackSubmission::create([
            'user_id' => $user?->id,
            'type' => $data['type'],
            'rating' => $data['rating'] ?? null,
            'message' => trim($data['message']),
            'name' => isset($data['name']) ? trim($data['name']) : null,
            'email' => isset($data['email']) ? trim($data['email']) : ($user->email ?? null),
            'page_url' => $data['page_url'] ?? null,
            'ip_address' => $request->ip(),
            'user_agent' => Str::limit((string) $request->userAgent(), 250, ''),
        ]);

        return $this->success(['received' => true], 201);
    }
}
