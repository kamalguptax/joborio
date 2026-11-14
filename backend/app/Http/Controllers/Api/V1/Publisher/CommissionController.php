<?php

namespace App\Http\Controllers\Api\V1\Publisher;

use App\Http\Controllers\Controller;
use App\Models\PublisherCommission;
use App\Support\ApiResponse;
use App\Support\PublisherAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CommissionController extends Controller
{
    use ApiResponse;

    /** Permitted publisher commission percentages (product-constrained). */
    public const PERMITTED = [10, 15, 20, 25, 30];

    public function show(Request $request): JsonResponse
    {
        PublisherAccess::assertFinancialAccess($request->user());
        $publisher = PublisherAccess::publisher($request->user());

        $active = PublisherCommission::query()
            ->where('publisher_id', $publisher->id)
            ->where('status', 'active')
            ->orderByDesc('version')
            ->first();

        return $this->success([
            'permitted_percentages' => self::PERMITTED,
            'note' => 'JobOrio platform fee is never distributed to the publisher.',
            'commission' => $active ? [
                'commission_percent' => $active->commission_percent,
                'currency' => $active->currency,
                'version' => $active->version,
                'status' => $active->status,
                'effective_from' => optional($active->effective_from)?->toIso8601String(),
            ] : null,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        PublisherAccess::assertFinancialAccess($request->user());
        $publisher = PublisherAccess::publisher($request->user());

        $data = $request->validate([
            'commission_percent' => ['required', 'numeric', Rule::in(self::PERMITTED)],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $latestVersion = (int) PublisherCommission::query()
            ->where('publisher_id', $publisher->id)
            ->max('version');

        PublisherCommission::query()
            ->where('publisher_id', $publisher->id)
            ->where('status', 'active')
            ->update([
                'status' => 'superseded',
                'effective_to' => now(),
            ]);

        $row = PublisherCommission::create([
            'publisher_id' => $publisher->id,
            'commission_percent' => $data['commission_percent'],
            'currency' => 'USD',
            'status' => 'active',
            'version' => $latestVersion + 1,
            'effective_from' => now(),
            'approved_by_user_id' => $request->user()->id,
            'notes' => $data['notes'] ?? null,
        ]);

        return $this->success([
            'commission' => [
                'commission_percent' => $row->commission_percent,
                'currency' => $row->currency,
                'version' => $row->version,
                'status' => $row->status,
                'effective_from' => optional($row->effective_from)?->toIso8601String(),
            ],
            'permitted_percentages' => self::PERMITTED,
            'message' => 'Commercial commission updated. Platform fee remains with JobOrio.',
        ]);
    }
}
