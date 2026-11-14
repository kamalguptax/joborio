<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PublisherLedgerEntry extends Model
{
    protected $table = 'publisher_ledger';

    protected $fillable = [
        'publisher_id',
        'community_id',
        'campaign_assignment_id',
        'entry_type',
        'source',
        'state',
        'gross_usd',
        'platform_fee_usd',
        'net_usd',
        'currency',
        'reference',
        'idempotency_key',
        'reverses_ledger_id',
        'meta',
        'occurred_at',
        'approved_at',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'gross_usd' => 'decimal:4',
            'platform_fee_usd' => 'decimal:4',
            'net_usd' => 'decimal:4',
            'meta' => 'array',
            'occurred_at' => 'datetime',
            'approved_at' => 'datetime',
            'paid_at' => 'datetime',
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

    public function campaignAssignment(): BelongsTo
    {
        return $this->belongsTo(PublisherCampaignAssignment::class, 'campaign_assignment_id');
    }

    public function reverses(): BelongsTo
    {
        return $this->belongsTo(self::class, 'reverses_ledger_id');
    }
}
