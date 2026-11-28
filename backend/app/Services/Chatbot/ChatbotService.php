<?php

namespace App\Services\Chatbot;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Site-wide assistant.
 *
 * 1. If CHATBOT_API_KEY is set, asks an OpenAI-compatible chat endpoint
 *    (default: Google Gemini free tier) with a JobOrio-only system prompt.
 * 2. If there is no key, the provider fails, or the free daily caps are used up,
 *    it answers from the built-in knowledge base below. That path costs nothing
 *    and never breaks the chat.
 */
class ChatbotService
{
    /**
     * Facts the bot may state. Keep in sync with the product (these replace the old /faq page).
     *
     * @var array<int, array{id: string, keywords: array<int, string>, answer: string}>
     */
    private const KNOWLEDGE = [
        [
            'id' => 'how',
            'keywords' => ['how does', 'how it works', 'kaise', 'work', 'kaam', 'what is joborio', 'joborio kya'],
            'answer' => 'You share tracked job, course and campaign links with your audience. When someone clicks, signs up or applies through your link, you earn for those qualified actions. The more relevant shares you make, the more you can earn.',
        ],
        [
            'id' => 'earnings',
            'keywords' => ['75', 'keep', 'earning', 'earn', 'kamai', 'kitna', 'commission', 'fee', 'revenue', 'paisa', 'paise'],
            'answer' => 'Creators typically keep about 75% of qualified revenue. Upclift\'s platform fee is usually around 25%. Exact rates can be adjusted in platform settings, but the model is designed so you keep the majority of what you earn.',
        ],
        [
            'id' => 'refer',
            'keywords' => ['refer', 'referral', 'invite', 'code', 'ref'],
            'answer' => 'With Refer & Earn you share your referral link or code. When someone signs up with it and starts earning, you receive a share of Upclift\'s platform fee on their earnings (typically 2-5%) for a limited period. It is paid from the platform\'s cut, not from theirs. You can enter a code in the optional field on signup, or open an invite link that includes ?ref=CODE. Details: /refer-and-earn',
        ],
        [
            'id' => 'payout',
            'keywords' => ['payout', 'payment', 'withdraw', 'paid', 'get paid', 'minimum', 'hold', 'bank', 'upi'],
            'answer' => 'Earnings move through a short hold window, then become payable. Once you reach the minimum payout threshold you can withdraw to your linked payout method. Timing depends on the earning type and verification. Add your payout account from your dashboard.',
        ],
        [
            'id' => 'free',
            'keywords' => ['free', 'price', 'cost', 'charge', 'muft', 'fees to join'],
            'answer' => 'Yes, it is free for creators. Creating a profile, browsing opportunities and sharing links needs no upfront fee. Upclift earns through the platform fee on qualified revenue, not by charging you to join.',
        ],
        [
            'id' => 'signup',
            'keywords' => ['sign up', 'signup', 'register', 'account', 'join', 'login', 'log in', 'password'],
            'answer' => 'You can create an account at /signup as a creator, employer, brand or partner. If you forgot your password, use /forgot-password.',
        ],
        [
            'id' => 'jobs',
            'keywords' => ['job', 'jobs', 'opportunit', 'naukri', 'vacancy', 'apply'],
            'answer' => 'Browse live jobs and opportunities at /jobs and /opportunities. Creators can pick one that fits their audience and share its tracked link.',
        ],
        [
            'id' => 'brands',
            'keywords' => ['brand', 'employer', 'hire', 'hiring', 'campaign', 'partner', 'advertis'],
            'answer' => 'Brands and employers can run creator-led hiring campaigns. Start at /brands, or see /partners if you want to work with Upclift.',
        ],
        [
            'id' => 'feedback',
            'keywords' => ['feedback', 'suggest', 'complain', 'bug', 'problem', 'issue'],
            'answer' => 'We would love to hear it. Share feedback or report a problem at /feedback.',
        ],
        [
            'id' => 'contact',
            'keywords' => ['contact', 'support', 'help', 'email', 'human', 'agent', 'madad'],
            'answer' => 'You can reach the team at hello@joborio.com or through /contact. Include your account email and public creator code so we can help faster.',
        ],
    ];

    private const GREETING_WORDS = ['hi', 'hello', 'hey', 'hii', 'namaste', 'hlo', 'good morning', 'good evening'];

    /**
     * @param  array<int, array{role: string, content: string}>  $messages
     * @return array{reply: string, source: string}
     */
    public function reply(array $messages, string $ip): array
    {
        $messages = array_slice($messages, -8);
        $last = '';
        foreach (array_reverse($messages) as $m) {
            if (($m['role'] ?? '') === 'user') {
                $last = trim((string) $m['content']);
                break;
            }
        }

        if ($last === '') {
            return ['reply' => $this->fallbackIntro(), 'source' => 'kb'];
        }

        if ($this->canUseAi($ip)) {
            $ai = $this->askProvider($messages);
            if ($ai !== null) {
                $this->countAiUse($ip);

                return ['reply' => $ai, 'source' => 'ai'];
            }
        }

        return ['reply' => $this->answerFromKnowledge($last), 'source' => 'kb'];
    }

    private function canUseAi(string $ip): bool
    {
        if (! config('services.chatbot.enabled') || blank(config('services.chatbot.api_key'))) {
            return false;
        }

        $perIp = (int) config('services.chatbot.daily_limit_per_ip', 40);
        $global = (int) config('services.chatbot.daily_limit_global', 400);

        return (int) Cache::get($this->key('ip:'.sha1($ip)), 0) < $perIp
            && (int) Cache::get($this->key('global'), 0) < $global;
    }

    private function countAiUse(string $ip): void
    {
        foreach ([$this->key('ip:'.sha1($ip)), $this->key('global')] as $k) {
            Cache::add($k, 0, now()->endOfDay());
            Cache::increment($k);
        }
    }

    private function key(string $suffix): string
    {
        return 'chatbot:'.now()->format('Ymd').':'.$suffix;
    }

    /** @param array<int, array{role: string, content: string}> $messages */
    private function askProvider(array $messages): ?string
    {
        $base = rtrim((string) config('services.chatbot.base_url'), '/');
        $payload = [
            'model' => config('services.chatbot.model'),
            'temperature' => 0.3,
            'max_tokens' => (int) config('services.chatbot.max_tokens', 400),
            'messages' => array_merge(
                [['role' => 'system', 'content' => $this->systemPrompt()]],
                array_map(fn ($m) => [
                    'role' => $m['role'],
                    'content' => Str::limit((string) $m['content'], 1000, ''),
                ], $messages),
            ),
        ];

        try {
            $res = Http::timeout(20)
                ->acceptJson()
                ->withToken((string) config('services.chatbot.api_key'))
                ->post($base.'/chat/completions', $payload);

            if (! $res->successful()) {
                Log::warning('chatbot provider error', ['status' => $res->status()]);

                return null;
            }

            $text = trim((string) data_get($res->json(), 'choices.0.message.content', ''));

            return $text !== '' ? Str::limit($text, 1500, '') : null;
        } catch (\Throwable $e) {
            Log::warning('chatbot provider failed', ['error' => $e->getMessage()]);

            return null;
        }
    }

    private function systemPrompt(): string
    {
        $facts = collect(self::KNOWLEDGE)->map(fn ($k) => '- '.$k['answer'])->implode("\n");

        return "You are the Upclift Assistant, a friendly help bot on the Upclift website.\n"
            ."Upclift is a platform where creators share tracked job, course and campaign links and earn on verified clicks and registrations, and where brands and employers run creator-led hiring.\n\n"
            ."Rules:\n"
            ."- Answer only about Upclift and using the site. For anything unrelated, politely say you can only help with Upclift.\n"
            ."- Reply in the same language the user writes in (English, Hindi or Hinglish). Keep answers short, at most 4 sentences.\n"
            ."- Use only the facts below. Never invent prices, percentages, dates or policies. If you are not sure, say so and point to /contact (hello@joborio.com).\n"
            ."- For account-specific, payment or security problems, ask the user to contact support via /contact. Never ask for passwords or OTPs.\n"
            ."- Useful pages: /signup, /jobs, /opportunities, /refer-and-earn, /brands, /partners, /feedback, /contact.\n\n"
            ."Facts:\n".$facts;
    }

    private function answerFromKnowledge(string $question): string
    {
        $q = Str::lower($question);

        $words = preg_split('/[^a-z0-9]+/', $q, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        if (count($words) <= 3 && collect(self::GREETING_WORDS)->contains(fn ($g) => str_contains($q, $g))) {
            return $this->fallbackIntro();
        }

        $best = null;
        $bestScore = 0;
        foreach (self::KNOWLEDGE as $entry) {
            $score = 0;
            foreach ($entry['keywords'] as $kw) {
                if (str_contains($q, $kw)) {
                    $score += str_contains($kw, ' ') ? 2 : 1;
                }
            }
            if ($score > $bestScore) {
                $bestScore = $score;
                $best = $entry;
            }
        }

        if ($best !== null) {
            return $best['answer'];
        }

        return "I am not sure about that one. I can help with earnings, Refer & Earn, payouts, jobs and signing up. For anything else, write to hello@joborio.com or use /contact, and the team will get back to you.";
    }

    private function fallbackIntro(): string
    {
        return "Hi! I'm the Upclift Assistant. Ask me about earnings, Refer & Earn, payouts, jobs or signing up.";
    }
}
