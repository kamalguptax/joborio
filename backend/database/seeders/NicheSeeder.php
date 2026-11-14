<?php

namespace Database\Seeders;

use App\Models\Niche;
use App\Support\SkillCatalog;
use Illuminate\Database\Seeder;

class NicheSeeder extends Seeder
{
    public function run(): void
    {
        $niches = [
            ['code' => 'technology', 'name' => 'Technology'],
            ['code' => 'healthcare', 'name' => 'Healthcare'],
            ['code' => 'finance', 'name' => 'Finance & Accounting'],
            ['code' => 'education', 'name' => 'Education & Upskilling'],
            ['code' => 'marketing', 'name' => 'Sales & Marketing'],
            ['code' => 'logistics', 'name' => 'Logistics & Supply Chain'],
            ['code' => 'government', 'name' => 'Government & Public Sector'],
            ['code' => 'trades', 'name' => 'Skilled Trades'],
            ['code' => 'creative', 'name' => 'Creative & Design'],
            ['code' => 'legal', 'name' => 'Legal'],
            ['code' => 'energy', 'name' => 'Energy'],
            ['code' => 'hospitality', 'name' => 'Hospitality'],
        ];

        foreach ($niches as $niche) {
            Niche::firstOrCreate(['code' => $niche['code']], $niche);
        }

        SkillCatalog::sync();
    }
}
