<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\Note;
use App\Models\Notification;
use Illuminate\Http\Request;

class ScolariteController extends Controller
{
    /**
     * Main Scolarité dashboard — aggregated stats + at-risk students.
     */
    public function dashboard()
    {
        $students = Student::with(['user', 'classe'])
            ->withCount([
                'attendanceRecords as total_sessions',
                'attendanceRecords as absences' => fn($q) => $q->where('status', 'absent'),
            ])
            ->get();

        $totalStudents     = $students->count();
        $eliminatedStudents = $students->where('is_eliminated', true)->count();

        // At-risk: absence rate between 25% and 30%
        $atRisk = $students->filter(function ($s) {
            if (!$s->total_sessions) return false;
            $rate = ($s->absences / $s->total_sessions) * 100;
            return $rate >= 25 && $rate < 30 && !$s->is_eliminated;
        })->count();

        // Total notes submitted this period
        $totalNotes = Note::count();

        return response()->json([
            'total_students'      => $totalStudents,
            'eliminated_students' => $eliminatedStudents,
            'at_risk_students'    => $atRisk,
            'total_notes'         => $totalNotes,
        ]);
    }

    /**
     * Full student list with absence rates and elimination status.
     */
    public function students()
    {
        $students = Student::with(['user', 'classe'])
            ->withCount([
                'attendanceRecords as total_sessions',
                'attendanceRecords as absences' => fn($q) => $q->where('status', 'absent'),
            ])
            ->get()
            ->map(function ($student) {
                $absenceRate = $student->total_sessions > 0
                    ? round(($student->absences / $student->total_sessions) * 100, 1)
                    : 0;

                return [
                    'id'               => $student->id,
                    'first_name'       => $student->user->first_name,
                    'last_name'        => $student->user->last_name,
                    'email'            => $student->user->email,
                    'classe'           => $student->classe?->name,
                    'is_eliminated'    => (bool) $student->is_eliminated,
                    'elimination_reason' => $student->elimination_reason,
                    'absence_rate'     => $absenceRate,
                    'total_sessions'   => $student->total_sessions,
                    'absences'         => $student->absences,
                ];
            });

        return response()->json($students);
    }

    /**
     * Mark a student as eliminated.
     */
    public function eliminate(Request $request, Student $student)
    {
        $request->validate([
            'reason' => 'nullable|string|max:255',
        ]);

        $student->update([
            'is_eliminated'      => true,
            'elimination_reason' => $request->reason ?? 'Taux d\'absences > 30%',
        ]);

        // Send notification to the student
        Notification::create([
            'user_id' => $student->user_id,
            'title'   => 'Notification d\'élimination',
            'message' => 'Vous avez été éliminé(e) en raison d\'un taux d\'absences excessif. Veuillez contacter la scolarité.',
            'is_read' => false,
        ]);

        return response()->json(['message' => 'Student marked as eliminated']);
    }

    /**
     * Reinstate an eliminated student.
     */
    public function reinstate(Student $student)
    {
        $student->update([
            'is_eliminated'      => false,
            'elimination_reason' => null,
        ]);

        Notification::create([
            'user_id' => $student->user_id,
            'title'   => 'Réhabilitation',
            'message' => 'Votre statut d\'élimination a été levé. Vous êtes réintégré(e).',
            'is_read' => false,
        ]);

        return response()->json(['message' => 'Student reinstated successfully']);
    }
}
