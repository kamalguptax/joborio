<?php

namespace App\Support;

class JobSubid
{
    public static function append(string $url, string $code): string
    {
        $code = trim($code);
        if ($url === '' || $code === '') {
            return $url;
        }

        $parts = parse_url($url);
        if ($parts === false || ! isset($parts['scheme'], $parts['host'])) {
            $join = str_contains($url, '?') ? '&' : '?';

            return $url.$join.'subid='.rawurlencode($code);
        }

        $query = [];
        if (isset($parts['query'])) {
            parse_str($parts['query'], $query);
        }
        $query['subid'] = $code;

        $rebuilt = $parts['scheme'].'://'.$parts['host']
            .(isset($parts['port']) ? ':'.$parts['port'] : '')
            .($parts['path'] ?? '/')
            .'?'.http_build_query($query);

        if (isset($parts['fragment']) && $parts['fragment'] !== '') {
            $rebuilt .= '#'.$parts['fragment'];
        }

        return $rebuilt;
    }
}
