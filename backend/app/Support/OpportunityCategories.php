<?php

namespace App\Support;

class OpportunityCategories
{
    public const IDS = [
        'jobs',
        'courses',
        'bootcamps',
        'hackathons',
        'ai_tools',
        'saas',
        'other',
    ];

    /** Preference keys available per category (union when multiple selected). */
    public const PREFERENCE_KEYS_BY_CATEGORY = [
        'jobs' => ['salary', 'experience', 'education', 'skills'],
        'courses' => ['duration', 'experience', 'education', 'skills'],
        'bootcamps' => ['duration', 'experience', 'education', 'skills'],
        'hackathons' => ['duration', 'experience', 'skills'],
        'ai_tools' => ['skills'],
        'saas' => ['skills'],
        'other' => ['education', 'skills'],
    ];

    public const EXPERIENCE_LEVELS = [
        'entry',
        'junior',
        'mid',
        'senior',
        'lead',
        'executive',
    ];

    public const WORK_MODES = [
        'onsite',
        'hybrid',
        'remote',
        'work_from_home',
    ];

    public const CURRENCIES = ['USD', 'INR', 'AED', 'GBP', 'EUR'];

    /**
     * @param  list<mixed>  $ids
     * @return list<string>
     */
    public static function clean(array $ids): array
    {
        $out = [];
        foreach ($ids as $id) {
            $id = (string) $id;
            if (in_array($id, self::IDS, true) && ! in_array($id, $out, true)) {
                $out[] = $id;
            }
        }

        return $out;
    }

    /**
     * @param  list<string>  $categories
     * @return list<string>
     */
    public static function visiblePreferenceKeys(array $categories): array
    {
        $categories = self::clean($categories);
        $keys = [];
        foreach ($categories as $cat) {
            foreach (self::PREFERENCE_KEYS_BY_CATEGORY[$cat] ?? [] as $key) {
                if (! in_array($key, $keys, true)) {
                    $keys[] = $key;
                }
            }
        }

        return $keys;
    }

    /**
     * @param  array<string, mixed>|null  $targeting
     * @return array<string, mixed>
     */
    public static function cleanTargeting(?array $targeting): array
    {
        $targeting = $targeting ?? [];

        $keywords = self::stringList($targeting['keywords'] ?? []);
        $industry = self::stringList($targeting['industry'] ?? []);
        $brands = self::stringList($targeting['brands'] ?? []);
        $audience = self::stringList($targeting['audience_type'] ?? []);
        $audience = array_values(array_intersect($audience, self::EXPERIENCE_LEVELS));
        $workMode = self::stringList($targeting['work_mode'] ?? []);
        $workMode = array_values(array_intersect($workMode, self::WORK_MODES));
        $currency = strtoupper(trim((string) ($targeting['currency'] ?? 'USD')));
        if (! in_array($currency, self::CURRENCIES, true)) {
            $currency = 'USD';
        }

        return [
            'keywords' => $keywords,
            'industry' => $industry,
            'brands' => $brands,
            'audience_type' => $audience,
            'work_mode' => $workMode,
            'currency' => $currency,
        ];
    }

    /**
     * @param  array<string, mixed>|null  $prefs
     * @param  list<string>  $categories
     * @return array<string, mixed>
     */
    public static function cleanPreferences(?array $prefs, array $categories): array
    {
        $prefs = $prefs ?? [];
        $visible = self::visiblePreferenceKeys($categories);
        $out = [];

        if (in_array('salary', $visible, true)) {
            $out['salary_min'] = self::nullableNumber($prefs['salary_min'] ?? null);
            $out['salary_max'] = self::nullableNumber($prefs['salary_max'] ?? null);
        }
        if (in_array('experience', $visible, true)) {
            $exp = self::stringList($prefs['experience'] ?? []);
            $out['experience'] = array_values(array_intersect($exp, self::EXPERIENCE_LEVELS));
        }
        if (in_array('duration', $visible, true)) {
            $out['duration'] = self::nullableString($prefs['duration'] ?? null);
        }
        if (in_array('education', $visible, true)) {
            $out['education'] = self::stringList($prefs['education'] ?? []);
        }
        if (in_array('skills', $visible, true)) {
            $out['skills'] = self::stringList($prefs['skills'] ?? []);
        }

        return $out;
    }

    /**
     * @param  mixed  $value
     * @return list<string>
     */
    private static function stringList(mixed $value): array
    {
        if (! is_array($value)) {
            if (is_string($value) && trim($value) !== '') {
                $value = preg_split('/[,|]+/', $value) ?: [];
            } else {
                return [];
            }
        }

        $out = [];
        foreach ($value as $item) {
            $s = trim((string) $item);
            if ($s !== '' && ! in_array($s, $out, true)) {
                $out[] = mb_substr($s, 0, 80);
            }
        }

        return array_slice($out, 0, 40);
    }

    private static function nullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }
        $s = trim((string) $value);

        return $s === '' ? null : mb_substr($s, 0, 80);
    }

    private static function nullableNumber(mixed $value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (! is_numeric($value)) {
            return null;
        }

        return max(0, (float) $value);
    }
}
