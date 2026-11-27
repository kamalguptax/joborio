<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordChangeOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $name,
        public string $otp,
        public int $expiresInMinutes = 10,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your JobOrio password change code',
        );
    }

    public function content(): Content
    {
        $name = e($this->name);
        $otp = e($this->otp);

        return new Content(
            htmlString: <<<HTML
                <div style="font-family:ui-sans-serif,system-ui,sans-serif;line-height:1.5;color:#0F1B3D">
                  <h2 style="margin:0 0 12px">Confirm your password change</h2>
                  <p>Hi {$name},</p>
                  <p>Use this one-time code to change your JobOrio password:</p>
                  <p style="font-size:28px;font-weight:700;letter-spacing:0.2em;margin:20px 0">{$otp}</p>
                  <p style="color:#64748b;font-size:13px">This code expires in {$this->expiresInMinutes} minutes. If you did not ask for it, ignore this email and consider changing your password.</p>
                </div>
                HTML
        );
    }
}
