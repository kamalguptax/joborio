<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feedback_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type', 24)->default('suggestion'); // suggestion | bug | compliment | other
            $table->unsignedTinyInteger('rating')->nullable(); // 1-5
            $table->text('message');
            $table->string('name', 120)->nullable();
            $table->string('email', 190)->nullable();
            $table->string('page_url', 500)->nullable();
            $table->string('ip_address', 64)->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->string('status', 24)->default('new'); // new | reviewed | archived
            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feedback_submissions');
    }
};
