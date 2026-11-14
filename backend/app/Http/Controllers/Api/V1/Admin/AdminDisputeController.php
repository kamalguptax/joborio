<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AttributionDispute;
use App\Models\EarningLedger;
use App\Services\Notifications\UserNotificationService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDisputeController extends Controller
{
    use ApiResponse;

    public function __construct(private UserNotificationService $notifications) {}

    public function index(): JsonResponse
    {
        $items = AttributionDispute::query()
            ->with(['creator:id,handle', 'opener:id,name,email'])
            ->latest()
            ->paginate(30);

        return $this->success($items->items(), 200, [
            'current_page' => $items->currentPage(),
            'last_page' => $items->lastPage(),
            'total' => $items->total(),
        ]);
    }

    public function resolve(Request $request, AttributionDispute $attributionDispute): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:upheld,rejected'],
            'admin_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        if ($attributionDispute->status !== 'open') {
            return $this->error('ALREADY_CLOSED', 'Dispute already resolved.', 422);
        }

        DB::transaction(function () use ($attributionDispute, $data, $request) {
            $attributionDispute->update([
                'status' => $data['status'],
                'admin_notes' => $data['admin_notes'] ?? null,
                'resolved_by_user_id' => $request->user()->id,
                'resolved_at' => now(),
            ]);

            $application = $attributionDispute->ppaApplication;
            if ($application) {
                if ($data['status'] === 'upheld') {
                    $application->update(['status' => 'rejected']);
                    if ($application->earning_ledger_id) {
                        EarningLedger::query()
                            ->where('id', $application->earning_ledger_id)
                            ->whereIn('state', ['pending', 'approved', 'payable'])
                            ->update(['state' => 'reversed']);
                    }
                } else {
                    $application->update(['status' => 'confirmed']);
                }
            }
        });

        $creator = $attributionDispute->creator;
        if ($creator?->user) {
            $this->notifications->notify(
                $creator->user,
                'dispute_resolved',
                'Dispute '.$data['status'],
                'An attribution dispute was '.$data['status'].'.',
                ['dispute_id' => $attributionDispute->id],
            );
        }

        return $this->success($attributionDispute->fresh(['creator', 'opener']));
    }
}
