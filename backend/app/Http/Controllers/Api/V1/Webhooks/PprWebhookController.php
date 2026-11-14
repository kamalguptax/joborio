<?php

namespace App\Http\Controllers\Api\V1\Webhooks;

use App\Http\Controllers\Controller;
use App\Services\Ppr\PprRegistrationService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PprWebhookController extends Controller
{
    use ApiResponse;

    public function __construct(private PprRegistrationService $ppr) {}

    public function store(Request $request): JsonResponse
    {
        if (! $this->validSecret($request)) {
            return $this->error('UNAUTHORIZED', 'Invalid webhook secret.', 401);
        }

        $data = $request->validate([
            'token' => ['required', 'string', 'max:64'],
            'email' => ['required', 'email', 'max:255'],
            'meta' => ['nullable', 'array'],
        ]);

        try {
            $result = $this->ppr->recordFromWebhook(
                $data['token'],
                $data['email'],
                $request,
                $data['meta'] ?? []
            );
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->error('INVALID_TOKEN', 'Tracking token not found.', 404);
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return $this->error('PPR_REJECTED', $e->getMessage(), $e->getStatusCode());
        }

        $registration = $result['registration'];

        return $this->success([
            'registration_id' => $registration->id,
            'status' => $registration->status,
            'duplicate' => (bool) ($result['duplicate'] ?? false),
            'verification_url' => $result['verification_url'] ?? null,
        ], ($result['duplicate'] ?? false) ? 200 : 201);
    }

    private function validSecret(Request $request): bool
    {
        $expected = (string) config('joborio.ppr_webhook_secret');
        if ($expected === '') {
            return false;
        }

        $header = $request->header('X-Joborio-Webhook-Secret');
        if ($header && hash_equals($expected, $header)) {
            return true;
        }

        $auth = $request->header('Authorization');
        if ($auth && str_starts_with($auth, 'Bearer ')) {
            return hash_equals($expected, substr($auth, 7));
        }

        return false;
    }
}
