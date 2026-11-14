<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PublisherCampaignAssignment extends Model
{
    protected $fillable = [
        'publisher_id',
        'community_id',
        'program_id',
        'status',
        'pricing_model',
        'accepted_rate_usd',
        'rate_version',
        'accepted_at',
        'assigned_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'accepted_rate_usd' => 'decimal:4',
            'accepted_at' => 'datetime',
        ];
    }

    public function publisher(): BelongsTo
    {
        return $this->belongsTo(Publisher::class);
    }

    public function community(): BelongsTo
    {
        return $this->belongsTo(PublisherCommunity::class, 'community_id');
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }
}
