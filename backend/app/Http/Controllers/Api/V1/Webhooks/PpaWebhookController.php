<?php

namespace App\Http\Controllers\Api\V1\Webhooks;

use App\Http\Controllers\Controller;
use App\Services\Programs\PpaApplicationService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PpaWebhookController extends Controller
{
    use ApiResponse;

    public function __construct(private PpaApplicationService $ppa) {}

    public function store(Request $request): JsonResponse
    {
        if (! $this->validSecret($request)) {
            return $this->error('UNAUTHORIZED', 'Invalid webhook secret.', 401);
        }

        $data = $request->validate([
            'token' => ['required', 'string', 'max:64'],
            'external_application_id' => ['required', 'string', 'max:128'],
            'email' => ['nullable', 'email', 'max:255'],
            'meta' => ['nullable', 'array'],
        ]);

        try {
            $result = $this->ppa->recordFromWebhook(
                $data['token'],
                $request,
                $data
            );
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->error('INVALID_TOKEN', 'Tracking token not found.', 404);
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return $this->error('PPA_REJECTED', $e->getMessage(), $e->getStatusCode());
        }

        $application = $result['application'];

        return $this->success([
            'application_id' => $application->id,
            'status' => $application->status,
            'duplicate' => (bool) ($result['duplicate'] ?? false),
        ], ($result['duplicate'] ?? false) ? 200 : 201);
    }

    private function validSecret(Request $request): bool
    {
        $expected = (string) config('joborio.ppa_webhook_secret');
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
