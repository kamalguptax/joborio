<?php

namespace App\Jobs;

use App\Services\Payouts\PayoutBatchService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class RunAutoPayoutBatchJob implements ShouldQueue
{
    use Queueable;

    public function handle(PayoutBatchService $payouts): void
    {
        $payouts->runScheduledAutoBatch();
    }
}
