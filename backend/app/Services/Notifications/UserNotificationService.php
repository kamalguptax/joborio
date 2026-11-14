<?php

namespace App\Services\Notifications;

use App\Mail\JobOrioNotificationMail;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class UserNotificationService
{
    public function notify(
        User $user,
        string $type,
        string $title,
        string $body,
        array $meta = [],
    ): UserNotification {
        $row = UserNotification::create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'meta' => $meta,
        ]);

        Log::info('joborio.notification', [
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
        ]);

        $this->sendEmailIfEnabled($user, $type, $title, $body);

        return $row;
    }

    public function notifyCreatorUser(
        \App\Models\Creator $creator,
        string $type,
        string $title,
        string $body,
        array $meta = [],
    ): ?UserNotification {
        $user = $creator->user;
        if (! $user) {
            return null;
        }

        return $this->notify($user, $type, $title, $body, $meta);
    }

    private function sendEmailIfEnabled(User $user, string $type, string $title, string $body): void
    {
        if (! config('joborio.notifications.email_enabled', true)) {
            return;
        }

        if (! $user->email) {
            return;
        }

        $skip = config('joborio.notifications.email_skip_types', []);
        if (in_array($type, $skip, true)) {
            return;
        }

        try {
            Mail::to($user->email)->send(new JobOrioNotificationMail($title, $body, $type));
        } catch (\Throwable $e) {
            Log::warning('joborio.notification_email_failed', [
                'user_id' => $user->id,
                'type' => $type,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
