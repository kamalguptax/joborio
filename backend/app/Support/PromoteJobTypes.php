<?php

namespace App\Support;

class PromoteJobTypes
{
    public const IDS = [
        'full_time',
        'part_time',
        'internship',
        'fresher',
        'contract',
    ];

    /** @var array<string, list<string>> */
    private const NEEDLES = [
        'full_time' => ['full-time', 'full time', 'fulltime'],
        'part_time' => ['part-time', 'part time', 'parttime'],
        'internship' => ['internship', 'intern'],
        'fresher' => ['fresher', 'freshers', 'entry level', 'entry-level', '0-1 year', '0 year', 'graduate', 'campus'],
        'contract' => ['contract'],
        // Kept for remote-only feed matching (work mode), not shown as employment type.
        'remote' => ['remote', 'work from home', 'work-from-home', 'wfh'],
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
            // Drop legacy remote / WFH employment chips — use work mode instead.
            if ($id === 'remote' || $id === 'work_from_home') {
                continue;
            }
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
        $resolved = [];
        foreach ($types as $type) {
            $type = (string) $type;
            if ($type === 'work_from_home') {
                $type = 'remote';
            }
            if (isset(self::NEEDLES[$type]) && ! in_array($type, $resolved, true)) {
                $resolved[] = $type;
            }
        }
        if ($resolved === []) {
            return true;
        }

        $text = strtolower($haystack);
        foreach ($resolved as $type) {
            foreach (self::NEEDLES[$type] as $needle) {
                if (str_contains($text, $needle)) {
                    return true;
                }
            }
        }

        return false;
    }
}
