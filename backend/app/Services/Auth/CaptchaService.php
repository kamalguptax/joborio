<?php

namespace App\Services\Auth;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CaptchaService
{
    public const TURNSTILE_ID = 'turnstile';

    public function challenge(): array
    {
        if ($this->turnstileEnabled()) {
            return [
                'captcha_id' => self::TURNSTILE_ID,
                'provider' => 'turnstile',
                'site_key' => (string) config('services.turnstile.site_key'),
                'question' => 'Complete the Cloudflare security check.',
            ];
        }

        $a = random_int(2, 12);
        $b = random_int(1, 9);
        $id = (string) Str::uuid();

        Cache::put($this->key($id), (string) ($a + $b), now()->addMinutes(10));

        return [
            'captcha_id' => $id,
            'provider' => 'math',
            'question' => "What is {$a} + {$b}?",
        ];
    }

    public function assertValid(?string $id, ?string $answer): void
    {
        if (! $id || $answer === null || trim((string) $answer) === '') {
            throw ValidationException::withMessages([
                'captcha' => ['Complete the captcha.'],
            ]);
        }

        if ($id === self::TURNSTILE_ID || $this->looksLikeTurnstileToken($answer)) {
            $this->assertTurnstile(trim((string) $answer));

            return;
        }

        if ($this->turnstileEnabled()) {
            // Keys are configured — only Turnstile is accepted.
            $this->assertTurnstile(trim((string) $answer));

            return;
        }

        $expected = Cache::pull($this->key($id));
        if ($expected === null || trim((string) $answer) !== (string) $expected) {
            throw ValidationException::withMessages([
                'captcha' => ['Captcha is incorrect or expired. Try again.'],
            ]);
        }
    }

    public function turnstileEnabled(): bool
    {
        $secret = trim((string) config('services.turnstile.secret_key'));
        $site = trim((string) config('services.turnstile.site_key'));

        return $secret !== '' && $site !== '';
    }

    private function assertTurnstile(string $token): void
    {
        $secret = trim((string) config('services.turnstile.secret_key'));
        if ($secret === '') {
            throw ValidationException::withMessages([
                'captcha' => ['Cloudflare Turnstile is not configured on the server.'],
            ]);
        }

        try {
            $response = Http::asForm()
                ->timeout(8)
                ->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                    'secret' => $secret,
                    'response' => $token,
                    'remoteip' => request()->ip(),
                ]);
        } catch (\Throwable $e) {
            report($e);
            throw ValidationException::withMessages([
                'captcha' => ['Could not verify captcha. Try again.'],
            ]);
        }

        $payload = $response->json();
        if (! ($payload['success'] ?? false)) {
            throw ValidationException::withMessages([
                'captcha' => ['Captcha verification failed. Please try again.'],
            ]);
        }
    }

    private function looksLikeTurnstileToken(string $answer): bool
    {
        // Turnstile tokens are long opaque strings; math answers are short numbers.
        return strlen($answer) > 40;
    }

    private function key(string $id): string
    {
        return 'joborio:captcha:'.$id;
    }
}
