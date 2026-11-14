<?php

namespace App\Support;

use App\Models\Niche;
use Illuminate\Support\Facades\Schema;

class SkillCatalog
{
    /**
     * Skills shown on “Select your skills”. Loaded from the database, not hardcoded in the page.
     *
     * @return list<array{code: string, name: string, group: string}>
     */
    public static function all(): array
    {
        $groups = [
            'Information Technology & Software' => [
                'it-computers-software' => 'IT/Computers - Software',
                'information-technology' => 'Information Technology',
                'it-software' => 'Software',
                'it-management' => 'IT Management',
                'it-security' => 'Security',
                'technical-support' => 'Technical Support',
                'it-hardware-networking' => 'IT/Computers - Hardware & Networking',
            ],
            'Manufacturing & Industrial' => [
                'manufacturing' => 'Manufacturing',
                'industrial-engineering' => 'Industrial Engineering',
                'automotive-ancillaries' => 'Automotive/Automobile/Ancillaries',
                'oil-gas-petroleum' => 'Oil/Gas/Petroleum',
            ],
            'Construction & Real Estate' => [
                'construction' => 'Construction',
                'real-estate' => 'Real Estate',
            ],
            'Financial Services' => [
                'financial-services' => 'Financial Services',
                'banking' => 'Banking',
                'fintech' => 'FinTech',
                'insurance' => 'Insurance',
                'consulting-advisory' => 'Consulting/Advisory Services',
            ],
            'Healthcare & Life Sciences' => [
                'pharmaceutical' => 'Pharmaceutical',
                'biotech-life-sciences' => 'Bio Technology & Life Sciences',
            ],
            'Internet, Education & Services' => [
                'internet-ecommerce' => 'Internet/E-commerce',
                'advertising-pr-events' => 'Advertising/PR/Events',
                'education-sector' => 'Education',
                'business-services' => 'Services',
                'operations-logistics' => 'Operations & Logistics',
                'retailing' => 'Retailing',
                'airlines-aviation' => 'Airlines/Aviation/Aerospace',
                'telecom-isp' => 'Telecom/ISP',
                'bpo' => 'BPO',
                'other' => 'Other',
            ],
        ];

        $rows = [];
        foreach ($groups as $group => $skills) {
            foreach ($skills as $code => $name) {
                $rows[] = ['code' => $code, 'name' => $name, 'group' => $group];
            }
        }

        return $rows;
    }

    public static function sync(): void
    {
        if (! Schema::hasTable('niches')) {
            return;
        }

        $hasGroup = Schema::hasColumn('niches', 'group_name');
        $hasSort = Schema::hasColumn('niches', 'sort_order');

        foreach (self::all() as $index => $row) {
            $niche = Niche::firstOrCreate(
                ['code' => $row['code']],
                ['name' => $row['name']],
            );

            if ($niche->wasRecentlyCreated === false && $niche->name === '') {
                $niche->name = $row['name'];
            }

            if ($hasGroup) {
                $niche->group_name = $row['group'];
            }
            if ($hasSort) {
                $niche->sort_order = ($index + 1) * 10;
            }
            $niche->save();
        }

        if ($hasSort) {
            Niche::query()->whereNull('group_name')->where('sort_order', 0)->update(['sort_order' => 1000]);
        }
    }
}
