<?php

namespace App\Http\Controllers;

use App\Models\AttendanceSession;
use App\Models\AttendanceRecord;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->guard('api')->user();
        $role = $user->role->name;
        $userId = $user->id;

        $query = AttendanceSession::with(['classe', 'subject', 'teacher.user', 'records.student.user']);

        if ($role === 'Teacher') {
            $query->whereHas('teacher', fn($q) => $q->where('user_id', $userId));
        }

        if ($role === 'Student') {
            // Filter sessions to only those where this student has a record,
            // and load only their specific record to prevent data leaking
            $query->whereHas('records.student', fn($q) => $q->where('user_id', $userId))
                  ->with(['records' => function($q) use ($userId) {
                      $q->whereHas('student', fn($s) => $s->where('user_id', $userId));
                  }]);
        }

        return response()->json($query->orderBy('date', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'class_id' => 'required|exists:classes,id',
            'subject_id' => 'required|exists:subjects,id',
            'date' => 'required|date',
            'start_time' => 'required',
            'end_time' => 'required',
            'records' => 'required|array',
            'records.*.student_id' => 'required|exists:students,id',
            'records.*.status' => 'required|in:present,absent,late',
            'records.*.reason' => 'nullable|string'
        ]);

        $teacherId = auth()->guard('api')->user()->teacher->id ?? 1;

        $session = AttendanceSession::create([
            'class_id' => $validated['class_id'],
            'subject_id' => $validated['subject_id'],
            'teacher_id' => $teacherId,
            'date' => $validated['date'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time']
        ]);

        foreach ($validated['records'] as $rec) {
            $record = AttendanceRecord::create([
                'session_id' => $session->id,
                'student_id' => $rec['student_id'],
                'status' => $rec['status'],
                'reason' => $rec['reason'] ?? null
            ]);

            if ($rec['status'] === 'absent') {
                $studentUser = \App\Models\Student::find($rec['student_id'])->user;
                $subject = \App\Models\Subject::find($validated['subject_id']);

                // simple absence notification
                $absenceNotif = \App\Models\Notification::create([
                    'user_id' => $studentUser->id,
                    'title' => 'Absence Logged',
                    'message' => "You were marked absent in {$subject->name} on {$validated['date']}.",
                    'is_read' => false
                ]);
                broadcast(new \App\Events\NotificationCreated($absenceNotif))->toOthers();

                // check 30% rule
                $absenceCount = \App\Models\AttendanceRecord::where('student_id', $rec['student_id'])
                                    ->where('status', 'absent')
                                    ->count();
                $rate = ($absenceCount / 50) * 100; // Assuming 50 total sessions approximation
                if ($rate >= 30) {
                    $warnNotif = \App\Models\Notification::create([
                        'user_id' => $studentUser->id,
                        'title' => 'Elimination Warning',
                        'message' => "Your absence rate has reached " . round($rate, 1) . "% (Tunisian 30% rule). You are at risk of being eliminated.",
                        'is_read' => false
                    ]);
                    broadcast(new \App\Events\NotificationCreated($warnNotif))->toOthers();
                }
            }
        }

        return response()->json([
            'message' => 'Attendance session created!', 
            'session' => $session->load('records')
        ], 201);
    }
}
