<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('programs', function (Blueprint $table) {
            if (! Schema::hasColumn('programs', 'lead_type')) {
                $table->string('lead_type', 32)->nullable()->after('pricing_model');
            }
            if (! Schema::hasColumn('programs', 'required_fields')) {
                $table->json('required_fields')->nullable()->after('lead_type');
            }
            if (! Schema::hasColumn('programs', 'qualification_rules')) {
                $table->text('qualification_rules')->nullable()->after('required_fields');
            }
            if (! Schema::hasColumn('programs', 'auto_pause_on_budget')) {
                $table->boolean('auto_pause_on_budget')->default(true)->after('budget_spent_usd');
            }
        });
    }

    public function down(): void
    {
        Schema::table('programs', function (Blueprint $table) {
            foreach (['lead_type', 'required_fields', 'qualification_rules', 'auto_pause_on_budget'] as $col) {
                if (Schema::hasColumn('programs', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
