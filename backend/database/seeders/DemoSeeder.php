<?php

namespace Database\Seeders;

use App\Models\Employer;
use App\Models\Listing;
use App\Models\Niche;
use App\Models\User;
use App\Support\CountryCentroids;
use App\Services\Programs\ProgramService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@joborio.com'],
            ['name' => 'Platform Admin', 'password' => Hash::make('password'), 'is_active' => true]
        );
        $admin->assignRole('admin');

        $listings = [
            [
                'title' => 'Senior Software Engineer',
                'company_name' => 'Example Tech Co',
                'location_label' => 'Remote',
                'country_code' => 'US',
                'is_remote' => true,
                'category' => 'technology',
                'destination_url' => 'https://example.com/jobs/senior-engineer',
                'ppc_rate_usd' => 0.03,
                'ppr_rate_usd' => 0.30,
            ],
            [
                'title' => 'Registered Nurse',
                'company_name' => 'Global Health',
                'location_label' => 'Dubai, UAE',
                'country_code' => 'AE',
                'category' => 'healthcare',
                'destination_url' => 'https://example.com/jobs/nurse-dubai',
                'ppc_rate_usd' => 0.04,
            ],
            [
                'title' => 'Cybersecurity Bootcamp',
                'company_name' => 'UK EdTech',
                'location_label' => 'Online',
                'country_code' => 'GB',
                'is_remote' => true,
                'type' => 'course',
                'category' => 'education',
                'destination_url' => 'https://example.com/courses/cybersecurity',
                'ppc_rate_usd' => 0.05,
            ],
            [
                'title' => 'Full Stack Web Development',
                'company_name' => 'JobOrio Learn',
                'location_label' => 'Online',
                'country_code' => 'IN',
                'is_remote' => true,
                'type' => 'course',
                'category' => 'education',
                'destination_url' => 'https://example.com/courses/fullstack',
                'ppc_rate_usd' => 0.06,
            ],
            [
                'title' => 'Digital Marketing Masterclass',
                'company_name' => 'Vigyapanam Academy',
                'location_label' => 'Online',
                'country_code' => 'IN',
                'is_remote' => true,
                'type' => 'course',
                'category' => 'education',
                'destination_url' => 'https://example.com/courses/digital-marketing',
                'ppc_rate_usd' => 0.05,
            ],
            [
                'title' => 'Creator Analytics Toolkit',
                'company_name' => 'JobOrio Tools',
                'location_label' => 'Online',
                'country_code' => 'US',
                'is_remote' => true,
                'type' => 'tool',
                'category' => 'tools',
                'destination_url' => 'https://example.com/tools/analytics',
                'ppc_rate_usd' => 0.04,
            ],
            [
                'title' => 'Brand Kit Builder',
                'company_name' => 'Studio Apps',
                'location_label' => 'Online',
                'country_code' => 'US',
                'is_remote' => true,
                'type' => 'tool',
                'category' => 'tools',
                'destination_url' => 'https://example.com/tools/brand-kit',
                'ppc_rate_usd' => 0.03,
            ],
            [
                'title' => 'Summer Brand Awareness Push',
                'company_name' => 'JobOrio Demo Hiring',
                'location_label' => 'India',
                'country_code' => 'IN',
                'type' => 'branding',
                'category' => 'branding',
                'destination_url' => 'https://example.com/campaigns/brand-summer',
                'ppc_rate_usd' => 0.05,
            ],
        ];

        foreach ($listings as $row) {
            $listing = Listing::firstOrCreate(
                ['title' => $row['title'], 'company_name' => $row['company_name']],
                array_merge($row, ['source' => 'seed', 'status' => 'active'])
            );
            if (! $listing->latitude && ($row['country_code'] ?? null)) {
                $centroid = CountryCentroids::forCountry($row['country_code']);
                if ($centroid) {
                    $listing->update([
                        'latitude' => $centroid['lat'],
                        'longitude' => $centroid['lng'],
                    ]);
                }
            }
        }

        $employerUser = User::firstOrCreate(
            ['email' => 'employer@joborio.com'],
            ['name' => 'Demo Employer', 'password' => Hash::make('password'), 'is_active' => true]
        );
        $employerUser->assignRole('employer');

        $employer = Employer::firstOrCreate(
            ['user_id' => $employerUser->id],
            [
                'company_name' => 'JobOrio Demo Hiring',
                'country_code' => 'IN',
                'website' => 'https://joborio.com',
            ]
        );

        $programs = app(ProgramService::class);
        $techNicheId = Niche::query()->where('code', 'technology')->value('id');
        $allNicheIds = Niche::query()->pluck('id')->all();

        $campaigns = [
            [
                'title' => 'India Tech Hiring — PPC',
                'description' => 'Share software and IT roles with your audience. Pay per verified click.',
                'destination_url' => 'https://example.com/campaigns/tech-in',
                'pricing_model' => 'ppc',
                'promotion_type' => 'job',
                'rate_usd' => 0.05,
                'budget_total_usd' => 2000,
                'target_niche_ids' => $techNicheId ? [$techNicheId] : $allNicheIds,
                'target_countries' => ['IN', 'US'],
                'min_trust_tier' => 'nano',
                'skip_billing_gate' => true,
                'force_active' => true,
            ],
            [
                'title' => 'Global Bootcamp Signups — PPR',
                'description' => 'Earn on verified course and bootcamp registrations.',
                'destination_url' => 'https://example.com/campaigns/edu-global',
                'pricing_model' => 'ppr',
                'promotion_type' => 'course',
                'rate_usd' => 0.35,
                'budget_total_usd' => 1500,
                'target_niche_ids' => $allNicheIds,
                'target_countries' => ['IN', 'US', 'GB'],
                'min_trust_tier' => 'nano',
                'skip_billing_gate' => true,
                'force_active' => true,
            ],
        ];

        foreach ($campaigns as $data) {
            $existing = $employer->programs()->where('title', $data['title'])->first();
            if ($existing) {
                if ($existing->status !== 'active') {
                    $programs->activate($existing);
                }

                continue;
            }

            $program = $programs->create($employer, $data);
            $programs->activate($program);
        }
    }
}
