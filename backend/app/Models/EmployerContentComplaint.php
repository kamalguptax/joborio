<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployerContentComplaint extends Model
{
    protected $fillable = [
        'employer_id',
        'program_id',
        'code',
        'campaign_ref',
        'platform',
        'post_url',
        'category',
        'urgency',
        'description',
        'additional_urls',
        'evidence',
        'seen_on',
        'status',
        'outcome',
        'timeline',
    ];

    protected function casts(): array
    {
        return [
            'seen_on' => 'date',
            'evidence' => 'array',
            'timeline' => 'array',
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
