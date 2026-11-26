<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('withdrawal_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('role', 32); // creator | publisher | network_member
            $table->unsignedBigInteger('account_id'); // creator_id / publisher_id / network_member_id
            $table->decimal('amount_usd', 12, 4);
            $table->string('currency', 3)->default('USD');
            $table->string('status', 24)->default('pending'); // pending | approved | rejected | paid | cancelled
            $table->string('payout_method', 32)->nullable(); // upi | bank_transfer | paypal
            $table->json('payout_details')->nullable();
            $table->text('user_note')->nullable();
            $table->text('admin_note')->nullable();
            $table->string('evidence_path', 500)->nullable();
            $table->string('evidence_original_name', 255)->nullable();
            $table->string('evidence_mime', 120)->nullable();
            $table->unsignedBigInteger('evidence_size')->nullable();
            $table->text('evidence_note')->nullable();
            $table->timestamp('evidence_uploaded_at')->nullable();
            $table->string('external_reference', 190)->nullable();
            $table->foreignId('reviewed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index(['role', 'account_id', 'status']);
            $table->index(['user_id', 'status']);
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('withdrawal_requests');
    }
};
