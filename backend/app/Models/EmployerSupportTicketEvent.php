<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployerSupportTicketEvent extends Model
{
    protected $fillable = [
        'employer_support_ticket_id',
        'message',
        'actor',
    ];

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(EmployerSupportTicket::class, 'employer_support_ticket_id');
    }
}
