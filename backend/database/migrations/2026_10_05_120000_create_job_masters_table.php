<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_masters', function (Blueprint $table) {
            $table->id();
            $table->string('type', 32);
            $table->foreignId('parent_id')->nullable()->constrained('job_masters')->nullOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->string('code', 16)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['type', 'is_active', 'sort_order']);
            $table->unique(['type', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_masters');
    }
};
