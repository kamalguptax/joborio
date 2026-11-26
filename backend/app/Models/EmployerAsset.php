<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployerAsset extends Model
{
    protected $fillable = [
        'employer_id',
        'program_id',
        'file_name',
        'asset_type',
        'version',
        'status',
        'storage_path',
    ];

    public function employer(): BelongsTo
    {
        return $this->belongsTo(Employer::class);
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }
}
