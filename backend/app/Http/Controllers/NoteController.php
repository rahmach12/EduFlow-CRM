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

        $user = auth()->user();
        if ($user && $user->role && $user->role->name === 'Teacher') {
            $teacher = $user->teacher;
            if (!$teacher) {
                abort(403, 'Unauthorized action.');
            }

            // 1. Verify student is in one of the teacher's classes
            $student = Student::findOrFail($request->student_id);
            if (!$teacher->classes()->where('classes.id', $student->class_id)->exists()) {
                abort(403, 'You are not authorized to grade students from this class.');
            }

            // 2. Verify teacher teaches the specified subject
            $teachesSubject = $teacher->subject_id == $request->subject_id 
                || $teacher->subjects()->where('subjects.id', $request->subject_id)->exists();

            if (!$teachesSubject) {
                abort(403, 'You are not authorized to grade this subject.');
            }
        }

        $data = $request->all();
        if ($user && $user->role && $user->role->name === 'Teacher') {
            $data['teacher_id'] = $user->teacher->id ?? null;
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

        // AI Performance Evaluation (Background)
        dispatch(new \App\Jobs\EvaluateStudentPerformance($data['student_id']))->afterResponse();

        return response()->json($note->load('student', 'subject', 'teacher'), 201);
    }

    public function show(Note $note)
    {
        $user = request()->user();
        if ($user && $user->role && $user->role->name === 'Teacher') {
            $teacher = $user->teacher;
            if (!$teacher || ($note->teacher_id !== $teacher->id && !$teacher->classes()->where('classes.id', $note->student->class_id)->exists())) {
                abort(403, 'Unauthorized action.');
            }
        }
        return response()->json($note->load(['student', 'subject', 'teacher']));
    }

    public function update(Request $request, Note $note)
    {
        $user = $request->user();
        if ($user && $user->role && $user->role->name === 'Teacher') {
            $teacher = $user->teacher;
            if (!$teacher || $note->teacher_id !== $teacher->id) {
                abort(403, 'You can only update notes that you submitted.');
            }
        }

        $request->validate([
            'type' => 'sometimes|in:CC,DS,TP,Exam',
            'value' => 'sometimes|numeric|min:0|max:20'
        ]);

        $note->update($request->only('type', 'value'));

        // AI Performance Evaluation (Background)
        dispatch(new \App\Jobs\EvaluateStudentPerformance($note->student_id))->afterResponse();

        return response()->json($note);
    }

    public function destroy(Note $note)
    {
        $user = request()->user();
        if ($user && $user->role && $user->role->name === 'Teacher') {
            $teacher = $user->teacher;
            if (!$teacher || $note->teacher_id !== $teacher->id) {
                abort(403, 'You can only delete notes that you submitted.');
            }
        }

        $note->delete();
        return response()->json(['message' => 'Note deleted successfully']);
    }

    public function calculateAverage($studentId)
    {
        $user = auth()->guard('api')->user();
        if ($user && $user->role && $user->role->name === 'Teacher') {
            $teacher = $user->teacher;
            $student = Student::findOrFail($studentId);
            if (!$teacher || !$teacher->classes()->where('classes.id', $student->class_id)->exists()) {
                abort(403, 'Unauthorized action.');
            }
        }
        
        $student = Student::with(['notes.subject', 'attendanceRecords', 'user'])->findOrFail($studentId);
        
        $totalCoefficient = 0;
        $totalSum = 0;

        // Group notes by subject
        $subjectAverages = [];

        foreach ($student->notes->groupBy('subject_id') as $subjectId => $notes) {
            $subject = $notes->first()->subject;
            $coef = $subject->coefficient;
            
            // Calculate smarter average (Tunisian logic approximation: Exam 70%, Control 30%)
            $examNote = $notes->where('type', 'Exam')->first();
            $controlNotes = $notes->whereIn('type', ['CC', 'DS', 'TP']);
            
            $subjectAvg = 0;
            if ($examNote && $controlNotes->count() > 0) {
                $controlAvg = $controlNotes->avg('value');
                $subjectAvg = ($examNote->value * 0.70) + ($controlAvg * 0.30);
            } elseif ($examNote) {
                $subjectAvg = $examNote->value;
            } elseif ($controlNotes->count() > 0) {
                $subjectAvg = $controlNotes->avg('value');
            }
            
            // Extract individual grades for easy table display
            $ccVal = $notes->where('type', 'CC')->first()?->value;
            $dsVal = $notes->where('type', 'DS')->first()?->value;
            $tpVal = $notes->where('type', 'TP')->first()?->value;
            $examVal = $notes->where('type', 'Exam')->first()?->value;

            $subjectAverages[] = [
                'subject' => $subject->name,
                'coefficient' => $coef,
                'average' => round($subjectAvg, 2),
                'cc' => $ccVal !== null ? round($ccVal, 2) : '-',
                'ds' => $dsVal !== null ? round($dsVal, 2) : '-',
                'tp' => $tpVal !== null ? round($tpVal, 2) : '-',
                'exam' => $examVal !== null ? round($examVal, 2) : '-',
            ];

            $totalCoefficient += $coef;
            $totalSum += ($subjectAvg * $coef);
        }

        // Simulate Sem 1 and Sem 2 split
        $half = ceil(count($subjectAverages) / 2);
        $sem1Subjects = array_slice($subjectAverages, 0, $half);
        $sem2Subjects = array_slice($subjectAverages, $half);

        $sem1Coef = array_sum(array_column($sem1Subjects, 'coefficient'));
        $sem1Sum = 0;
        foreach($sem1Subjects as $s) { $sem1Sum += $s['average'] * $s['coefficient']; }
        $sem1Avg = $sem1Coef > 0 ? ($sem1Sum / $sem1Coef) : null;

        $sem2Coef = array_sum(array_column($sem2Subjects, 'coefficient'));
        $sem2Sum = 0;
        foreach($sem2Subjects as $s) { $sem2Sum += $s['average'] * $s['coefficient']; }
        $sem2Avg = $sem2Coef > 0 ? ($sem2Sum / $sem2Coef) : null;

        $generalAverage = $totalCoefficient > 0 ? ($totalSum / $totalCoefficient) : 0;

        $status = 'Average';
        $mention = 'Refusé';
        if ($generalAverage >= 16) {
            $status = 'Excellent';
            $mention = 'Très Bien';
        } elseif ($generalAverage >= 14) {
            $status = 'Good';
            $mention = 'Bien';
        } elseif ($generalAverage >= 12) {
            $status = 'Good';
            $mention = 'Assez Bien';
        } elseif ($generalAverage >= 10) {
            $status = 'Average';
            $mention = 'Passable';
        } else {
            $status = 'Weak';
            $mention = 'Refusé';
        }

        $suggestions = [];
        if ($generalAverage >= 15) {
            $suggestions[] = "Excellent Performance! Keep up the good work.";
        }
        foreach ($subjectAverages as $sub) {
            if ($sub['average'] < 10) {
                $suggestions[] = "Needs improvement in " . $sub['subject'] . " (Moyenne: " . $sub['average'] . "/20).";
            }
        }

        // Calculate accurate absence rate based on sessions in the student's class
        $totalSessions = \App\Models\AttendanceSession::where('class_id', $student->class_id)->count();
        $absenceCount = $student->attendanceRecords->where('status', 'absent')->count();
        $absenceRate = $totalSessions > 0 ? ($absenceCount / $totalSessions) * 100 : 0;

        if ($absenceRate > 15) {
            $suggestions[] = "Warning: High absence rate (" . round($absenceRate, 1) . "%). You risk being eliminated.";
        }
        if ($student->is_eliminated) {
            $suggestions[] = "Critical: You have been eliminated due to: " . ($student->elimination_reason ?: 'Excessive absences.');
        }

        return response()->json([
            'student' => $student->user->first_name . ' ' . $student->user->last_name,
            'subjects' => $subjectAverages,
            'sem1_subjects' => $sem1Subjects,
            'sem2_subjects' => $sem2Subjects,
            'sem1_average' => $sem1Avg !== null ? round($sem1Avg, 2) : null,
            'sem2_average' => $sem2Avg !== null ? round($sem2Avg, 2) : null,
            'general_average' => round($generalAverage, 2),
            'status' => $status,
            'mention' => $mention,
            'absence_rate' => round($absenceRate, 1),
            'is_eliminated' => (bool)$student->is_eliminated,
            'suggestions' => collect($suggestions)->unique()->values()
        ]);
    }
}
