<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReferralReward extends Model
{
    protected $fillable = [
        'referrer_creator_id',
        'referred_creator_id',
        'kind',
        'source_earning_ledger_id',
        'earning_ledger_id',
        'amount_usd',
    ];

    protected function casts(): array
    {
        return [
            'amount_usd' => 'decimal:4',
        ];
    }

    public function referrer(): BelongsTo
    {
        return $this->belongsTo(Creator::class, 'referrer_creator_id');
    }

    public function referred(): BelongsTo
    {
        return $this->belongsTo(Creator::class, 'referred_creator_id');
    }
}
