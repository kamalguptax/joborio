<?php

namespace App\Http\Controllers\Api\V1\Creator;

use App\Http\Controllers\Controller;
use App\Services\Creators\TrustTierService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrustTierController extends Controller
{
    use ApiResponse;

    public function show(Request $request, TrustTierService $tiers): JsonResponse
    {
        $creator = $request->user()->creator;
        if (! $creator) {
            return $this->error('NOT_A_CREATOR', 'Creator profile not found.', 404);
        }

        return $this->success([
            'current_tier' => $creator->trust_tier,
            'updated_at' => $creator->trust_tier_updated_at,
            'metrics' => $tiers->metrics($creator),
            'tiers' => [
                'nano' => [
                    'label' => 'Nano',
                    'ppc' => true,
                    'ppr' => false,
                    'ppa' => false,
                    'auto_payout' => false,
                ],
                'micro' => [
                    'label' => 'Micro',
                    'ppc' => true,
                    'ppr' => true,
                    'ppa' => false,
                    'auto_payout' => false,
                    'requirements' => '1,000 verified clicks · 30 active days',
                ],
                'mid' => [
                    'label' => 'Mid',
                    'ppc' => true,
                    'ppr' => true,
                    'ppa' => true,
                    'auto_payout' => true,
                    'requirements' => '5,000 clicks · 60 active days · <5% invalid rate',
                ],
                'macro' => [
                    'label' => 'Macro',
                    'ppc' => true,
                    'ppr' => true,
                    'ppa' => true,
                    'auto_payout' => true,
                    'requirements' => 'Top performers (manual / volume)',
                ],
            ],
        ]);
    }
}
