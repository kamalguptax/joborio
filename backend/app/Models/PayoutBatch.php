<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PayoutBatch extends Model
{
    protected $fillable = [
        'status',
        'source',
        'total_usd',
        'approved_by',
        'processed_at',
        'evidence_path',
        'evidence_original_name',
        'evidence_mime',
        'evidence_size',
        'evidence_note',
        'evidence_uploaded_at',
        'released_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'total_usd' => 'decimal:2',
            'processed_at' => 'datetime',
            'evidence_uploaded_at' => 'datetime',
            'evidence_size' => 'integer',
        ];
    }

    public function lines(): HasMany
    {
        return $this->hasMany(PayoutLine::class);
    }

    public function releasedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'released_by_user_id');
    }
}
