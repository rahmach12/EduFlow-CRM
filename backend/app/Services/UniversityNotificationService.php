<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

class UniversityNotificationService
{
    public function notifyUser(User $user, string $title, string $message, ?string $type = null, array $data = []): Notification
    {
        return Notification::create([
            'user_id' => $user->id,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'data' => $data ?: null,
            'is_read' => false,
        ]);
    }

    public function notifyRole(string $role, string $title, string $message, ?string $type = null, array $data = []): Notification
    {
        return Notification::create([
            'role' => $role,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'data' => $data ?: null,
            'is_read' => false,
        ]);
    }
}
