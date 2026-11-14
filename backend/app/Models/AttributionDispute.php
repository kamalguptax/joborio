<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttributionDispute extends Model
{
    protected $fillable = [
        'creator_id',
        'opened_by_user_id',
        'attribution_event_id',
        'ppa_application_id',
        'reason',
        'status',
        'admin_notes',
        'resolved_by_user_id',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'resolved_at' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(Creator::class);
    }

    public function opener(): BelongsTo
    {
        return $this->belongsTo(User::class, 'opened_by_user_id');
    }

    public function ppaApplication(): BelongsTo
    {
        return $this->belongsTo(PpaApplication::class);
    }
}
