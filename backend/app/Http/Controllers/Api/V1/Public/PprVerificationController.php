<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\PprRegistration;
use App\Services\Ppr\PprRegistrationService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PprVerificationController extends Controller
{
    use ApiResponse;

    public function __construct(private PprRegistrationService $ppr) {}

    public function verify(Request $request, PprRegistration $pprRegistration): JsonResponse|RedirectResponse
    {
        $request->validate([
            'token' => ['required', 'string', 'min:32'],
        ]);

        try {
            $registration = $this->ppr->verify($pprRegistration, $request->string('token')->toString());
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            if ($request->boolean('browser')) {
                $frontend = rtrim((string) config('joborio.frontend_url'), '/');

                return redirect()->away(
                    $frontend.'/verify/ppr?status=error&message='.urlencode($e->getMessage())
                );
            }

            return $this->error('VERIFY_FAILED', $e->getMessage(), $e->getStatusCode());
        }

        if ($request->boolean('browser')) {
            $frontend = rtrim((string) config('joborio.frontend_url'), '/');

            return redirect()->away($frontend.'/verify/ppr?status=verified');
        }

        return $this->success([
            'registration_id' => $registration->id,
            'status' => $registration->status,
            'earning' => $registration->earningLedger,
        ]);
    }
}
