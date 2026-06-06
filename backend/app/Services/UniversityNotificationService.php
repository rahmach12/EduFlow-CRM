<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Events\NotificationCreated;

class UniversityNotificationService
{
    public function notifyUser(User $user, string $title, string $message, ?string $type = null, array $data = []): Notification
    {
        $notification = Notification::create([
            'user_id' => $user->id,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'data' => $data ?: null,
            'is_read' => false,
        ]);

        event(new NotificationCreated($notification));

        return $notification;
    }

    public function notifyRole(string $role, string $title, string $message, ?string $type = null, array $data = []): Notification
    {
        $notification = Notification::create([
            'role' => $role,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'data' => $data ?: null,
            'is_read' => false,
        ]);

        event(new NotificationCreated($notification));

        return $notification;
    }
}
