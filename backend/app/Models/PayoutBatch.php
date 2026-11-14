<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PayoutBatch extends Model
{
    protected $fillable = ['status', 'source', 'total_usd', 'approved_by', 'processed_at'];

    protected function casts(): array
    {
        return [
            'total_usd' => 'decimal:2',
            'processed_at' => 'datetime',
        ];
    }

    public function lines(): HasMany
    {
        return $this->hasMany(PayoutLine::class);
    }
}
