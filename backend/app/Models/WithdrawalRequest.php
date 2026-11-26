<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WithdrawalRequest extends Model
{
    public const ROLES = ['creator', 'publisher', 'network_member'];

    public const STATUSES = ['pending', 'approved', 'rejected', 'paid', 'cancelled'];

    protected $fillable = [
        'user_id',
        'role',
        'account_id',
        'amount_usd',
        'currency',
        'status',
        'payout_method',
        'payout_details',
        'user_note',
        'admin_note',
        'evidence_path',
        'evidence_original_name',
        'evidence_mime',
        'evidence_size',
        'evidence_note',
        'evidence_uploaded_at',
        'external_reference',
        'reviewed_by_user_id',
        'reviewed_at',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'amount_usd' => 'decimal:4',
            'payout_details' => 'array',
            'evidence_size' => 'integer',
            'evidence_uploaded_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'paid_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }
}
