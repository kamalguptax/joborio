<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('publisher_communities')) {
            return;
        }

        Schema::table('publisher_communities', function (Blueprint $table) {
            if (! Schema::hasColumn('publisher_communities', 'xml_job_refs')) {
                $table->json('xml_job_refs')->nullable()->after('campaign_access');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('publisher_communities')) {
            return;
        }

        Schema::table('publisher_communities', function (Blueprint $table) {
            if (Schema::hasColumn('publisher_communities', 'xml_job_refs')) {
                $table->dropColumn('xml_job_refs');
            }
        });
    }
};
