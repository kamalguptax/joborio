<?php

namespace App\Services\Ppr;

use App\Models\AttributionEvent;
use App\Models\Creator;
use App\Models\Listing;
use App\Models\PprRegistration;
use App\Models\TrackingToken;
use App\Services\Earnings\EarningLedgerService;
use App\Services\Fraud\FraudDetectionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PprRegistrationService
{
    public function __construct(
        private FraudDetectionService $fraud,
        private EarningLedgerService $earnings,
        private \App\Services\Creators\TrustTierService $trustTiers,
    ) {}

    /**
     * @return array{registration: PprRegistration, verification_url: string|null}
     */
    public function recordFromWebhook(string $tokenValue, string $email, Request $request, array $meta = []): array
    {
        $email = Str::lower(trim($email));

        $token = TrackingToken::query()->where('token', $tokenValue)->firstOrFail();
        $creator = $token->creator;
        $listing = $token->listing;

        if (! $this->creatorCanEarnPpr($creator)) {
            abort(422, 'Creator trust tier does not allow PPR yet.');
        }

        if ($this->isDisposableEmail($email)) {
            abort(422, 'Disposable email addresses are not allowed.');
        }

        $existing = PprRegistration::query()
            ->where('listing_id', $listing->id)
            ->where('email', $email)
            ->first();

        if ($existing) {
            return [
                'registration' => $existing,
                'verification_url' => null,
                'duplicate' => true,
            ];
        }

        $event = AttributionEvent::create([
            'tracking_token_id' => $token->id,
            'creator_id' => $creator->id,
            'listing_id' => $listing->id,
            'event_type' => 'registration',
            'ip_address' => $request->ip(),
            'geo_country' => $this->geoCountry($request),
            'referrer' => $request->headers->get('referer'),
            'is_counted' => false,
            'fraud_status' => 'clean',
            'meta' => array_merge($meta, ['email_domain' => Str::after($email, '@')]),
        ]);

        $fraudResult = $this->fraud->evaluateRegistration($creator, $event);
        if ($fraudResult['block']) {
            $event->update(['fraud_status' => $fraudResult['reason']]);
            if ($fraudResult['queue_review']) {
                $this->fraud->queueReview($event, $fraudResult['reason']);
            }

            $registration = PprRegistration::create([
                'tracking_token_id' => $token->id,
                'creator_id' => $creator->id,
                'listing_id' => $listing->id,
                'email' => $email,
                'status' => 'rejected',
                'attribution_event_id' => $event->id,
                'meta' => $meta,
            ]);

            return ['registration' => $registration, 'verification_url' => null, 'duplicate' => false];
        }

        $plainVerification = Str::random(48);

        $registration = PprRegistration::create([
            'tracking_token_id' => $token->id,
            'creator_id' => $creator->id,
            'listing_id' => $listing->id,
            'email' => $email,
            'status' => 'pending_verification',
            'verification_token' => hash('sha256', $plainVerification),
            'attribution_event_id' => $event->id,
            'meta' => $meta,
        ]);

        $verificationUrl = url("/api/v1/ppr/verify/{$registration->id}?token={$plainVerification}&browser=1");
        $this->dispatchVerificationNotice($registration, $verificationUrl);

        return [
            'registration' => $registration,
            'verification_url' => $verificationUrl,
            'duplicate' => false,
        ];
    }

    public function verify(PprRegistration $registration, string $plainToken): PprRegistration
    {
        if ($registration->status !== 'pending_verification') {
            abort(422, 'Registration is not pending verification.');
        }

        if (! hash_equals((string) $registration->verification_token, hash('sha256', $plainToken))) {
            abort(403, 'Invalid verification token.');
        }

        $hours = config('joborio.ppr_verification_hours', 24);
        if ($registration->created_at->addHours($hours)->isPast()) {
            $registration->update(['status' => 'rejected']);
            abort(422, 'Verification window expired.');
        }

        $event = $registration->attributionEvent;
        if (! $event || $event->fraud_status !== 'clean') {
            abort(422, 'Registration cannot be verified.');
        }

        $event->update(['is_counted' => true]);

        $earning = $this->earnings->createPprEarning(
            $registration->creator,
            $event,
            $registration->listing
        );

        $registration->update([
            'status' => 'verified',
            'email_verified_at' => now(),
            'verification_token' => null,
            'earning_ledger_id' => $earning->id,
        ]);

        return $registration->fresh(['listing', 'earningLedger']);
    }

    public function expireStalePending(): int
    {
        $hours = config('joborio.ppr_verification_hours', 24);
        $cutoff = now()->subHours($hours);

        return PprRegistration::query()
            ->where('status', 'pending_verification')
            ->where('created_at', '<', $cutoff)
            ->update(['status' => 'rejected']);
    }

    private function creatorCanEarnPpr(Creator $creator): bool
    {
        return $this->trustTiers->canEarnPpr($creator);
    }

    private function isDisposableEmail(string $email): bool
    {
        $domain = Str::after($email, '@');
        $blocked = config('joborio.ppr_disposable_domains', [
            'mailinator.com',
            'guerrillamail.com',
            'tempmail.com',
            '10minutemail.com',
        ]);

        return in_array($domain, $blocked, true);
    }

    private function geoCountry(Request $request): ?string
    {
        $geo = $request->header('CF-IPCountry') ?? $request->header('X-Geo-Country');

        return $geo ? strtoupper(substr($geo, 0, 2)) : null;
    }

    private function dispatchVerificationNotice(PprRegistration $registration, string $url): void
    {
        Log::info('joborio.ppr.verification', [
            'registration_id' => $registration->id,
            'email' => $registration->email,
            'verify_url' => $url,
        ]);
    }
}
