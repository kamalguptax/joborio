<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PublisherCommission extends Model
{
    protected $fillable = [
        'publisher_id',
        'commission_percent',
        'currency',
        'status',
        'version',
        'effective_from',
        'effective_to',
        'approved_by_user_id',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'commission_percent' => 'decimal:2',
            'effective_from' => 'datetime',
            'effective_to' => 'datetime',
        ];
    }

    public function publisher(): BelongsTo
    {
        return $this->belongsTo(Publisher::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }
}
