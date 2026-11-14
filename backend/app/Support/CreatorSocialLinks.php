<?php

namespace App\Support;

use Illuminate\Validation\ValidationException;

class CreatorSocialLinks
{
    public const KEYS = ['linkedin', 'instagram', 'community', 'website'];

    /**
     * @param  array<string, mixed>|null  $links
     * @return array<string, string>
     */
    public static function clean(?array $links): array
    {
        $out = [];
        foreach (self::KEYS as $key) {
            $value = is_array($links) ? trim((string) ($links[$key] ?? '')) : '';
            if ($value !== '') {
                $out[$key] = $value;
            }
        }

        return $out;
    }

    /**
     * @param  array<string, mixed>|null  $links
     * @return array<string, string>
     */
    public static function requireAtLeastOne(?array $links): array
    {
        $cleaned = self::clean($links);
        if ($cleaned === []) {
            throw ValidationException::withMessages([
                'social_links' => [
                    'Add at least one LinkedIn, Instagram, community, or website link.',
                ],
            ]);
        }

        foreach ($cleaned as $key => $url) {
            if (! filter_var($url, FILTER_VALIDATE_URL)) {
                throw ValidationException::withMessages([
                    "social_links.{$key}" => ['Enter a valid URL starting with https://'],
                ]);
            }
        }

        return $cleaned;
    }
}
