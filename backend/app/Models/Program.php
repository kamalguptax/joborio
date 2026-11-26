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
        'conversion_model_code',
        'promotion_type',
        'brand_category',
        'rate_usd',
        'currency',
        'budget_total_usd',
        'daily_budget_usd',
        'budget_spent_usd',
        'auto_pause_on_budget',
        'lead_type',
        'required_fields',
        'qualification_rules',
        'wizard_payload',
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
            'daily_budget_usd' => 'decimal:2',
            'budget_spent_usd' => 'decimal:2',
            'auto_pause_on_budget' => 'boolean',
            'trial_without_ip' => 'boolean',
            'target_niche_ids' => 'array',
            'target_countries' => 'array',
            'auto_ads_platforms' => 'array',
            'engagement_actions' => 'array',
            'required_fields' => 'array',
            'wizard_payload' => 'array',
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

    public function budgetProgressPercent(): float
    {
        $total = (float) $this->budget_total_usd;
        if ($total <= 0) {
            return 0.0;
        }

        return min(100, round(((float) $this->budget_spent_usd / $total) * 100, 1));
    }

    public function autoPauseOnBudget(): bool
    {
        if (! \Illuminate\Support\Facades\Schema::hasColumn('programs', 'auto_pause_on_budget')) {
            return true;
        }

        return (bool) ($this->auto_pause_on_budget ?? true);
    }

    public function requiresSchedule(): bool
    {
        return in_array((string) $this->pricing_model, ['ppc', 'ppr', 'ppa', 'ppe'], true);
    }

    public function isWithinSchedule(?\DateTimeInterface $at = null): bool
    {
        $at = \Illuminate\Support\Carbon::parse($at ?? now());

        if ($this->starts_at && $at->lt($this->starts_at)) {
            return false;
        }

        if ($this->ends_at && $at->gt($this->ends_at)) {
            return false;
        }

        return true;
    }
}
