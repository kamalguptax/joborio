<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SyndicationFeed extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'feed_url',
        'format',
        'job_xpath',
        'country_code',
        'is_active',
        'use_sample_when_empty',
        'sample_path',
        'sort_order',
        'last_fetched_at',
        'last_job_count',
        'last_error',
        'last_publisher',
        'last_build_date',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'use_sample_when_empty' => 'boolean',
            'last_fetched_at' => 'datetime',
            'last_job_count' => 'integer',
            'sort_order' => 'integer',
        ];
    }
}
