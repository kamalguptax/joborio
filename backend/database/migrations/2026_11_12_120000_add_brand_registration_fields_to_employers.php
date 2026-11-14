<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employers', function (Blueprint $table) {
            if (! Schema::hasColumn('employers', 'trading_name')) {
                $table->string('trading_name')->nullable()->after('company_name');
            }
            if (! Schema::hasColumn('employers', 'entity_region')) {
                $table->string('entity_region', 32)->nullable()->after('country_code');
            }
            if (! Schema::hasColumn('employers', 'pan_number')) {
                $table->string('pan_number', 20)->nullable()->after('gst_number');
            }
            if (! Schema::hasColumn('employers', 'tax_id')) {
                $table->string('tax_id', 64)->nullable()->after('pan_number');
            }
        });
    }

    public function down(): void
    {
        Schema::table('employers', function (Blueprint $table) {
            foreach (['trading_name', 'entity_region', 'pan_number', 'tax_id'] as $col) {
                if (Schema::hasColumn('employers', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
