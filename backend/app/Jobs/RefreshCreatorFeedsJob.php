<?php

namespace App\Jobs;

use App\Services\Listings\ListingIngestionService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class RefreshCreatorFeedsJob implements ShouldQueue
{
    use Queueable;

    public function handle(ListingIngestionService $ingestion): void
    {
        $creators = $ingestion->refreshAllCreatorFeeds();
        Log::info('Creator feeds refreshed', ['creators' => $creators]);
    }
}
