<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\Platform\PlatformSettingsService;
use App\Support\ApiResponse;
use App\Support\MoneyCurrencies;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PlatformSettingsController extends Controller
{
    use ApiResponse;

    public function show(PlatformSettingsService $settings): JsonResponse
    {
        return $this->success($settings->adminView());
    }

    public function update(Request $request, PlatformSettingsService $settings): JsonResponse
    {
        $data = $request->validate([
            'maps' => ['sometimes', 'array'],
            'maps.google_maps_enabled' => ['sometimes', 'boolean'],
            'maps.geolocation_tracking' => ['sometimes', 'boolean'],
            'maps.google_maps_api_key' => ['nullable', 'string', 'max:500'],
            'maps.google_maps_browser_api_key' => ['nullable', 'string', 'max:500'],
            'general' => ['sometimes', 'array'],
            'general.frontend_url' => ['nullable', 'url', 'max:500'],
            'referral' => ['sometimes', 'array'],
            'referral.bonus_usd' => ['sometimes', 'numeric', 'min:0', 'max:100000'],
            'referral.bonus_threshold_usd' => ['sometimes', 'numeric', 'min:0', 'max:100000'],
            'referral.override_percent' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'referral.override_months' => ['sometimes', 'integer', 'min:0', 'max:36'],
            'payout' => ['sometimes', 'array'],
            'payout.platform_fee_percent' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'payout.min_payout_usd' => ['sometimes', 'numeric', 'min:0', 'max:100000'],
            'payout.ppc_rate_usd' => ['sometimes', 'numeric', 'min:0', 'max:100000'],
            'payout.ppr_rate_usd' => ['sometimes', 'numeric', 'min:0', 'max:100000'],
            'payout.ppa_rate_usd' => ['sometimes', 'numeric', 'min:0', 'max:100000'],
            'payout.ppc_hold_days' => ['sometimes', 'integer', 'min:0', 'max:365'],
            'payout.ppc_hold_days_higher' => ['sometimes', 'integer', 'min:0', 'max:365'],
            'payout.ppr_hold_days' => ['sometimes', 'integer', 'min:0', 'max:365'],
            'payout.ppa_hold_days' => ['sometimes', 'integer', 'min:0', 'max:365'],
            'payout.currency' => ['sometimes', 'string', Rule::in(array_keys(MoneyCurrencies::OPTIONS))],
            'integrations' => ['sometimes', 'array'],
            'integrations.openai_api_key' => ['nullable', 'string', 'max:500'],
        ]);

        $settings->updateFromAdmin($data);

        return $this->success($settings->adminView());
    }
}
