<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EmployerSupportTicket extends Model
{
    protected $fillable = [
        'employer_id',
        'code',
        'subject',
        'category',
        'priority',
        'status',
        'description',
    ];

    public function employer(): BelongsTo
    {
        return $this->belongsTo(Employer::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(EmployerSupportTicketEvent::class)->latest();
    }
}
