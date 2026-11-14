<?php

namespace App\Jobs;

use App\Services\Earnings\EarningLedgerService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ProcessEarningHoldsJob implements ShouldQueue
{
    use Queueable;

    public function handle(EarningLedgerService $earnings): void
    {
        $earnings->approveDuePending();
    }
}
