<?php

use App\Jobs\EvaluateTrustTiersJob;
use App\Jobs\ExpireUnverifiedPprJob;
use App\Jobs\IngestListingsJob;
use App\Jobs\ProcessEarningHoldsJob;
use App\Jobs\ProcessReferralRewardsJob;
use App\Jobs\RunAutoPayoutBatchJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::job(new ProcessEarningHoldsJob)->hourly();
Schedule::job(new ProcessReferralRewardsJob)->hourly();
Schedule::job(new ExpireUnverifiedPprJob)->hourly();
Schedule::job(new EvaluateTrustTiersJob)->daily();

if (config('joborio.auto_payout_enabled', true)) {
    Schedule::job(new RunAutoPayoutBatchJob)->weeklyOn(1, '06:00');
}

if (config('joborio.listings_ingest_enabled', true)) {
    Schedule::job(new IngestListingsJob)->everyTwoHours();
}
