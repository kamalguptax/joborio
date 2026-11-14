<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('syndication_feeds', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('feed_url');
            $table->string('format', 32)->default('jobrapido');
            $table->string('job_xpath', 128)->default('//job');
            $table->string('country_code', 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('use_sample_when_empty')->default(true);
            $table->string('sample_path')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamp('last_fetched_at')->nullable();
            $table->unsignedInteger('last_job_count')->default(0);
            $table->text('last_error')->nullable();
            $table->string('last_publisher')->nullable();
            $table->string('last_build_date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('syndication_feeds');
    }
};
