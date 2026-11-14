<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemberSettlementRecord extends Model
{
    protected $fillable = [
        'publisher_id',
        'network_member_id',
        'community_id',
        'status',
        'amount_usd',
        'currency',
        'period_label',
        'period_start',
        'period_end',
        'settled_at',
        'notes',
        'created_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'amount_usd' => 'decimal:4',
            'period_start' => 'datetime',
            'period_end' => 'datetime',
            'settled_at' => 'datetime',
        ];
    }

    public function publisher(): BelongsTo
    {
        return $this->belongsTo(Publisher::class);
    }

    public function networkMember(): BelongsTo
    {
        return $this->belongsTo(NetworkMember::class);
    }

    public function community(): BelongsTo
    {
        return $this->belongsTo(PublisherCommunity::class, 'community_id');
    }
}
