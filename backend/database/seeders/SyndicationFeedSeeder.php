<?php

namespace Database\Seeders;

use App\Models\SyndicationFeed;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SyndicationFeedSeeder extends Seeder
{
    public function run(): void
    {
        $url = (string) config('joborio.jobrapido_feed_url');
        $sample = (string) config('joborio.jobrapido_feed_sample_path');

        SyndicationFeed::query()->firstOrCreate(
            ['slug' => 'vigyapanam-in'],
            [
                'name' => 'Vigyapanam India (Jobrapido)',
                'feed_url' => $url,
                'format' => 'jobrapido',
                'job_xpath' => '//job',
                'country_code' => 'IN',
                'is_active' => true,
                'use_sample_when_empty' => (bool) config('joborio.jobrapido_feed_use_sample_when_empty', true),
                'sample_path' => is_readable($sample) ? $sample : null,
                'sort_order' => 0,
            ]
        );

        $extra = env('JOBORIO_SYNDICATION_FEEDS_EXTRA', '');
        if ($extra === '') {
            return;
        }

        foreach (explode('|', $extra) as $chunk) {
            $chunk = trim($chunk);
            if ($chunk === '' || ! str_contains($chunk, ',')) {
                continue;
            }
            [$name, $feedUrl] = array_map('trim', explode(',', $chunk, 2));
            if ($name === '' || $feedUrl === '') {
                continue;
            }
            $slug = Str::slug($name);
            if ($slug === '') {
                continue;
            }

            SyndicationFeed::query()->firstOrCreate(
                ['slug' => $slug],
                [
                    'name' => $name,
                    'feed_url' => $feedUrl,
                    'format' => 'jobrapido',
                    'job_xpath' => '//job',
                    'is_active' => true,
                    'use_sample_when_empty' => true,
                    'sample_path' => null,
                    'sort_order' => 10,
                ]
            );
        }
    }
}
