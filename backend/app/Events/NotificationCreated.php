<?php

namespace App\Events;

use App\Models\Notification;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NotificationCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $notification;

    /**
     * Create a new event instance.
     */
    public function __construct(Notification $notification)
    {
        $this->notification = $notification;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        // Broadcast on a public channel called 'notifications' for role-wide, 
        // or private channel for user-specific. 
        // To keep it simple for the MVP, let's use a public channel 'school-crm-notifications'
        // or multiple channels.
        $channels = [];
        if ($this->notification->user_id) {
            $channels[] = new Channel('user.' . $this->notification->user_id);
        } elseif ($this->notification->role) {
            $channels[] = new Channel('role.' . strtolower(str_replace(' ', '', $this->notification->role)));
        } else {
            $channels[] = new Channel('global-notifications');
        }
        return $channels;
    }

    public function broadcastAs()
    {
        return 'NotificationCreated';
    }
}

