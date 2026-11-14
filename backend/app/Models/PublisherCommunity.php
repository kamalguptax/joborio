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
        'description',
        'country_code',
        'campaign_access',
        'manager_user_id',
        'status',
    ];

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
