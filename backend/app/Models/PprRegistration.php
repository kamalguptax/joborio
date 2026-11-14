<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PprRegistration extends Model
{
    protected $fillable = [
        'tracking_token_id',
        'creator_id',
        'listing_id',
        'email',
        'status',
        'email_verified_at',
        'verification_token',
        'attribution_event_id',
        'earning_ledger_id',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'meta' => 'array',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(Creator::class);
    }

    public function listing(): BelongsTo
    {
        return $this->belongsTo(Listing::class);
    }

    public function trackingToken(): BelongsTo
    {
        return $this->belongsTo(TrackingToken::class);
    }

    public function attributionEvent(): BelongsTo
    {
        return $this->belongsTo(AttributionEvent::class);
    }

    public function earningLedger(): BelongsTo
    {
        return $this->belongsTo(EarningLedger::class);
    }
}
