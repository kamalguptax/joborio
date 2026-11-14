<?php

namespace Database\Seeders;

use App\Models\JobMaster;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class JobMasterSeeder extends Seeder
{
    public function run(): void
    {
        $in = JobMaster::firstOrCreate(
            ['type' => JobMaster::TYPE_COUNTRY, 'slug' => 'in'],
            ['name' => 'India', 'code' => 'IN', 'sort_order' => 1]
        );

        $states = [
            ['name' => 'Uttar Pradesh', 'cities' => ['Noida', 'Lucknow']],
            ['name' => 'Karnataka', 'cities' => ['Bengaluru', 'Mysuru']],
            ['name' => 'Maharashtra', 'cities' => ['Mumbai', 'Pune']],
            ['name' => 'Telangana', 'cities' => ['Hyderabad']],
            ['name' => 'Delhi', 'cities' => ['New Delhi']],
        ];

        foreach ($states as $i => $row) {
            $state = JobMaster::firstOrCreate(
                ['type' => JobMaster::TYPE_STATE, 'slug' => Str::slug($row['name'])],
                ['name' => $row['name'], 'parent_id' => $in->id, 'sort_order' => $i + 1]
            );
            foreach ($row['cities'] as $j => $cityName) {
                JobMaster::firstOrCreate(
                    [
                        'type' => JobMaster::TYPE_CITY,
                        'slug' => Str::slug($state->slug.'-'.$cityName),
                    ],
                    [
                        'name' => $cityName,
                        'parent_id' => $state->id,
                        'sort_order' => $j + 1,
                    ]
                );
            }
        }

        JobMaster::firstOrCreate(
            ['type' => JobMaster::TYPE_CITY, 'slug' => 'pan-india'],
            ['name' => 'Pan India', 'parent_id' => $in->id, 'sort_order' => 99]
        );

        $categories = [
            'Engineering',
            'Technology',
            'Data & Analytics',
            'Marketing',
            'Healthcare',
            'Education',
            'Finance',
            'Sales',
        ];
        foreach ($categories as $i => $name) {
            JobMaster::firstOrCreate(
                ['type' => JobMaster::TYPE_CATEGORY, 'slug' => Str::slug($name)],
                ['name' => $name, 'sort_order' => $i + 1]
            );
        }

        foreach (['fulltime', 'parttime', 'contract', 'internship', 'remote'] as $i => $name) {
            JobMaster::firstOrCreate(
                ['type' => JobMaster::TYPE_JOB_TYPE, 'slug' => Str::slug($name)],
                ['name' => $name, 'sort_order' => $i + 1]
            );
        }

        foreach (['Fresher', '1–3 years', '2–5 years', '3–6 years', '5+ years'] as $i => $name) {
            JobMaster::firstOrCreate(
                ['type' => JobMaster::TYPE_EXPERIENCE, 'slug' => Str::slug($name)],
                ['name' => $name, 'sort_order' => $i + 1]
            );
        }

        foreach (['High school', 'Diploma', 'Bachelors', 'Masters', 'PhD'] as $i => $name) {
            JobMaster::firstOrCreate(
                ['type' => JobMaster::TYPE_EDUCATION, 'slug' => Str::slug($name)],
                ['name' => $name, 'sort_order' => $i + 1]
            );
        }

        foreach (
            [
                'Tata Electronics',
                'Google Career Certificates Partner',
                'AI Tools Platform',
                'Global Health',
                'Example Tech Co',
            ] as $i => $name
        ) {
            JobMaster::firstOrCreate(
                ['type' => JobMaster::TYPE_COMPANY, 'slug' => Str::slug($name)],
                ['name' => $name, 'sort_order' => $i + 1]
            );
        }
    }
}
