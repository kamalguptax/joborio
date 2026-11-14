<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BrandVerificationOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $brandName,
        public string $otp,
        public string $verifyUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Verify your JobOrio brand account',
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlString: <<<HTML
                <div style="font-family:ui-sans-serif,system-ui,sans-serif;line-height:1.5;color:#0F1B3D">
                  <h2 style="margin:0 0 12px">Verify your brand account</h2>
                  <p>Hi {$this->brandName},</p>
                  <p>Use this one-time code to activate your JobOrio brand account:</p>
                  <p style="font-size:28px;font-weight:700;letter-spacing:0.2em;margin:20px 0">{$this->otp}</p>
                  <p>Or open this link: <a href="{$this->verifyUrl}">{$this->verifyUrl}</a></p>
                  <p style="color:#64748b;font-size:13px">This code expires in 15 minutes.</p>
                </div>
                HTML
        );
    }
}
