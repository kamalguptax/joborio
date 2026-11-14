<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FraudReview extends Model
{
    protected $fillable = [
        'attribution_event_id',
        'creator_id',
        'reason',
        'status',
        'admin_notes',
        'reviewed_by',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
        ];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(AttributionEvent::class, 'attribution_event_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(Creator::class);
    }
}
