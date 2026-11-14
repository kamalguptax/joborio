<?php

namespace App\Http\Controllers\Api\V1\Creator;

use App\Http\Controllers\Controller;
use App\Models\UserNotification;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $unreadOnly = $request->boolean('unread');

        $query = UserNotification::query()
            ->where('user_id', $user->id)
            ->latest();

        if ($unreadOnly) {
            $query->whereNull('read_at');
        }

        $items = $query->limit(50)->get();

        return $this->success($items, 200, [
            'unread_count' => UserNotification::where('user_id', $user->id)->whereNull('read_at')->count(),
        ]);
    }

    public function markRead(Request $request, UserNotification $userNotification): JsonResponse
    {
        if ($userNotification->user_id !== $request->user()->id) {
            return $this->error('FORBIDDEN', 'Not your notification.', 403);
        }

        $userNotification->update(['read_at' => now()]);

        return $this->success($userNotification);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        UserNotification::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return $this->success(['ok' => true]);
    }
}
