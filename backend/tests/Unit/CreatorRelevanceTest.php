<?php

namespace Tests\Unit;

use App\Support\CreatorRelevance;
use PHPUnit\Framework\TestCase;

class CreatorRelevanceTest extends TestCase
{
    public function test_software_job_matches_software_skill_and_full_time(): void
    {
        $job = [
            'title' => 'Senior Software Engineer',
            'category' => 'Information Technology',
            'description_text' => 'Full-time role in Chennai, India',
            'country' => 'India',
            'location' => 'Chennai',
        ];

        $this->assertTrue(CreatorRelevance::jobMatches(
            $job,
            ['IT/Computers - Software'],
            ['full_time'],
            ['IN'],
            false,
        ));
    }

    public function test_unrelated_job_is_hidden(): void
    {
        $job = [
            'title' => 'Staff Nurse',
            'category' => 'Healthcare',
            'description_text' => 'Full-time hospital shift in Mumbai, India',
            'country' => 'India',
            'location' => 'Mumbai',
        ];

        $this->assertFalse(CreatorRelevance::jobMatches(
            $job,
            ['IT/Computers - Software'],
            ['full_time'],
            ['IN'],
            false,
        ));
    }

    public function test_without_skills_or_job_types_nothing_matches(): void
    {
        $job = [
            'title' => 'Senior Software Engineer',
            'country' => 'India',
        ];

        $this->assertFalse(CreatorRelevance::jobMatches($job, [], [], ['IN'], false));
    }
}
