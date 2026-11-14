<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayoutLine extends Model
{
    protected $fillable = [
        'payout_batch_id',
        'creator_id',
        'amount_usd',
        'method',
        'status',
        'external_reference',
    ];

    protected function casts(): array
    {
        return [
            'amount_usd' => 'decimal:2',
        ];
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(PayoutBatch::class, 'payout_batch_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(Creator::class);
    }
}
