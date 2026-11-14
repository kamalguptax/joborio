<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EarningLedger extends Model
{
    protected $fillable = [
        'creator_id',
        'attribution_event_id',
        'earning_type',
        'gross_usd',
        'platform_fee_usd',
        'net_usd',
        'state',
        'hold_until',
        'approved_at',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'gross_usd' => 'decimal:4',
            'platform_fee_usd' => 'decimal:4',
            'net_usd' => 'decimal:4',
            'hold_until' => 'datetime',
            'approved_at' => 'datetime',
            'paid_at' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(Creator::class);
    }

    public function attributionEvent(): BelongsTo
    {
        return $this->belongsTo(AttributionEvent::class);
    }
}
