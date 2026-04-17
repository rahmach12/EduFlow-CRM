<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Note;
use App\Models\Student;
use App\Events\NewGradeAdded;

class NoteController extends Controller
{
    public function index()
    {
        $user = auth()->guard('api')->user();
        $role = $user->role->name;

        if ($role === 'Student') {
            // Student sees only their own notes
            return response()->json(
                Note::with(['student.user', 'subject', 'teacher.user'])
                    ->whereHas('student', fn($q) => $q->where('user_id', $user->id))
                    ->get()
            );
        }

        if ($role === 'Teacher') {
            // Teacher sees notes they submitted
            return response()->json(
                Note::with(['student.user', 'subject', 'teacher.user'])
                    ->whereHas('teacher', fn($q) => $q->where('user_id', $user->id))
                    ->get()
            );
        }

        // Admin/Administration see all
        return response()->json(Note::with(['student.user', 'subject', 'teacher.user'])->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'subject_id' => 'required|exists:subjects,id',
            'type' => 'required|in:CC,DS,TP,Exam',
            'value' => 'required|numeric|min:0|max:20'
        ]);

        $data = $request->all();
        // If a teacher submits this, we could infer teacher_id from auth()->user()->teacher->id
        // For now, accept it if provided
        if (auth()->user()->role->name === 'Teacher') {
            $data['teacher_id'] = auth()->user()->teacher->id ?? null;
        }

        $note = Note::create($data);

        // Notify student
        $studentUser = \App\Models\Student::find($data['student_id'])->user;
        $subject = \App\Models\Subject::find($data['subject_id']);
        
        $notification = \App\Models\Notification::create([
            'user_id' => $studentUser->id,
            'title' => 'New Grade Added',
            'message' => "You received a new grade for {$subject->name}.",
            'is_read' => false
        ]);
        
        broadcast(new \App\Events\NotificationCreated($notification))->toOthers();
        
        // Also fire the existing event if needed anywhere else
        if (class_exists(NewGradeAdded::class)) {
            event(new NewGradeAdded($note->load('student.user', 'subject')));
        }

        return response()->json($note->load('student', 'subject', 'teacher'), 201);
    }

    public function show(Note $note)
    {
        return response()->json($note->load(['student', 'subject', 'teacher']));
    }

    public function update(Request $request, Note $note)
    {
        $request->validate([
            'type' => 'sometimes|in:CC,DS,TP,Exam',
            'value' => 'sometimes|numeric|min:0|max:20'
        ]);

        $note->update($request->only('type', 'value'));

        return response()->json($note);
    }

    public function destroy(Note $note)
    {
        $note->delete();
        return response()->json(['message' => 'Note deleted successfully']);
    }

    // Logic for returning averages for a student
    public function calculateAverage($studentId)
    {
        $student = Student::with(['notes.subject', 'attendanceRecords'])->findOrFail($studentId);
        
        $totalCoefficient = 0;
        $totalSum = 0;

        // Group notes by subject
        $subjectAverages = [];

        foreach ($student->notes->groupBy('subject_id') as $subjectId => $notes) {
            $subject = $notes->first()->subject;
            $coef = $subject->coefficient;
            
            // Calculate smarter average (Tunisian logic approximation)
            $examNote = $notes->where('type', 'Exam')->first();
            $controlNotes = $notes->whereIn('type', ['CC', 'DS', 'TP']);
            
            $subjectAvg = 0;
            if ($examNote && $controlNotes->count() > 0) {
                // Exam 70%, Control 30%
                $controlAvg = $controlNotes->avg('value');
                $subjectAvg = ($examNote->value * 0.70) + ($controlAvg * 0.30);
            } elseif ($examNote) {
                $subjectAvg = $examNote->value;
            } elseif ($controlNotes->count() > 0) {
                $subjectAvg = $controlNotes->avg('value');
            }
            
            $subjectAverages[] = [
                'subject' => $subject->name,
                'coefficient' => $coef,
                'average' => round($subjectAvg, 2)
            ];

            $totalCoefficient += $coef;
            $totalSum += ($subjectAvg * $coef);
        }

        $generalAverage = $totalCoefficient > 0 ? ($totalSum / $totalCoefficient) : 0;

        $status = 'Weak';
        if ($generalAverage >= 15) {
            $status = 'Excellent';
        } elseif ($generalAverage >= 13) {
            $status = 'Good';
        } elseif ($generalAverage >= 10) {
            $status = 'Average';
        }

        $suggestions = [];
        if ($generalAverage >= 15) {
            $suggestions[] = "Excellent Performance";
        }
        foreach ($subjectAverages as $sub) {
            if ($sub['average'] < 10) {
                $suggestions[] = "Needs improvement in " . $sub['subject'] . ".";
            }
        }

        // Calculate absence rate (assuming 50 sessions per semester for PFE demo)
        $absenceCount = $student->attendanceRecords->where('status', 'absent')->count();
        $absenceRate = ($absenceCount / 50) * 100;

        if ($absenceRate > 30) {
            $suggestions[] = "Warning: High Absence Rate (" . round($absenceRate, 1) . "%).";
        }

        return response()->json([
            'student' => $student->user->first_name . ' ' . $student->user->last_name,
            'subjects' => $subjectAverages,
            'general_average' => round($generalAverage, 2),
            'status' => $status,
            'absence_rate' => round($absenceRate, 1),
            'suggestions' => collect($suggestions)->unique()->values()
        ]);
    }
}
