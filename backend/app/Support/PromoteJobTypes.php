<?php

namespace App\Support;

class PromoteJobTypes
{
    public const IDS = [
        'full_time',
        'part_time',
        'internship',
        'remote',
        'contract',
        'work_from_home',
    ];

    /** @var array<string, list<string>> */
    private const NEEDLES = [
        'full_time' => ['full-time', 'full time', 'fulltime'],
        'part_time' => ['part-time', 'part time', 'parttime'],
        'internship' => ['internship', 'intern'],
        'remote' => ['remote'],
        'contract' => ['contract'],
        'work_from_home' => ['work from home', 'work-from-home', 'wfh'],
    ];

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
     * @param  list<string>  $types
     */
    public static function matches(string $haystack, array $types): bool
    {
        $types = self::clean($types);
        if ($types === []) {
            return true;
        }

        $text = strtolower($haystack);
        foreach ($types as $type) {
            foreach (self::NEEDLES[$type] as $needle) {
                if (str_contains($text, $needle)) {
                    return true;
                }
            }
        }

        return false;
    }
}
