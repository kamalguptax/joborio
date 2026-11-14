<?php

namespace App\Jobs;

use App\Services\Listings\ListingIngestionService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class IngestListingsJob implements ShouldQueue
{
    use Queueable;

    public function handle(ListingIngestionService $ingestion): void
    {
        $result = $ingestion->runIngest();
        Log::info('Listings ingest completed', $result);

        RefreshCreatorFeedsJob::dispatch();
    }
}
