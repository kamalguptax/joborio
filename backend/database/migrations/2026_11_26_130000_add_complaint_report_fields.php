<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employer_content_complaints', function (Blueprint $table) {
            if (! Schema::hasColumn('employer_content_complaints', 'urgency')) {
                $table->string('urgency', 32)->default('Normal')->after('category');
            }
            if (! Schema::hasColumn('employer_content_complaints', 'additional_urls')) {
                $table->text('additional_urls')->nullable()->after('description');
            }
            if (! Schema::hasColumn('employer_content_complaints', 'evidence')) {
                $table->json('evidence')->nullable()->after('additional_urls');
            }
        });
    }

    public function down(): void
    {
        Schema::table('employer_content_complaints', function (Blueprint $table) {
            foreach (['urgency', 'additional_urls', 'evidence'] as $col) {
                if (Schema::hasColumn('employer_content_complaints', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
