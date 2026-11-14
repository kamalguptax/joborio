<?php

namespace App\Http\Controllers\Api\V1\Creator;

use App\Http\Controllers\Controller;
use App\Models\PprRegistration;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PprRegistrationController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $creator = $request->user()->creator;
        if (! $creator) {
            return $this->error('NOT_A_CREATOR', 'Creator profile not found.', 404);
        }

        $status = $request->string('status')->toString();
        $programId = $request->integer('program_id');
        $listingId = $request->integer('listing_id');

        $query = PprRegistration::query()
            ->where('creator_id', $creator->id)
            ->with(['listing:id,title,company_name,program_id', 'earningLedger:id,net_usd,state'])
            ->latest();

        if ($status !== '' && in_array($status, ['pending_verification', 'verified', 'rejected'], true)) {
            $query->where('status', $status);
        }

        if ($listingId > 0) {
            $query->where('listing_id', $listingId);
        }

        if ($programId > 0) {
            $query->whereHas('listing', fn ($q) => $q->where('program_id', $programId));
        }

        $page = $query->paginate(20);

        $items = collect($page->items())->map(function (PprRegistration $row) {
            return [
                'id' => $row->id,
                'email_masked' => $this->maskEmail($row->email),
                'status' => $row->status,
                'listing' => $row->listing,
                'email_verified_at' => $row->email_verified_at,
                'earning' => $row->earningLedger,
                'created_at' => $row->created_at,
            ];
        });

        return $this->success($items->all(), 200, [
            'current_page' => $page->currentPage(),
            'last_page' => $page->lastPage(),
            'total' => $page->total(),
        ]);
    }

    private function maskEmail(string $email): string
    {
        $email = Str::lower(trim($email));
        if (! str_contains($email, '@')) {
            return '***';
        }

        [$local, $domain] = explode('@', $email, 2);
        $visible = max(1, min(2, strlen($local)));
        $maskedLocal = substr($local, 0, $visible).str_repeat('*', max(1, strlen($local) - $visible));

        return $maskedLocal.'@'.$domain;
    }
}
