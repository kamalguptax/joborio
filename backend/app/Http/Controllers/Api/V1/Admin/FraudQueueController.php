<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\FraudReview;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FraudQueueController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $items = FraudReview::with(['event', 'creator:id,handle'])
            ->where('status', 'open')
            ->latest()
            ->paginate(30);

        return $this->success($items->items(), 200, [
            'current_page' => $items->currentPage(),
            'last_page' => $items->lastPage(),
            'total' => $items->total(),
        ]);
    }

    public function resolve(Request $request, FraudReview $fraudReview): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:resolved,dismissed'],
            'admin_notes' => ['nullable', 'string'],
        ]);

        $fraudReview->update([
            'status' => $data['status'],
            'admin_notes' => $data['admin_notes'] ?? null,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return $this->success($fraudReview->fresh());
    }
}
