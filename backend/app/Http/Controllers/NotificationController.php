<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->guard('api')->user();
        if (! $user) {
            return response()->json([]);
        }

        $notifications = Notification::where(function ($query) use ($user) {
            $query->where('user_id', $user->id)
                ->orWhere('role', $user->role->name)
                ->orWhere(function ($publicQuery) {
                    $publicQuery->whereNull('user_id')->whereNull('role');
                });
        })->orderBy('created_at', 'desc')->get();

        return response()->json($notifications);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'message' => 'required|string',
            'role' => 'nullable|string',
            'user_id' => 'nullable|exists:users,id',
            'type' => 'nullable|string',
            'data' => 'nullable|array',
        ]);

        $notification = Notification::create([
            'title' => $validated['title'],
            'message' => $validated['message'],
            'role' => $validated['role'] ?? null,
            'user_id' => $validated['user_id'] ?? null,
            'type' => $validated['type'] ?? null,
            'data' => $validated['data'] ?? null,
            'is_read' => false,
        ]);

        broadcast(new \App\Events\NotificationCreated($notification))->toOthers();

        return response()->json($notification, 201);
    }

    public function markAsRead(Notification $notification)
    {
        $notification->update(['is_read' => true]);
        return response()->json(['message' => 'Notification marked as read']);
    }
}
