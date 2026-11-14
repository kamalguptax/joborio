<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('programs', function (Blueprint $table) {
            if (! Schema::hasColumn('programs', 'promotion_type')) {
                $table->string('promotion_type', 16)->default('job')->after('pricing_model');
            }
        });

        if (Schema::hasColumn('programs', 'promotion_type') && Schema::hasColumn('listings', 'type')) {
            $rows = DB::table('programs')
                ->join('listings', 'listings.id', '=', 'programs.listing_id')
                ->select('programs.id', 'listings.type')
                ->get();

            foreach ($rows as $row) {
                $type = in_array($row->type, ['job', 'course', 'tool', 'branding', 'other'], true)
                    ? $row->type
                    : 'job';
                DB::table('programs')->where('id', $row->id)->update(['promotion_type' => $type]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('programs', function (Blueprint $table) {
            if (Schema::hasColumn('programs', 'promotion_type')) {
                $table->dropColumn('promotion_type');
            }
        });
    }
};
