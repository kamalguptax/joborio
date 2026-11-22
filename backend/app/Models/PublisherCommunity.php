<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PublisherCommunity extends Model
{
    protected $fillable = [
        'publisher_id',
        'code',
        'name',
        'category',
        'commission_percent',
        'description',
        'country_code',
        'campaign_access',
        'xml_job_refs',
        'manager_user_id',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'commission_percent' => 'decimal:2',
            'xml_job_refs' => 'array',
        ];
    }

    public function publisher(): BelongsTo
    {
        return $this->belongsTo(Publisher::class);
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_user_id');
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(PublisherInvitation::class, 'community_id');
    }

    public function members(): HasMany
    {
        return $this->hasMany(CommunityMember::class, 'community_id');
    }
}
