<?php

namespace App\Models;

use App\Support\EmployerBilling;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Employer extends Model
{
    protected $fillable = [
        'user_id',
        'company_name',
        'trading_name',
        'website',
        'country_code',
        'entity_region',
        'business_email',
        'gst_number',
        'pan_number',
        'tax_id',
        'billing_address',
        'payment_method',
        'payment_upi_id',
        'payment_account_name',
        'payment_bank_name',
        'payment_account_number',
        'payment_ifsc',
        'job_preferences',
        'verified_at',
        'billing_completed_at',
        'prepaid_balance_usd',
    ];

    protected function casts(): array
    {
        return [
            'verified_at' => 'datetime',
            'billing_completed_at' => 'datetime',
            'job_preferences' => 'array',
            'prepaid_balance_usd' => 'decimal:4',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function programs(): HasMany
    {
        return $this->hasMany(Program::class);
    }

    public function canGoLive(): bool
    {
        return EmployerBilling::canGoLive($this);
    }

    public function billingMissing(): array
    {
        return EmployerBilling::missingFields($this);
    }
}
