<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('creators', function (Blueprint $table) {
            if (! Schema::hasColumn('creators', 'opportunity_categories')) {
                $table->json('opportunity_categories')->nullable()->after('promote_job_types');
            }
            if (! Schema::hasColumn('creators', 'opportunity_targeting')) {
                $table->json('opportunity_targeting')->nullable()->after('opportunity_categories');
            }
            if (! Schema::hasColumn('creators', 'opportunity_preferences')) {
                $table->json('opportunity_preferences')->nullable()->after('opportunity_targeting');
            }
        });
    }

    public function down(): void
    {
        Schema::table('creators', function (Blueprint $table) {
            foreach (['opportunity_preferences', 'opportunity_targeting', 'opportunity_categories'] as $col) {
                if (Schema::hasColumn('creators', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
