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
            if (! Schema::hasColumn('publisher_communities', 'commission_percent')) {
                $table->decimal('commission_percent', 5, 2)->nullable()->after('category');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('publisher_communities')) {
            return;
        }

        Schema::table('publisher_communities', function (Blueprint $table) {
            if (Schema::hasColumn('publisher_communities', 'commission_percent')) {
                $table->dropColumn('commission_percent');
            }
        });
    }
};
