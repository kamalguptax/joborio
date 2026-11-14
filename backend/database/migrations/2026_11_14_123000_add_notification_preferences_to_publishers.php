<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('publishers', function (Blueprint $table) {
            if (! Schema::hasColumn('publishers', 'notification_preferences')) {
                $table->json('notification_preferences')->nullable()->after('review_notes');
            }
        });
    }

    public function down(): void
    {
        Schema::table('publishers', function (Blueprint $table) {
            if (Schema::hasColumn('publishers', 'notification_preferences')) {
                $table->dropColumn('notification_preferences');
            }
        });
    }
};
