<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployerLedgerEntry extends Model
{
    protected $fillable = [
        'employer_id',
        'program_id',
        'code',
        'entry_type',
        'debit_usd',
        'credit_usd',
        'reference',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'debit_usd' => 'decimal:4',
            'credit_usd' => 'decimal:4',
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
