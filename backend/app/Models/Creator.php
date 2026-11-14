<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Creator extends Model
{
    protected $fillable = [
        'user_id',
        'handle',
        'bio',
        'profile_photo_path',
        'accent_color',
        'social_links',
        'audience_countries',
        'prefer_remote',
        'promote_job_types',
        'opportunity_categories',
        'opportunity_targeting',
        'opportunity_preferences',
        'audience_size_estimate',
        'trust_tier',
        'trust_tier_updated_at',
        'referral_code',
        'pending_referral_code',
        'referred_by_creator_id',
        'referral_first_bonus_paid_at',
        'referral_override_ends_at',
        'onboarding_completed_at',
        'approval_status',
        'approved_at',
        'approved_by',
        'payout_method',
        'payout_currency',
        'payout_holder_name',
        'payout_upi_id',
        'payout_paypal_email',
        'payout_bank_name',
        'payout_account_number',
        'payout_ifsc',
    ];

    protected function casts(): array
    {
        return [
            'social_links' => 'array',
            'audience_countries' => 'array',
            'prefer_remote' => 'boolean',
            'promote_job_types' => 'array',
            'opportunity_categories' => 'array',
            'opportunity_targeting' => 'array',
            'opportunity_preferences' => 'array',
            'onboarding_completed_at' => 'datetime',
            'approved_at' => 'datetime',
            'trust_tier_updated_at' => 'datetime',
            'referral_first_bonus_paid_at' => 'datetime',
            'referral_override_ends_at' => 'datetime',
        ];
    }

    public function isApproved(): bool
    {
        if (! \Illuminate\Support\Facades\Schema::hasColumn('creators', 'approval_status')) {
            return true;
        }

        return ($this->approval_status ?? 'pending') === 'approved';
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function niches(): BelongsToMany
    {
        return $this->belongsToMany(Niche::class, 'creator_niche');
    }

    public function listings(): BelongsToMany
    {
        return $this->belongsToMany(Listing::class, 'creator_listing')
            ->withPivot(['is_pinned', 'is_hidden']);
    }

    public function programs(): BelongsToMany
    {
        return $this->belongsToMany(Program::class, 'program_creator')
            ->withPivot(['opted_in_at', 'status']);
    }

    public function trackingTokens(): HasMany
    {
        return $this->hasMany(TrackingToken::class);
    }

    public function earnings(): HasMany
    {
        return $this->hasMany(EarningLedger::class);
    }

    public function referredCreators(): HasMany
    {
        return $this->hasMany(Creator::class, 'referred_by_creator_id');
    }

    public function publicUrl(): string
    {
        $base = rtrim(config('joborio.creator_link_base'), '/');

        return "{$base}/@{$this->handle}";
    }
}
