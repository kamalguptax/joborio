<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProgramAdSync extends Model
{
    protected $fillable = [
        'program_id',
        'platform',
        'status',
        'external_campaign_id',
        'external_adset_id',
        'external_ad_id',
        'external_account_id',
        'last_error',
        'payload',
        'response',
        'synced_at',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'response' => 'array',
            'synced_at' => 'datetime',
        ];
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }
}
