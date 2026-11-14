<?php

namespace App\Services\Ads;

use App\Jobs\SyncProgramPlatformAdsJob;
use App\Models\Program;
use App\Models\ProgramAdSync;
use Illuminate\Support\Facades\Schema;

class PlatformAdsSyncService
{
    public const PLATFORMS = ['meta', 'linkedin'];

    /**
     * Queue auto-ads for selected platforms when a program goes live.
     *
     * @param  list<string>|null  $platforms
     */
    public function queueForProgram(Program $program, ?array $platforms = null): void
    {
        if (! Schema::hasTable('program_ad_syncs')) {
            return;
        }

        $selected = $platforms;
        if ($selected === null) {
            $selected = Schema::hasColumn('programs', 'auto_ads_platforms')
                ? ($program->auto_ads_platforms ?? [])
                : [];
        }

        $selected = array_values(array_intersect(self::PLATFORMS, array_map('strtolower', $selected)));
        if ($selected === []) {
            return;
        }

        if (Schema::hasColumn('programs', 'auto_ads_platforms')) {
            $program->forceFill(['auto_ads_platforms' => $selected])->saveQuietly();
        }

        foreach ($selected as $platform) {
            ProgramAdSync::query()->updateOrCreate(
                ['program_id' => $program->id, 'platform' => $platform],
                ['status' => 'queued', 'last_error' => null],
            );
        }

        SyncProgramPlatformAdsJob::dispatch($program->id);
    }

    public function syncNow(Program $program): array
    {
        $results = [];
        $rows = ProgramAdSync::query()
            ->where('program_id', $program->id)
            ->whereIn('platform', self::PLATFORMS)
            ->get();

        foreach ($rows as $row) {
            $results[$row->platform] = $this->syncPlatform($program, $row);
        }

        return $results;
    }

    public function syncPlatform(Program $program, ProgramAdSync $row): ProgramAdSync
    {
        $row->update(['status' => 'syncing', 'last_error' => null]);

        try {
            $driver = match ($row->platform) {
                'meta' => app(MetaAdsService::class),
                'linkedin' => app(LinkedInAdsService::class),
                default => throw new \InvalidArgumentException('Unsupported platform'),
            };

            if (! $driver->isConfigured()) {
                $row->update([
                    'status' => 'pending_config',
                    'last_error' => $driver->missingConfigMessage(),
                ]);

                return $row->fresh();
            }

            $result = $driver->createOrUpdateCampaign($program);

            $row->update([
                'status' => 'live',
                'external_campaign_id' => $result['campaign_id'] ?? null,
                'external_adset_id' => $result['adset_id'] ?? null,
                'external_ad_id' => $result['ad_id'] ?? null,
                'external_account_id' => $result['account_id'] ?? null,
                'payload' => $result['payload'] ?? null,
                'response' => $result['response'] ?? null,
                'synced_at' => now(),
                'last_error' => null,
            ]);
        } catch (\Throwable $e) {
            $row->update([
                'status' => 'failed',
                'last_error' => $e->getMessage(),
            ]);
        }

        return $row->fresh();
    }
}
