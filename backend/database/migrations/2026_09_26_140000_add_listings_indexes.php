<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('listings', function (Blueprint $table) {
            $table->unique(['source', 'external_id'], 'listings_source_external_unique');
            $table->index(['status', 'country_code']);
            $table->index(['category', 'type']);
        });
    }

    public function down(): void
    {
        Schema::table('listings', function (Blueprint $table) {
            $table->dropUnique('listings_source_external_unique');
            $table->dropIndex(['status', 'country_code']);
            $table->dropIndex(['category', 'type']);
        });
    }
};
