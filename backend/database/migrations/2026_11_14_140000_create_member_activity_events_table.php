<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_activity_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('publisher_id')->constrained('publishers')->cascadeOnDelete();
            $table->foreignId('network_member_id')->constrained('network_members')->cascadeOnDelete();
            $table->foreignId('community_id')->nullable()->constrained('publisher_communities')->nullOnDelete();
            $table->foreignId('campaign_assignment_id')->nullable()
                ->constrained('publisher_campaign_assignments')->nullOnDelete();
            $table->string('activity_type', 32);
            // click | click_valid | signup | application | lead | conversion | action_approved | action_pending | action_rejected
            $table->string('status', 20)->default('counted'); // counted | rejected | reversed
            $table->string('tracking_id', 120)->nullable();
            $table->string('external_event_id', 120)->nullable();
            $table->foreignId('webhook_event_id')->nullable()
                ->constrained('publisher_webhook_events')->nullOnDelete();
            $table->json('meta')->nullable(); // never store rates/fees/payouts here
            $table->timestamp('occurred_at')->nullable();
            $table->timestamps();

            $table->index(['network_member_id', 'activity_type']);
            $table->index(['publisher_id', 'occurred_at']);
            $table->unique(['publisher_id', 'external_event_id'], 'member_activity_ext_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_activity_events');
    }
};
