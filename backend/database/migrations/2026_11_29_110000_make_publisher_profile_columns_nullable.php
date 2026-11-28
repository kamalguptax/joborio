<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Publisher sign-up now only asks for name, username, email and password.
 * Country, network type, niches, job preferences and social/website links are
 * collected later in onboarding, so these columns can be empty until then.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('publishers', function (Blueprint $table) {
            $table->string('country_code', 2)->nullable()->change();
            $table->string('network_type', 32)->nullable()->change();
            $table->string('social_url', 500)->nullable()->change();
            $table->string('website_url', 500)->nullable()->change();
        });
    }

    public function down(): void
    {
        DB::table('publishers')->whereNull('country_code')->update(['country_code' => 'IN']);
        DB::table('publishers')->whereNull('network_type')->update(['network_type' => 'publisher']);
        DB::table('publishers')->whereNull('social_url')->update(['social_url' => '']);
        DB::table('publishers')->whereNull('website_url')->update(['website_url' => '']);

        Schema::table('publishers', function (Blueprint $table) {
            $table->string('country_code', 2)->nullable(false)->change();
            $table->string('network_type', 32)->nullable(false)->change();
            $table->string('social_url', 500)->nullable(false)->change();
            $table->string('website_url', 500)->nullable(false)->change();
        });
    }
};
