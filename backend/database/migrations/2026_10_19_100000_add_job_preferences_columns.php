<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('creators', function (Blueprint $table) {
            $table->boolean('prefer_remote')->default(false)->after('audience_countries');
        });

        Schema::table('employers', function (Blueprint $table) {
            $table->json('job_preferences')->nullable()->after('country_code');
        });
    }

    public function down(): void
    {
        Schema::table('creators', function (Blueprint $table) {
            $table->dropColumn('prefer_remote');
        });

        Schema::table('employers', function (Blueprint $table) {
            $table->dropColumn('job_preferences');
        });
    }
};
