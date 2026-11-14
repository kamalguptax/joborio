<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('publisher_api_credentials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('publisher_id')->constrained('publishers')->cascadeOnDelete();
            $table->string('name', 120)->default('Default');
            $table->string('key_prefix', 16);
            $table->string('key_hash', 255);
            $table->string('webhook_secret_prefix', 16)->nullable();
            $table->string('webhook_secret_hash', 255)->nullable();
            $table->string('outbound_webhook_url', 500)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['publisher_id', 'is_active']);
            $table->index('key_prefix');
        });

        Schema::create('publisher_webhook_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('publisher_id')->constrained('publishers')->cascadeOnDelete();
            $table->string('direction', 16)->default('inbound'); // inbound | outbound
            $table->string('event_type', 64);
            $table->string('external_event_id', 120)->nullable();
            $table->string('status', 24)->default('received'); // received | processed | failed | ignored
            $table->unsignedSmallInteger('http_status')->nullable();
            $table->json('payload')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->unique(['publisher_id', 'external_event_id'], 'pub_webhook_event_unique');
            $table->index(['publisher_id', 'status']);
            $table->index(['publisher_id', 'event_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('publisher_webhook_events');
        Schema::dropIfExists('publisher_api_credentials');
    }
};
