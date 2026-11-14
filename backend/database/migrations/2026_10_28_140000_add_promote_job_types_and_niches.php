<?php

use App\Models\Niche;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('creators') && ! Schema::hasColumn('creators', 'promote_job_types')) {
            Schema::table('creators', function (Blueprint $table) {
                $table->json('promote_job_types')->nullable();
            });
        }

        if (! Schema::hasTable('niches')) {
            return;
        }

        $niches = [
            ['code' => 'technology', 'name' => 'Technology'],
            ['code' => 'software', 'name' => 'Software Engineering'],
            ['code' => 'data', 'name' => 'Data & Analytics'],
            ['code' => 'cybersecurity', 'name' => 'Cybersecurity'],
            ['code' => 'healthcare', 'name' => 'Healthcare'],
            ['code' => 'finance', 'name' => 'Finance & Accounting'],
            ['code' => 'banking', 'name' => 'Banking'],
            ['code' => 'education', 'name' => 'Education & Upskilling'],
            ['code' => 'teaching', 'name' => 'Teaching'],
            ['code' => 'marketing', 'name' => 'Sales & Marketing'],
            ['code' => 'sales', 'name' => 'Sales'],
            ['code' => 'content', 'name' => 'Content & Media'],
            ['code' => 'design', 'name' => 'Design'],
            ['code' => 'customer-support', 'name' => 'Customer Support'],
            ['code' => 'human-resources', 'name' => 'Human Resources'],
            ['code' => 'operations', 'name' => 'Operations'],
            ['code' => 'product', 'name' => 'Product Management'],
            ['code' => 'logistics', 'name' => 'Logistics & Supply Chain'],
            ['code' => 'government', 'name' => 'Government & Public Sector'],
            ['code' => 'trades', 'name' => 'Skilled Trades'],
            ['code' => 'creative', 'name' => 'Creative & Design'],
            ['code' => 'legal', 'name' => 'Legal'],
            ['code' => 'energy', 'name' => 'Energy'],
            ['code' => 'hospitality', 'name' => 'Hospitality'],
            ['code' => 'retail', 'name' => 'Retail'],
            ['code' => 'manufacturing', 'name' => 'Manufacturing'],
            ['code' => 'real-estate', 'name' => 'Real Estate'],
            ['code' => 'bpo', 'name' => 'BPO'],
        ];

        foreach ($niches as $niche) {
            Niche::firstOrCreate(['code' => $niche['code']], $niche);
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('creators') && Schema::hasColumn('creators', 'promote_job_types')) {
            Schema::table('creators', function (Blueprint $table) {
                $table->dropColumn('promote_job_types');
            });
        }
    }
};
