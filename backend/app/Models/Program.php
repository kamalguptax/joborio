<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Program extends Model
{
    protected $fillable = [
        'employer_id',
        'listing_id',
        'title',
        'description',
        'post_url',
        'engagement_actions',
        'engage_brief',
        'pricing_model',
        'promotion_type',
        'rate_usd',
        'budget_total_usd',
        'budget_spent_usd',
        'status',
        'trial_without_ip',
        'target_niche_ids',
        'target_countries',
        'auto_ads_platforms',
        'min_trust_tier',
        'starts_at',
        'ends_at',
    ];

    protected function casts(): array
    {
        return [
            'rate_usd' => 'decimal:4',
            'budget_total_usd' => 'decimal:2',
            'budget_spent_usd' => 'decimal:2',
            'trial_without_ip' => 'boolean',
            'target_niche_ids' => 'array',
            'target_countries' => 'array',
            'auto_ads_platforms' => 'array',
            'engagement_actions' => 'array',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    public function postPromoteSubmissions(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(PostPromoteSubmission::class);
    }

    public function isPostPromote(): bool
    {
        return ($this->promotion_type ?? '') === 'post_promote'
            || ($this->pricing_model ?? '') === 'ppe';
    }

    public function adSyncs(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ProgramAdSync::class);
    }

    public function isTrialWithoutIp(): bool
    {
        if (! \Illuminate\Support\Facades\Schema::hasColumn('programs', 'trial_without_ip')) {
            return false;
        }

        return (bool) $this->trial_without_ip;
    }

    public function employer(): BelongsTo
    {
        return $this->belongsTo(Employer::class);
    }

    public function listing(): BelongsTo
    {
        return $this->belongsTo(Listing::class);
    }

    public function creators(): BelongsToMany
    {
        return $this->belongsToMany(Creator::class, 'program_creator')
            ->withPivot(['opted_in_at', 'status']);
    }

    public function budgetRemaining(): float
    {
        return max(0, (float) $this->budget_total_usd - (float) $this->budget_spent_usd);
    }
}
