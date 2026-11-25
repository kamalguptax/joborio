<?php

namespace App\Jobs;

use App\Services\Publishers\CommunityXmlFeedSyncService;
use App\Services\Syndication\JobrapidoFeedService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncCommunityXmlFeedsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(
        JobrapidoFeedService $feeds,
        CommunityXmlFeedSyncService $communityFeeds,
    ): void {
        // Refresh live syndication cache, then rebuild each community's job list
        // from its niche / category selection.
        $feeds->clearCache();
        $feeds->loadFeed();
        $result = $communityFeeds->syncAllCommunities();

        Log::info('joborio.community_xml_feed_sync', $result);
    }
}
