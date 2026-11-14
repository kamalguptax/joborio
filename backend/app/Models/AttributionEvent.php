<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class AttributionEvent extends Model
{
    protected $fillable = [
        'tracking_token_id',
        'creator_id',
        'listing_id',
        'event_type',
        'ip_address',
        'device_fingerprint',
        'geo_country',
        'latitude',
        'longitude',
        'geo_city',
        'referrer',
        'is_counted',
        'fraud_status',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'is_counted' => 'boolean',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'meta' => 'array',
        ];
    }

    /**
     * Clicks that should move the creator click counter.
     * job_view rows were stored before views were counted as clicks.
     */
    public function scopeVerifiedClicks(Builder $query): Builder
    {
        return $query->where(function (Builder $query) {
            $query->where(function (Builder $query) {
                $query->whereIn('event_type', ['click', 'job_apply'])->where('is_counted', true);
            })->orWhere('event_type', 'job_view');
        });
    }

    public function trackingToken(): BelongsTo
    {
        return $this->belongsTo(TrackingToken::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(Creator::class);
    }

    public function listing(): BelongsTo
    {
        return $this->belongsTo(Listing::class);
    }

    public function earning(): HasOne
    {
        return $this->hasOne(EarningLedger::class);
    }
}
