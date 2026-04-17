<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Absence;
use App\Models\Student;
use App\Events\AbsenceWarning;

class AbsenceController extends Controller
{
    public function index()
    {
        $user = auth()->guard('api')->user();
        $role = $user->role->name;

        if ($role === 'Student') {
            return response()->json(
                Absence::with(['student.user', 'student.classe'])
                    ->whereHas('student', fn($q) => $q->where('user_id', $user->id))
                    ->orderByDesc('date')
                    ->get()
            );
        }

        if ($role === 'Teacher') {
            // Teachers see absences for students in their classes
            return response()->json(
                Absence::with(['student.user', 'student.classe'])
                    ->orderByDesc('date')
                    ->get()
            );
        }

        return response()->json(
            Absence::with(['student.user', 'student.classe'])->orderByDesc('date')->get()
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'type' => 'required|in:Absence,Retard',
            'date' => 'required|date',
            'reason' => 'nullable|string'
        ]);

        $absence = Absence::create($request->all());

        $absence->load('student.user');

        // Check absence rate
        $student = Student::with('absences')->find($request->student_id);
        $absenceCount = $student->absences->where('type', 'Absence')->count();
        $rate = ($absenceCount / 50) * 100;
        
        if ($rate > 30) {
            event(new AbsenceWarning($student, 'Your absence rate has exceeded 30% (' . round($rate, 1) . '%). Please contact the administration.'));
        }

        return response()->json($absence, 201);
    }

    public function show(Absence $absence)
    {
        return response()->json($absence->load('student.user'));
    }

    public function update(Request $request, Absence $absence)
    {
        $request->validate([
            'type' => 'sometimes|in:Absence,Retard',
            'date' => 'sometimes|date',
            'reason' => 'nullable|string'
        ]);

        $absence->update($request->all());

        return response()->json($absence);
    }

    public function destroy(Absence $absence)
    {
        $absence->delete();
        return response()->json(['message' => 'Absence deleted successfully']);
    }
}
