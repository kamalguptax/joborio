<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemberActivityEvent extends Model
{
    public const TYPES = [
        'click',
        'click_valid',
        'signup',
        'application',
        'lead',
        'conversion',
        'action_approved',
        'action_pending',
        'action_rejected',
    ];

    protected $fillable = [
        'publisher_id',
        'network_member_id',
        'community_id',
        'campaign_assignment_id',
        'activity_type',
        'status',
        'tracking_id',
        'external_event_id',
        'webhook_event_id',
        'meta',
        'occurred_at',
    ];

    protected function casts(): array
    {
        return [
            'meta' => 'array',
            'occurred_at' => 'datetime',
        ];
    }

    public function networkMember(): BelongsTo
    {
        return $this->belongsTo(NetworkMember::class);
    }

    public function publisher(): BelongsTo
    {
        return $this->belongsTo(Publisher::class);
    }
}
