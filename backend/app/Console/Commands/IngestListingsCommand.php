<?php

namespace App\Console\Commands;

use App\Services\Listings\ListingIngestionService;
use Illuminate\Console\Command;

class IngestListingsCommand extends Command
{
    protected $signature = 'listings:ingest {--sync-feeds : Refresh creator page feeds after ingest}';

    protected $description = 'Import jobs/courses from configured feed (Module C)';

    public function handle(ListingIngestionService $ingestion): int
    {
        $result = $ingestion->runIngest();
        $this->info("Imported: {$result['imported']}, expired: {$result['expired']}");

        if ($this->option('sync-feeds')) {
            $creators = $ingestion->refreshAllCreatorFeeds();
            $this->info("Refreshed feeds for {$creators} creators.");
        }

        return self::SUCCESS;
    }
}
