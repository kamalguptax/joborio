<?php

namespace App\Jobs;

use App\Services\Ppr\PprRegistrationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ExpireUnverifiedPprJob implements ShouldQueue
{
    use Queueable;

    public function handle(PprRegistrationService $ppr): void
    {
        $ppr->expireStalePending();
    }
}
