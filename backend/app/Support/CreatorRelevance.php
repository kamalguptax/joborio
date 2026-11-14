<?php

namespace App\Support;

use App\Models\Creator;
use Illuminate\Support\Facades\Schema;

class CreatorRelevance
{
    /** @var array<string, string> */
    private const COUNTRY_NAMES = [
        'IN' => 'india',
        'US' => 'united states',
        'GB' => 'united kingdom',
        'AE' => 'united arab emirates',
        'CA' => 'canada',
        'AU' => 'australia',
        'SG' => 'singapore',
        'DE' => 'germany',
        'FR' => 'france',
        'NL' => 'netherlands',
        'IE' => 'ireland',
        'NZ' => 'new zealand',
        'ZA' => 'south africa',
        'PH' => 'philippines',
        'MY' => 'malaysia',
        'BD' => 'bangladesh',
        'LK' => 'sri lanka',
        'NP' => 'nepal',
        'PK' => 'pakistan',
        'QA' => 'qatar',
        'SA' => 'saudi arabia',
    ];

    /** @var list<string> */
    private const STOP = [
        'and', 'the', 'for', 'with', 'from', 'your', 'jobs', 'job',
        'services', 'other', 'sector', 'general',
    ];

    /**
     * @param  list<array<string, mixed>>  $jobs
     * @param  list<string>  $typeOverride
     * @return list<array<string, mixed>>
     */
    public static function filterJobs(array $jobs, Creator $creator, array $typeOverride = []): array
    {
        $creator->loadMissing('niches');
        $names = $creator->niches->pluck('name')->map(fn ($name) => (string) $name)->all();
        $savedTypes = Schema::hasColumn('creators', 'promote_job_types')
            ? PromoteJobTypes::clean($creator->promote_job_types ?? [])
            : [];
        $types = $typeOverride !== [] ? PromoteJobTypes::clean($typeOverride) : $savedTypes;
        $countries = array_values(array_filter(array_map(
            fn ($code) => strtoupper((string) $code),
            $creator->audience_countries ?? [],
        )));

        return array_values(array_filter(
            $jobs,
            fn (array $job): bool => self::jobMatches(
                $job,
                $names,
                $types,
                $countries,
                (bool) $creator->prefer_remote,
            ),
        ));
    }

    /**
     * @param  array<string, mixed>  $job
     * @param  list<string>  $nicheNames
     * @param  list<string>  $jobTypes
     * @param  list<string>  $countryCodes
     */
    public static function jobMatches(
        array $job,
        array $nicheNames,
        array $jobTypes,
        array $countryCodes,
        bool $preferRemote,
    ): bool {
        $jobTypes = PromoteJobTypes::clean($jobTypes);
        if ($nicheNames === [] && $jobTypes === []) {
            return false;
        }

        $hay = strtolower(implode(' ', array_filter([
            $job['title'] ?? '',
            $job['category'] ?? '',
            $job['jobtype'] ?? '',
            $job['description_text'] ?? '',
            $job['location'] ?? '',
            $job['location_label'] ?? '',
            $job['company'] ?? '',
        ])));

        if ($nicheNames !== [] && ! self::textMatchesNames($hay, $nicheNames)) {
            return false;
        }

        if ($jobTypes !== [] && ! PromoteJobTypes::matches($hay, $jobTypes)) {
            return false;
        }

        if ($preferRemote && ! PromoteJobTypes::matches($hay, ['remote', 'work_from_home'])) {
            return false;
        }

        if ($countryCodes !== [] && ! self::placeMatchesCountries($job, $countryCodes)) {
            return false;
        }

        return true;
    }

    /**
     * @param  list<string>  $names
     */
    public static function textMatchesNames(string $haystack, array $names): bool
    {
        $haystack = strtolower($haystack);
        foreach (self::needles($names) as $needle) {
            $pattern = '/(?<![a-z0-9])'.preg_quote($needle, '/').'(?![a-z0-9])/';
            if (preg_match($pattern, $haystack) === 1) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  list<string>  $names
     * @return list<string>
     */
    public static function needles(array $names): array
    {
        $out = [];
        foreach ($names as $name) {
            $parts = preg_split('/[^a-z0-9]+/i', strtolower((string) $name)) ?: [];
            foreach ($parts as $part) {
                if ($part === '' || in_array($part, self::STOP, true)) {
                    continue;
                }
                if (strlen($part) < 3 && ! in_array($part, ['it', 'hr', 'pr'], true)) {
                    continue;
                }
                $out[$part] = true;
            }
        }

        return array_keys($out);
    }

    /**
     * @param  array<string, mixed>  $job
     * @param  list<string>  $countryCodes
     */
    private static function placeMatchesCountries(array $job, array $countryCodes): bool
    {
        $countryField = strtolower(trim((string) ($job['country'] ?? '')));
        $place = strtolower(trim(implode(' ', array_filter([
            $countryField,
            (string) ($job['location'] ?? ''),
            (string) ($job['location_label'] ?? ''),
        ]))));

        foreach ($countryCodes as $code) {
            $code = strtoupper($code);
            $name = self::COUNTRY_NAMES[$code] ?? null;
            if ($countryField !== '' && ($countryField === strtolower($code) || ($name && str_contains($countryField, $name)))) {
                return true;
            }
            if ($name && str_contains($place, $name)) {
                return true;
            }
        }

        return false;
    }
}
