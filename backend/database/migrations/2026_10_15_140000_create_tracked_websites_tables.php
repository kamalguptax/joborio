<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tracked_websites', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('domain', 255);
            $table->string('public_key', 64)->unique();
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['is_active', 'domain']);
        });

        Schema::create('website_tracking_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tracked_website_id')->constrained()->cascadeOnDelete();
            $table->string('event_type', 32)->default('pageview');
            $table->text('page_url')->nullable();
            $table->string('page_title')->nullable();
            $table->text('referrer')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('geo_country', 2)->nullable();
            $table->text('user_agent')->nullable();
            $table->json('meta')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['tracked_website_id', 'created_at']);
            $table->index(['tracked_website_id', 'event_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('website_tracking_events');
        Schema::dropIfExists('tracked_websites');
    }
};
