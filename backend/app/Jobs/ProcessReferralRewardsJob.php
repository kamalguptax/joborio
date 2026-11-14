<?php

namespace App\Jobs;

use App\Services\Referrals\ReferralService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ProcessReferralRewardsJob implements ShouldQueue
{
    use Queueable;

    public function handle(ReferralService $referrals): void
    {
        $referrals->processRecentlyApproved();
    }
}
