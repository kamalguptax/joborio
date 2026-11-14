<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PpaApplication extends Model
{
    protected $fillable = [
        'tracking_token_id',
        'creator_id',
        'listing_id',
        'program_id',
        'external_application_id',
        'email',
        'status',
        'attribution_event_id',
        'earning_ledger_id',
        'meta',
        'employer_confirmed_at',
    ];

    protected function casts(): array
    {
        return [
            'meta' => 'array',
            'employer_confirmed_at' => 'datetime',
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

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
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
