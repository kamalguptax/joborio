<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('listings', function (Blueprint $table) {
            $table->decimal('latitude', 10, 7)->nullable()->after('location_label');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->string('geo_place_id', 128)->nullable()->after('longitude');
        });

        Schema::table('attribution_events', function (Blueprint $table) {
            $table->decimal('latitude', 10, 7)->nullable()->after('geo_country');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->string('geo_city', 120)->nullable()->after('longitude');
        });

        Schema::table('website_tracking_events', function (Blueprint $table) {
            $table->decimal('latitude', 10, 7)->nullable()->after('geo_country');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
        });
    }

    public function down(): void
    {
        Schema::table('listings', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude', 'geo_place_id']);
        });

        Schema::table('attribution_events', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude', 'geo_city']);
        });

        Schema::table('website_tracking_events', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude']);
        });
    }
};
