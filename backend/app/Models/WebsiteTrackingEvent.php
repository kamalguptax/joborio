<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WebsiteTrackingEvent extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'tracked_website_id',
        'event_type',
        'page_url',
        'page_title',
        'referrer',
        'ip_address',
        'geo_country',
        'latitude',
        'longitude',
        'user_agent',
        'meta',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'meta' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function website(): BelongsTo
    {
        return $this->belongsTo(TrackedWebsite::class, 'tracked_website_id');
    }
}
