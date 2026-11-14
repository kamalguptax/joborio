<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('program_ad_syncs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_id')->constrained()->cascadeOnDelete();
            $table->string('platform', 32); // meta | linkedin
            $table->string('status', 32)->default('queued'); // queued|pending_config|syncing|live|failed|paused
            $table->string('external_campaign_id')->nullable();
            $table->string('external_adset_id')->nullable();
            $table->string('external_ad_id')->nullable();
            $table->string('external_account_id')->nullable();
            $table->text('last_error')->nullable();
            $table->json('payload')->nullable();
            $table->json('response')->nullable();
            $table->timestamp('synced_at')->nullable();
            $table->timestamps();

            $table->unique(['program_id', 'platform']);
        });

        Schema::table('programs', function (Blueprint $table) {
            if (! Schema::hasColumn('programs', 'auto_ads_platforms')) {
                $table->json('auto_ads_platforms')->nullable()->after('target_countries');
            }
        });
    }

    public function down(): void
    {
        Schema::table('programs', function (Blueprint $table) {
            if (Schema::hasColumn('programs', 'auto_ads_platforms')) {
                $table->dropColumn('auto_ads_platforms');
            }
        });
        Schema::dropIfExists('program_ad_syncs');
    }
};
