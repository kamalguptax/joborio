<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordResetMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $name,
        public string $resetUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Reset your JobOrio password',
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlString: <<<HTML
                <div style="font-family:ui-sans-serif,system-ui,sans-serif;line-height:1.5;color:#0F1B3D">
                  <h2 style="margin:0 0 12px">Reset password</h2>
                  <p>Hi {$this->name},</p>
                  <p>We received a request to reset your JobOrio password.</p>
                  <p><a href="{$this->resetUrl}" style="display:inline-block;padding:12px 20px;background:#7C3AED;color:#fff;border-radius:999px;text-decoration:none;font-weight:600">Reset password</a></p>
                  <p style="color:#64748b;font-size:13px">If you did not request this, you can ignore this email. Link expires in 60 minutes.</p>
                </div>
                HTML
        );
    }
}
