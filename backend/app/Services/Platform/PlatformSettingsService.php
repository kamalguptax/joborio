<?php

namespace App\Services\Platform;

use App\Models\PlatformSetting;
use App\Support\MoneyCurrencies;
use Illuminate\Support\Facades\Cache;

class PlatformSettingsService
{
    private const CACHE_KEY = 'joborio:platform_settings';

    private const MAP_KEYS = [
        'google_maps_enabled' => ['secret' => false, 'group' => 'maps'],
        'geolocation_tracking' => ['secret' => false, 'group' => 'maps'],
        'google_maps_api_key' => ['secret' => true, 'group' => 'maps'],
        'google_maps_browser_api_key' => ['secret' => true, 'group' => 'maps'],
        'frontend_url' => ['secret' => false, 'group' => 'general'],
        'openai_api_key' => ['secret' => true, 'group' => 'integrations'],
        'referral_bonus_usd' => ['secret' => false, 'group' => 'referral'],
        'referral_bonus_threshold_usd' => ['secret' => false, 'group' => 'referral'],
        'referral_override_percent' => ['secret' => false, 'group' => 'referral'],
        'referral_override_months' => ['secret' => false, 'group' => 'referral'],
        'payout_platform_fee_percent' => ['secret' => false, 'group' => 'payout'],
        'payout_min_usd' => ['secret' => false, 'group' => 'payout'],
        'payout_ppc_rate_usd' => ['secret' => false, 'group' => 'payout'],
        'payout_ppr_rate_usd' => ['secret' => false, 'group' => 'payout'],
        'payout_ppa_rate_usd' => ['secret' => false, 'group' => 'payout'],
        'payout_ppc_hold_days' => ['secret' => false, 'group' => 'payout'],
        'payout_ppc_hold_days_higher' => ['secret' => false, 'group' => 'payout'],
        'payout_ppr_hold_days' => ['secret' => false, 'group' => 'payout'],
        'payout_ppa_hold_days' => ['secret' => false, 'group' => 'payout'],
        'payout_currency' => ['secret' => false, 'group' => 'payout'],
    ];

    public function get(string $key, ?string $envFallback = null): ?string
    {
        $row = $this->row($key);
        if ($row && $row->plainValue() !== null && $row->plainValue() !== '') {
            return $row->plainValue();
        }

        return $envFallback;
    }

    public function getBool(string $key, bool $default, ?bool $envFallback = null): bool
    {
        $raw = $this->get($key, $envFallback === null ? null : ($envFallback ? '1' : '0'));
        if ($raw === null || $raw === '') {
            return $default;
        }

        return filter_var($raw, FILTER_VALIDATE_BOOLEAN);
    }

    public function set(string $key, ?string $value): void
    {
        $meta = self::MAP_KEYS[$key] ?? ['secret' => false, 'group' => 'general'];

        $row = PlatformSetting::firstOrNew(['key' => $key]);
        $row->is_secret = $meta['secret'];
        $row->group = $meta['group'];
        $row->storePlainValue($value === '' ? null : $value);
        $row->save();

        Cache::forget(self::CACHE_KEY);
    }

    /**
     * @return array<string, PlatformSetting>
     */
    private function allRows(): array
    {
        return Cache::remember(self::CACHE_KEY, 60, function () {
            return PlatformSetting::query()->get()->keyBy('key')->all();
        });
    }

    private function row(string $key): ?PlatformSetting
    {
        return $this->allRows()[$key] ?? null;
    }

    public function googleMapsServerKey(): string
    {
        return (string) ($this->get('google_maps_api_key', config('joborio.google_maps.api_key')) ?? '');
    }

    public function googleMapsBrowserKey(): string
    {
        return (string) ($this->get('google_maps_browser_api_key', env('GOOGLE_MAPS_BROWSER_API_KEY', '')) ?? '');
    }

    public function mapsEnabled(): bool
    {
        return $this->getBool(
            'google_maps_enabled',
            (bool) config('joborio.google_maps.enabled', true),
            (bool) config('joborio.google_maps.enabled', true),
        );
    }

    public function geolocationTracking(): bool
    {
        return $this->getBool(
            'geolocation_tracking',
            (bool) config('joborio.google_maps.geolocation_tracking', true),
            (bool) config('joborio.google_maps.geolocation_tracking', true),
        );
    }

    public function frontendUrl(): string
    {
        return (string) ($this->get('frontend_url', config('joborio.frontend_url')) ?? '');
    }

    /**
     * @return array{bonus_usd: float, bonus_threshold_usd: float, override_percent: float, override_months: int}
     */
    public function referralTerms(): array
    {
        return [
            'bonus_usd' => (float) $this->get(
                'referral_bonus_usd',
                (string) config('joborio.referral.bonus_usd', 5),
            ),
            'bonus_threshold_usd' => (float) $this->get(
                'referral_bonus_threshold_usd',
                (string) config('joborio.referral.bonus_threshold_approved_usd', 10),
            ),
            'override_percent' => (float) $this->get(
                'referral_override_percent',
                (string) config('joborio.referral.override_percent', 3),
            ),
            'override_months' => (int) $this->get(
                'referral_override_months',
                (string) config('joborio.referral.override_months', 2),
            ),
        ];
    }

    /**
     * @return array{
     *   platform_fee_percent: float,
     *   min_payout_usd: float,
     *   ppc_rate_usd: float,
     *   ppr_rate_usd: float,
     *   ppa_rate_usd: float,
     *   ppc_hold_days: int,
     *   ppc_hold_days_higher: int,
     *   ppr_hold_days: int,
     *   ppa_hold_days: int,
     *   currency: string,
     *   currency_symbol: string
     * }
     */
    public function payoutStructure(): array
    {
        $money = $this->moneyMeta();

        return [
            'platform_fee_percent' => (float) $this->get(
                'payout_platform_fee_percent',
                (string) config('joborio.platform_fee_percent', 25),
            ),
            'min_payout_usd' => (float) $this->get(
                'payout_min_usd',
                (string) config('joborio.min_payout_usd', 10),
            ),
            'ppc_rate_usd' => (float) $this->get(
                'payout_ppc_rate_usd',
                (string) config('joborio.default_ppc_rate_usd', 0.03),
            ),
            'ppr_rate_usd' => (float) $this->get(
                'payout_ppr_rate_usd',
                (string) config('joborio.default_ppr_rate_usd', 0.30),
            ),
            'ppa_rate_usd' => (float) $this->get(
                'payout_ppa_rate_usd',
                (string) config('joborio.default_ppa_rate_usd', 5),
            ),
            'ppc_hold_days' => (int) $this->get(
                'payout_ppc_hold_days',
                (string) config('joborio.ppc_hold_days', 5),
            ),
            'ppc_hold_days_higher' => (int) $this->get(
                'payout_ppc_hold_days_higher',
                (string) config('joborio.ppc_hold_days_micro', 3),
            ),
            'ppr_hold_days' => (int) $this->get(
                'payout_ppr_hold_days',
                (string) config('joborio.ppr_hold_days', 3),
            ),
            'currency' => $money['code'],
            'currency_symbol' => $money['symbol'],
            'ppa_hold_days' => (int) $this->get(
                'payout_ppa_hold_days',
                (string) config('joborio.ppa_hold_days', 7),
            ),
        ];
    }

    /**
     * @return array{code: string, label: string, symbol: string}
     */
    public function moneyMeta(?string $override = null): array
    {
        $code = $override ?: $this->get('payout_currency', 'USD');

        return MoneyCurrencies::meta($code);
    }

    /**
     * @return array<string, mixed>
     */
    public function publicMapsConfig(): array
    {
        $browser = $this->googleMapsBrowserKey();
        if ($browser === '') {
            $browser = (string) (env('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY') ?? '');
        }

        return [
            'enabled' => $this->mapsEnabled() && $browser !== '',
            'browser_api_key' => $browser,
            'geolocation_tracking' => $this->geolocationTracking(),
            'server_geocoding' => $this->googleMapsServerKey() !== '',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function adminView(): array
    {
        $out = [
            'maps' => [
                'google_maps_enabled' => $this->mapsEnabled(),
                'geolocation_tracking' => $this->geolocationTracking(),
                'google_maps_api_key' => $this->secretField('google_maps_api_key', config('joborio.google_maps.api_key')),
                'google_maps_browser_api_key' => $this->secretField(
                    'google_maps_browser_api_key',
                    env('GOOGLE_MAPS_BROWSER_API_KEY', ''),
                ),
            ],
            'general' => [
                'frontend_url' => $this->get('frontend_url', config('joborio.frontend_url')) ?? '',
            ],
            'referral' => $this->referralTerms(),
            'payout' => $this->payoutStructure(),
            'integrations' => [
                'openai_api_key' => $this->secretField('openai_api_key', env('OPENAI_API_KEY', '')),
            ],
            'env_fallback_note' => 'Empty fields keep using .env until you save a value in admin.',
        ];

        return $out;
    }

    /**
     * @return array{configured: bool, source: string, masked: ?string}
     */
    private function secretField(string $key, ?string $envFallback): array
    {
        $row = $this->row($key);
        if ($row && $row->plainValue()) {
            return [
                'configured' => true,
                'source' => 'database',
                'masked' => $row->maskedValue(),
            ];
        }

        if ($envFallback !== null && $envFallback !== '') {
            $masked = strlen($envFallback) <= 4
                ? '••••'
                : str_repeat('•', 8).substr($envFallback, -4);

            return [
                'configured' => true,
                'source' => 'env',
                'masked' => $masked,
            ];
        }

        return [
            'configured' => false,
            'source' => 'none',
            'masked' => null,
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function updateFromAdmin(array $payload): void
    {
        if (isset($payload['maps']) && is_array($payload['maps'])) {
            $maps = $payload['maps'];
            if (array_key_exists('google_maps_enabled', $maps)) {
                $this->set('google_maps_enabled', $maps['google_maps_enabled'] ? '1' : '0');
            }
            if (array_key_exists('geolocation_tracking', $maps)) {
                $this->set('geolocation_tracking', $maps['geolocation_tracking'] ? '1' : '0');
            }
            if (! empty($maps['google_maps_api_key'])) {
                $this->set('google_maps_api_key', (string) $maps['google_maps_api_key']);
            }
            if (! empty($maps['google_maps_browser_api_key'])) {
                $this->set('google_maps_browser_api_key', (string) $maps['google_maps_browser_api_key']);
            }
        }

        if (isset($payload['general']['frontend_url'])) {
            $this->set('frontend_url', (string) $payload['general']['frontend_url']);
        }

        if (isset($payload['referral']) && is_array($payload['referral'])) {
            $referral = $payload['referral'];
            foreach ([
                'bonus_usd' => 'referral_bonus_usd',
                'bonus_threshold_usd' => 'referral_bonus_threshold_usd',
                'override_percent' => 'referral_override_percent',
                'override_months' => 'referral_override_months',
            ] as $input => $key) {
                if (array_key_exists($input, $referral) && $referral[$input] !== null && $referral[$input] !== '') {
                    $this->set($key, (string) $referral[$input]);
                }
            }
        }

        if (isset($payload['payout']) && is_array($payload['payout'])) {
            $payout = $payload['payout'];
            foreach ([
                'platform_fee_percent' => 'payout_platform_fee_percent',
                'min_payout_usd' => 'payout_min_usd',
                'ppc_rate_usd' => 'payout_ppc_rate_usd',
                'ppr_rate_usd' => 'payout_ppr_rate_usd',
                'ppa_rate_usd' => 'payout_ppa_rate_usd',
                'ppc_hold_days' => 'payout_ppc_hold_days',
                'ppc_hold_days_higher' => 'payout_ppc_hold_days_higher',
                'ppr_hold_days' => 'payout_ppr_hold_days',
                'ppa_hold_days' => 'payout_ppa_hold_days',
                'currency' => 'payout_currency',
            ] as $input => $key) {
                if (array_key_exists($input, $payout) && $payout[$input] !== null && $payout[$input] !== '') {
                    $value = (string) $payout[$input];
                    if ($key === 'payout_currency') {
                        $value = strtoupper($value);
                        if (! MoneyCurrencies::valid($value)) {
                            continue;
                        }
                    }
                    $this->set($key, $value);
                }
            }
        }

        if (! empty($payload['integrations']['openai_api_key'])) {
            $this->set('openai_api_key', (string) $payload['integrations']['openai_api_key']);
        }
    }
}
