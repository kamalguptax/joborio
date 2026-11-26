<?php

namespace App\Services\Publishers;

use App\Models\MemberSettlementRecord;
use App\Models\Publisher;
use App\Models\User;
use App\Services\Notifications\UserNotificationService;
use App\Services\Payments\PaymentEvidenceService;
use App\Services\Payments\WithdrawalService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class MemberSettlementService
{
    public function __construct(
        private PaymentEvidenceService $evidence,
        private PublisherLedgerService $ledger,
        private WithdrawalService $withdrawals,
        private UserNotificationService $notifications,
    ) {}

    /**
     * Wallet funds available to release member payments
     * (payable minus pending/approved withdrawal holds).
     */
    public function availableWalletUsd(Publisher $publisher): float
    {
        return $this->withdrawals->availableUsd('publisher', (int) $publisher->id);
    }

    /**
     * @param  array{evidence_note?: string|null, notes?: string|null}  $meta
     */
    public function releaseWithEvidence(
        MemberSettlementRecord $settlement,
        Publisher $publisher,
        UploadedFile $evidenceFile,
        User $releasedBy,
        array $meta = [],
    ): MemberSettlementRecord {
        if ((int) $settlement->publisher_id !== (int) $publisher->id) {
            throw new InvalidArgumentException('Settlement does not belong to this publisher.');
        }

        if ($settlement->status === 'settled') {
            throw new InvalidArgumentException('Settlement is already released.');
        }

        if ($settlement->status === 'cancelled') {
            throw new InvalidArgumentException('Cancelled settlements cannot be released.');
        }

        $amount = round((float) $settlement->amount_usd, 4);
        if ($amount <= 0) {
            throw new InvalidArgumentException('Settlement amount must be greater than zero.');
        }

        $member = $settlement->networkMember;
        $payout = $this->withdrawals->defaultAccountPayload($member);
        if (! ($payout['has_default'] ?? false)) {
            throw new InvalidArgumentException(
                'This member has not added payout account details yet. Ask them to save bank/UPI details in their wallet before you release.',
            );
        }

        $available = $this->availableWalletUsd($publisher);
        if ($amount > $available) {
            throw new InvalidArgumentException(
                'Insufficient wallet balance to release this payment. Available '
                .number_format($available, 2).' USD, required '
                .number_format($amount, 2).' USD. Wait until more commission is payable.',
            );
        }

        $stored = $this->evidence->store(
            $evidenceFile,
            'payment-evidence/member-settlements/'.$settlement->id,
        );

        return DB::transaction(function () use (
            $settlement,
            $publisher,
            $stored,
            $releasedBy,
            $meta,
            $amount,
            $available,
            $payout,
        ) {
            // Re-check inside the transaction against a fresh balance.
            $stillAvailable = $this->availableWalletUsd($publisher);
            if ($amount > $stillAvailable) {
                throw new InvalidArgumentException(
                    'Insufficient wallet balance to release this payment. Available '
                    .number_format($stillAvailable, 2).' USD.',
                );
            }

            $this->ledger->post($publisher, [
                'entry_type' => 'debit',
                'source' => 'settlement',
                'state' => 'payable',
                'gross_usd' => $amount,
                'platform_fee_usd' => 0,
                'net_usd' => $amount,
                'community_id' => $settlement->community_id,
                'reference' => 'Member payout #'.$settlement->id,
                'idempotency_key' => 'member-settle-release-'.$settlement->id,
                'meta' => [
                    'member_settlement_id' => $settlement->id,
                    'network_member_id' => $settlement->network_member_id,
                    'wallet_available_before_usd' => $available,
                    'released_by_user_id' => $releasedBy->id,
                ],
            ]);

            $methodLabel = match ($payout['payout_method'] ?? null) {
                'upi' => 'UPI',
                'paypal' => 'PayPal',
                'bank_transfer' => 'Bank',
                default => 'Payout account',
            };
            $payoutNote = 'Paid to '.$methodLabel.': '.($payout['summary'] ?? '');
            $settlement->update([
                'status' => 'settled',
                'settled_at' => now(),
                'settled_by_user_id' => $releasedBy->id,
                'notes' => trim(($meta['notes'] ?? $settlement->notes ?? '')."\n".$payoutNote),
                'evidence_path' => $stored['evidence_path'],
                'evidence_original_name' => $stored['evidence_original_name'],
                'evidence_mime' => $stored['evidence_mime'],
                'evidence_size' => $stored['evidence_size'],
                'evidence_uploaded_at' => $stored['evidence_uploaded_at'],
                'evidence_note' => $meta['evidence_note'] ?? null,
            ]);

            $fresh = $settlement->fresh([
                'networkMember:id,display_name,user_id',
                'networkMember.user:id,name,email',
                'community:id,code,name',
            ]);

            $memberUser = $fresh?->networkMember?->user;
            if ($memberUser) {
                $this->notifications->notify(
                    $memberUser,
                    'member_payment_released',
                    'Payment added to your wallet',
                    'Your publisher released $'.number_format($amount, 2)
                        .' to your wallet. Open Wallet to withdraw to your bank/UPI account.',
                    [
                        'settlement_id' => $settlement->id,
                        'amount_usd' => $amount,
                    ],
                );
            }

            return $fresh;
        });
    }
}
