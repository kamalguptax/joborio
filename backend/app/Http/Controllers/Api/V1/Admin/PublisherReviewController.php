<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Publisher;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublisherReviewController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status');
        $query = Publisher::query()->latest();
        if (is_string($status) && $status !== '' && $status !== 'all') {
            $query->where('status', $status);
        }

        $rows = $query->limit(100)->get()->map(fn (Publisher $p) => [
            'id' => $p->id,
            'code' => $p->code,
            'username' => $p->username,
            'display_name' => $p->display_name,
            'country_code' => $p->country_code,
            'network_type' => $p->network_type,
            'status' => $p->status,
            'status_label' => $p->statusLabel(),
            'created_at' => optional($p->created_at)?->toIso8601String(),
        ]);

        return $this->success(['publishers' => $rows]);
    }

    public function activate(Publisher $publisher): JsonResponse
    {
        $publisher->update([
            'status' => Publisher::STATUS_ACTIVATED,
            'activated_at' => now(),
            'commercial_approved_at' => $publisher->commercial_approved_at ?? now(),
            'social_reviewed_at' => $publisher->social_reviewed_at ?? now(),
        ]);

        return $this->success([
            'publisher' => [
                'id' => $publisher->id,
                'status' => $publisher->status,
                'status_label' => $publisher->statusLabel(),
                'activated_at' => optional($publisher->activated_at)?->toIso8601String(),
            ],
        ]);
    }
}
