<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\User;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Role;
use App\Models\Notification;
use App\Events\MessageSent;
use App\Events\NotificationCreated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MessageController extends Controller
{
    /**
     * List messaging threads (inbox).
     */
    public function index()
    {
        $user = auth()->guard('api')->user();
        $student = $user->student;
        $classId = $student ? $student->class_id : null;

        // Fetch thread starters (parent_id is null) where the user is involved:
        // - Sent by user
        // - Received by user
        // - Broadcast to user's class
        // OR the thread has replies where user is involved
        $threads = Message::with(['sender', 'receiver', 'classe', 'replies.sender'])
            ->whereNull('parent_id')
            ->where(function ($query) use ($user, $classId) {
                $query->where('sender_id', $user->id)
                      ->orWhere('receiver_id', $user->id)
                      ->orWhere(function ($q) use ($classId) {
                          if ($classId) {
                              $q->where('class_id', $classId);
                          } else {
                              $q->whereRaw('1 = 0'); // False condition if no class
                          }
                      })
                      ->orWhereHas('replies', function ($q) use ($user) {
                          $q->where('sender_id', $user->id)
                            ->orWhere('receiver_id', $user->id);
                      });
            })
            ->orderBy('updated_at', 'desc')
            ->get();

        // Calculate unread status per thread
        $threads->map(function ($thread) use ($user) {
            $isUnread = false;

            // Check parent message
            if ($thread->sender_id !== $user->id) {
                if ($thread->class_id) {
                    $readBy = $thread->read_by ?? [];
                    if (!in_array($user->id, $readBy)) {
                        $isUnread = true;
                    }
                } else {
                    if (!$thread->is_read) {
                        $isUnread = true;
                    }
                }
            }

            // Check replies
            foreach ($thread->replies as $reply) {
                if ($reply->sender_id !== $user->id && !$reply->is_read) {
                    $isUnread = true;
                    break;
                }
            }

            $thread->is_unread = $isUnread;
            return $thread;
        });

        return response()->json($threads);
    }

    /**
     * Send a new message or broadcast.
     */
    public function store(Request $request)
    {
        $user = auth()->guard('api')->user();

        $request->validate([
            'subject' => 'nullable|required_without:parent_id|string|max:255',
            'body' => 'required|string',
            'receiver_id' => 'nullable|exists:users,id',
            'class_id' => 'nullable|exists:classes,id',
            'parent_id' => 'nullable|exists:messages,id',
        ]);

        // Security check for Teacher role
        if ($user && $user->role && $user->role->name === 'Teacher') {
            $teacher = $user->teacher;
            if (!$teacher) {
                abort(403, 'Unauthorized action.');
            }

            // 1. Class Broadcast security check
            if ($request->class_id) {
                if (!$teacher->classes()->where('classes.id', $request->class_id)->exists()) {
                    return response()->json(['message' => 'You are not authorized to broadcast to this class'], 403);
                }
            }

            // 2. Direct message/Reply receiver security check
            $targetReceiverId = $request->receiver_id;
            if (!$targetReceiverId && $request->parent_id) {
                $parent = Message::findOrFail($request->parent_id);
                $targetReceiverId = ($parent->sender_id === $user->id) ? $parent->receiver_id : $parent->sender_id;
                if (!$targetReceiverId && $parent->class_id) {
                    $targetReceiverId = $parent->sender_id;
                }
            }

            if ($targetReceiverId) {
                $receiverUser = User::with(['role', 'student'])->find($targetReceiverId);
                if ($receiverUser && $receiverUser->role) {
                    $receiverRole = $receiverUser->role->name;
                    if ($receiverRole === 'Student') {
                        $student = $receiverUser->student;
                        if (!$student || !$teacher->classes()->where('classes.id', $student->class_id)->exists()) {
                            return response()->json(['message' => 'You are not authorized to message this student'], 403);
                        }
                    }
                }
            }
        }

        $parentId = $request->parent_id;
        $message = null;

        if ($parentId) {
            // Reply flow
            $parent = Message::findOrFail($parentId);
            $subject = str_starts_with($parent->subject, 'Re:') ? $parent->subject : 'Re: ' . $parent->subject;
            
            // Determine receiver:
            // If replying to class-based broadcast, student sends to original teacher (parent sender)
            // Otherwise, reply goes to the other participant in the thread
            $receiverId = $request->receiver_id;
            if (!$receiverId) {
                $receiverId = ($parent->sender_id === $user->id) ? $parent->receiver_id : $parent->sender_id;
            }

            // If receiverId is still empty (e.g. replying to class message), default to class message sender
            if (!$receiverId && $parent->class_id) {
                $receiverId = $parent->sender_id;
            }

            $message = Message::create([
                'sender_id' => $user->id,
                'receiver_id' => $receiverId,
                'parent_id' => $parentId,
                'subject' => $subject,
                'body' => $request->body,
                'is_read' => false,
            ]);

            // Update parent thread updated_at timestamp to bubble up in inbox
            $parent->touch();

            // Notify receiver
            if ($receiverId) {
                $notification = Notification::create([
                    'user_id' => $receiverId,
                    'title' => 'Nouveau message reçu',
                    'message' => "{$user->first_name} {$user->last_name} a répondu à votre message: \"{$subject}\"",
                    'type' => 'message',
                    'is_read' => false,
                ]);
                broadcast(new NotificationCreated($notification))->toOthers();
            }
        } else {
            // New Thread flow
            if ($request->class_id) {
                // Class Broadcast (Allowed for Teacher, Scolarite, Admin)
                $role = $user->role->name;
                if (!in_array($role, ['Teacher', 'Scolarite', 'Admin'])) {
                    return response()->json(['message' => 'Unauthorized to send class broadcasts'], 403);
                }

                $message = Message::create([
                    'sender_id' => $user->id,
                    'class_id' => $request->class_id,
                    'subject' => $request->subject,
                    'body' => $request->body,
                    'read_by' => [],
                ]);

                // Notify all students in class
                $students = Student::where('class_id', $request->class_id)->get();
                foreach ($students as $stud) {
                    $notification = Notification::create([
                        'user_id' => $stud->user_id,
                        'title' => 'Nouveau message de classe',
                        'message' => "{$user->first_name} {$user->last_name} a publié dans votre groupe: \"{$request->subject}\"",
                        'type' => 'message',
                        'is_read' => false,
                    ]);
                    broadcast(new NotificationCreated($notification))->toOthers();
                }
            } else {
                // Direct Message
                if (!$request->receiver_id) {
                    return response()->json(['message' => 'Receiver is required for direct messages'], 422);
                }

                $message = Message::create([
                    'sender_id' => $user->id,
                    'receiver_id' => $request->receiver_id,
                    'subject' => $request->subject,
                    'body' => $request->body,
                    'is_read' => false,
                ]);

                // Notify receiver
                $notification = Notification::create([
                    'user_id' => $request->receiver_id,
                    'title' => 'Nouveau message reçu',
                    'message' => "Vous avez reçu un nouveau message de {$user->first_name} {$user->last_name}: \"{$request->subject}\"",
                    'type' => 'message',
                    'is_read' => false,
                ]);
                broadcast(new NotificationCreated($notification))->toOthers();
            }
        }

        broadcast(new MessageSent($message))->toOthers();

        return response()->json($message->load(['sender', 'receiver', 'classe']), 201);
    }

    /**
     * Mark message/thread as read.
     */
    public function markAsRead($id)
    {
        $user = auth()->guard('api')->user();
        $message = Message::findOrFail($id);

        if ($message->class_id) {
            // For class broadcast, append user to read_by array
            $readBy = $message->read_by ?? [];
            if (!in_array($user->id, $readBy)) {
                $readBy[] = $user->id;
                $message->update(['read_by' => $readBy]);
            }
        } else {
            // For direct messages/replies
            if ($message->receiver_id === $user->id) {
                $message->update(['is_read' => true]);
            }
        }

        // Also mark any replies inside this thread as read
        if (!$message->parent_id) {
            Message::where('parent_id', $message->id)
                ->where('receiver_id', $user->id)
                ->where('is_read', false)
                ->update(['is_read' => true]);
        }

        return response()->json(['message' => 'Thread marked as read']);
    }

    /**
     * Get possible messaging partners based on role permissions.
     */
    public function getPartners()
    {
        $user = auth()->guard('api')->user();
        $role = $user->role->name;

        $partners = collect();

        if ($role === 'Student') {
            // Student can message Teachers and Scolarite
            $teacherRole = Role::where('name', 'Teacher')->first();
            $scolariteRole = Role::where('name', 'Scolarite')->first();

            $partners = User::whereIn('role_id', [$teacherRole?->id, $scolariteRole?->id])
                ->orderBy('first_name')
                ->get();
        } elseif ($role === 'Teacher') {
            // Teacher can message Students of their assigned classes and Scolarite
            $scolariteRole = Role::where('name', 'Scolarite')->first();
            $scolariteUsers = User::where('role_id', $scolariteRole?->id)->get();

            $teacher = $user->teacher;
            $studentUsers = collect();
            if ($teacher) {
                $classIds = $teacher->classes()->pluck('classes.id')->toArray();
                $studentUsers = User::whereHas('student', function ($q) use ($classIds) {
                    $q->whereIn('class_id', $classIds);
                })->get();
            }

            $partners = $scolariteUsers->concat($studentUsers);
        } elseif ($role === 'Scolarite') {
            // Scolarite can message Students and Teachers
            $studentRole = Role::where('name', 'Student')->first();
            $teacherRole = Role::where('name', 'Teacher')->first();

            $partners = User::whereIn('role_id', [$studentRole?->id, $teacherRole?->id])
                ->orderBy('first_name')
                ->get();
        } elseif ($role === 'Finance Officer' || $role === 'Internship Manager') {
            // Finance/Internship Manager can message Students
            $studentRole = Role::where('name', 'Student')->first();

            $partners = User::where('role_id', $studentRole?->id)
                ->orderBy('first_name')
                ->get();
        } elseif ($role === 'Admin') {
            // Admin can message anyone
            $partners = User::where('id', '!=', $user->id)
                ->orderBy('first_name')
                ->get();
        }

        // Return id, name, and role for select components
        $formatted = $partners->map(function ($p) {
            return [
                'id' => $p->id,
                'name' => $p->first_name . ' ' . $p->last_name,
                'email' => $p->email,
                'role' => $p->role?->name,
            ];
        });

        return response()->json($formatted);
    }
}
