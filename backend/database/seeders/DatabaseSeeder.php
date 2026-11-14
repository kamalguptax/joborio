<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            NicheSeeder::class,
            JobMasterSeeder::class,
            SyndicationFeedSeeder::class,
            DemoSeeder::class,
            PublisherDemoSeeder::class,
        ]);
    }
}
