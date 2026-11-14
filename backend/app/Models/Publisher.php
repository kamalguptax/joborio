<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Publisher extends Model
{
    public const STATUS_SUBMITTED = 'submitted';

    public const STATUS_EMAIL_VERIFIED = 'email_verified';

    public const STATUS_SOCIAL_REVIEWED = 'social_reviewed';

    public const STATUS_COMMERCIAL_APPROVED = 'commercial_approved';

    public const STATUS_ACTIVATED = 'activated';

    public const STATUS_REJECTED = 'rejected';

    public const NETWORK_TYPES = ['agency', 'publisher', 'affiliate', 'community'];

    public const INTEGRATIONS = ['dashboard', 'api', 'xml', 'webhook'];

    public const COUNTRIES = ['IN', 'AE', 'US'];

    protected $fillable = [
        'code',
        'username',
        'display_name',
        'country_code',
        'network_type',
        'social_url',
        'website_url',
        'integration_preference',
        'niche_ids',
        'job_preferences',
        'status',
        'email_verified_at',
        'social_reviewed_at',
        'commercial_approved_at',
        'activated_at',
        'review_notes',
        'notification_preferences',
    ];

    protected function casts(): array
    {
        return [
            'niche_ids' => 'array',
            'job_preferences' => 'array',
            'notification_preferences' => 'array',
            'email_verified_at' => 'datetime',
            'social_reviewed_at' => 'datetime',
            'commercial_approved_at' => 'datetime',
            'activated_at' => 'datetime',
        ];
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'publisher_users')
            ->withPivot(['role', 'is_active'])
            ->withTimestamps();
    }

    public function publisherUsers(): HasMany
    {
        return $this->hasMany(PublisherUser::class);
    }

    public function communities(): HasMany
    {
        return $this->hasMany(PublisherCommunity::class);
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(PublisherInvitation::class);
    }

    public function networkMembers(): HasMany
    {
        return $this->hasMany(NetworkMember::class);
    }

    public function campaignAssignments(): HasMany
    {
        return $this->hasMany(PublisherCampaignAssignment::class);
    }

    public function commissions(): HasMany
    {
        return $this->hasMany(PublisherCommission::class);
    }

    public function ledgerEntries(): HasMany
    {
        return $this->hasMany(PublisherLedgerEntry::class);
    }

    public function memberSettlements(): HasMany
    {
        return $this->hasMany(MemberSettlementRecord::class);
    }

    public function apiCredentials(): HasMany
    {
        return $this->hasMany(PublisherApiCredential::class);
    }

    public function webhookEvents(): HasMany
    {
        return $this->hasMany(PublisherWebhookEvent::class);
    }

    public function isActivated(): bool
    {
        return $this->status === self::STATUS_ACTIVATED;
    }

    public function statusLabel(): string
    {
        return match ($this->status) {
            self::STATUS_SUBMITTED => 'Application submitted',
            self::STATUS_EMAIL_VERIFIED => 'Email verified — under review',
            self::STATUS_SOCIAL_REVIEWED => 'Social profile reviewed',
            self::STATUS_COMMERCIAL_APPROVED => 'Commercial terms approved',
            self::STATUS_ACTIVATED => 'Active',
            self::STATUS_REJECTED => 'Rejected',
            default => ucfirst(str_replace('_', ' ', (string) $this->status)),
        };
    }
}
