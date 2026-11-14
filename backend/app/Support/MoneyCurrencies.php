<?php

namespace App\Support;

class MoneyCurrencies
{
    /** @var array<string, array{label: string, symbol: string}> */
    public const OPTIONS = [
        'USD' => ['label' => 'US Dollar ($)', 'symbol' => '$'],
        'INR' => ['label' => 'Indian Rupee (₹)', 'symbol' => '₹'],
        'EUR' => ['label' => 'Euro (€)', 'symbol' => '€'],
        'GBP' => ['label' => 'British Pound (£)', 'symbol' => '£'],
    ];

    public static function valid(?string $code): bool
    {
        return $code !== null && isset(self::OPTIONS[strtoupper($code)]);
    }

    /**
     * @return array{code: string, label: string, symbol: string}
     */
    public static function meta(?string $code): array
    {
        $code = strtoupper((string) $code);
        if (! isset(self::OPTIONS[$code])) {
            $code = 'USD';
        }

        return [
            'code' => $code,
            'label' => self::OPTIONS[$code]['label'],
            'symbol' => self::OPTIONS[$code]['symbol'],
        ];
    }
}
