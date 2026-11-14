<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployerPaymentOrder extends Model
{
    protected $fillable = [
        'employer_id',
        'program_id',
        'provider',
        'purpose',
        'currency',
        'amount_paise',
        'amount_usd',
        'fx_rate',
        'razorpay_order_id',
        'razorpay_payment_id',
        'razorpay_signature',
        'status',
        'credited_at',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'amount_paise' => 'integer',
            'amount_usd' => 'decimal:4',
            'fx_rate' => 'decimal:6',
            'credited_at' => 'datetime',
            'meta' => 'array',
        ];
    }

    public function employer(): BelongsTo
    {
        return $this->belongsTo(Employer::class);
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }
}
