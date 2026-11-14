<?php

namespace App\Jobs;

use App\Services\Creators\TrustTierService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class EvaluateTrustTiersJob implements ShouldQueue
{
    use Queueable;

    public function handle(TrustTierService $trustTiers): void
    {
        $trustTiers->evaluateAllCreators();
    }
}
