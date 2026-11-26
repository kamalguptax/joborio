<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('programs', function (Blueprint $table) {
            if (! Schema::hasColumn('programs', 'brand_category')) {
                $table->string('brand_category', 64)->nullable()->after('promotion_type');
            }
            if (! Schema::hasColumn('programs', 'conversion_model_code')) {
                $table->string('conversion_model_code', 16)->nullable()->after('pricing_model');
            }
            if (! Schema::hasColumn('programs', 'currency')) {
                $table->string('currency', 8)->nullable()->after('rate_usd');
            }
            if (! Schema::hasColumn('programs', 'daily_budget_usd')) {
                $table->decimal('daily_budget_usd', 12, 2)->nullable()->after('budget_total_usd');
            }
            if (! Schema::hasColumn('programs', 'wizard_payload')) {
                $table->json('wizard_payload')->nullable()->after('qualification_rules');
            }
        });
    }

    public function down(): void
    {
        Schema::table('programs', function (Blueprint $table) {
            foreach ([
                'brand_category',
                'conversion_model_code',
                'currency',
                'daily_budget_usd',
                'wizard_payload',
            ] as $col) {
                if (Schema::hasColumn('programs', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
