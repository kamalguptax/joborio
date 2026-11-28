<?php

namespace App\Http\Controllers\Api\V1\Publisher;

use App\Http\Controllers\Controller;
use App\Models\PublisherCommission;
use App\Support\ApiResponse;
use App\Support\PublisherAccess;
use App\Support\PublisherCommissionSplit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CommissionController extends Controller
{
    use ApiResponse;

    public function show(Request $request): JsonResponse
    {
        PublisherAccess::assertFinancialAccess($request->user());
        $publisher = PublisherAccess::publisher($request->user());

        $active = PublisherCommission::query()
            ->where('publisher_id', $publisher->id)
            ->where('status', 'active')
            ->orderByDesc('version')
            ->first();

        $publisherPct = $active
            ? (float) $active->commission_percent
            : PublisherCommissionSplit::PUBLISHER_MIN_PERCENT;

        return $this->success([
            'permitted_percentages' => PublisherCommissionSplit::permittedPublisherPercents(),
            'platform_fee_percent' => PublisherCommissionSplit::PLATFORM_FEE_PERCENT,
            'note' => 'Upclift keeps a 30% platform fee. The remaining 70% is the creator pool. Your commission is 10–15% of that pool; creators receive the rest.',
            'example_split' => PublisherCommissionSplit::split(10, $publisherPct),
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
            'commission_percent' => [
                'required',
                'numeric',
                Rule::in(PublisherCommissionSplit::permittedPublisherPercents()),
            ],
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
            'permitted_percentages' => PublisherCommissionSplit::permittedPublisherPercents(),
            'platform_fee_percent' => PublisherCommissionSplit::PLATFORM_FEE_PERCENT,
            'example_split' => PublisherCommissionSplit::split(10, (float) $row->commission_percent),
            'message' => 'Publisher commission updated (10–15% of the creator pool after Upclift’s 30% fee).',
        ]);
    }
}
