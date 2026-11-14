<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class JobOrioNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $title,
        public string $body,
        public string $type,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->title.' — '.config('app.name'),
        );
    }

    public function content(): Content
    {
        $dashboardUrl = rtrim((string) config('joborio.frontend_url'), '/').'/creator/notifications';

        return new Content(
            markdown: 'mail.joborio-notification',
            with: [
                'title' => $this->title,
                'body' => $this->body,
                'type' => $this->type,
                'dashboardUrl' => $dashboardUrl,
            ],
        );
    }
}
