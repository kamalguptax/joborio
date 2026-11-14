<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class PlatformSetting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'is_secret',
        'group',
    ];

    protected function casts(): array
    {
        return [
            'is_secret' => 'boolean',
        ];
    }

    public function plainValue(): ?string
    {
        if ($this->value === null || $this->value === '') {
            return null;
        }

        if (! $this->is_secret) {
            return $this->value;
        }

        try {
            return Crypt::decryptString($this->value);
        } catch (\Throwable) {
            return null;
        }
    }

    public function storePlainValue(?string $plain): void
    {
        if ($plain === null || $plain === '') {
            $this->value = null;

            return;
        }

        $this->value = $this->is_secret ? Crypt::encryptString($plain) : $plain;
    }

    public function maskedValue(): ?string
    {
        $plain = $this->plainValue();
        if ($plain === null || $plain === '') {
            return null;
        }

        if (strlen($plain) <= 4) {
            return '••••';
        }

        return str_repeat('•', 8).substr($plain, -4);
    }
}
