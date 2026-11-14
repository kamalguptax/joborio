<?php

namespace App\Console\Commands;

use App\Services\Earnings\EarningLedgerService;
use Illuminate\Console\Command;

class ReleaseEarningHoldsCommand extends Command
{
    protected $signature = 'joborio:release-earning-holds';

    protected $description = 'Move pending earnings past hold_until to approved (same as hourly job)';

    public function handle(EarningLedgerService $earnings): int
    {
        $count = $earnings->approveDuePending();
        $this->info("Approved {$count} earning row(s).");

        return self::SUCCESS;
    }
}
