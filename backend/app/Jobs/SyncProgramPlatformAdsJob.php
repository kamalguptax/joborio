<?php

namespace App\Jobs;

use App\Models\Program;
use App\Services\Ads\PlatformAdsSyncService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SyncProgramPlatformAdsJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public int $programId) {}

    public function handle(PlatformAdsSyncService $ads): void
    {
        $program = Program::query()->with('listing')->find($this->programId);
        if (! $program || $program->status !== 'active') {
            return;
        }

        $ads->syncNow($program);
    }
}
