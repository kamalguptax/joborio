<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Listing extends Model
{
    protected $fillable = [
        'type',
        'external_id',
        'title',
        'company_name',
        'location_label',
        'latitude',
        'longitude',
        'geo_place_id',
        'country_code',
        'is_remote',
        'category',
        'experience_level',
        'salary_min',
        'salary_max',
        'description',
        'destination_url',
        'source',
        'program_id',
        'status',
        'ppc_rate_usd',
        'ppr_rate_usd',
        'ppa_rate_usd',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'is_remote' => 'boolean',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'salary_min' => 'decimal:2',
            'salary_max' => 'decimal:2',
            'ppc_rate_usd' => 'decimal:4',
            'ppr_rate_usd' => 'decimal:4',
            'ppa_rate_usd' => 'decimal:4',
            'expires_at' => 'datetime',
        ];
    }

    public function creators(): BelongsToMany
    {
        return $this->belongsToMany(Creator::class, 'creator_listing')
            ->withPivot(['is_pinned', 'is_hidden']);
    }

    public function trackingTokens(): HasMany
    {
        return $this->hasMany(TrackingToken::class);
    }

    public function program(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active')
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            });
    }
}
