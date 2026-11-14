<?php

use App\Support\SkillCatalog;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('niches')) {
            return;
        }

        if (! Schema::hasColumn('niches', 'group_name')) {
            Schema::table('niches', function (Blueprint $table) {
                $table->string('group_name')->nullable();
            });
        }
        if (! Schema::hasColumn('niches', 'sort_order')) {
            Schema::table('niches', function (Blueprint $table) {
                $table->unsignedSmallInteger('sort_order')->default(0);
            });
        }

        SkillCatalog::sync();
    }

    public function down(): void
    {
        if (! Schema::hasTable('niches')) {
            return;
        }

        Schema::table('niches', function (Blueprint $table) {
            if (Schema::hasColumn('niches', 'sort_order')) {
                $table->dropColumn('sort_order');
            }
            if (Schema::hasColumn('niches', 'group_name')) {
                $table->dropColumn('group_name');
            }
        });
    }
};
