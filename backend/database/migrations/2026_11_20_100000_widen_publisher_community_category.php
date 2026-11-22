<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('publisher_communities')) {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();
        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE publisher_communities MODIFY category VARCHAR(1000) NULL');
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE publisher_communities ALTER COLUMN category TYPE VARCHAR(1000)');
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('publisher_communities')) {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();
        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE publisher_communities MODIFY category VARCHAR(120) NULL');
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE publisher_communities ALTER COLUMN category TYPE VARCHAR(120)');
        }
    }
};
