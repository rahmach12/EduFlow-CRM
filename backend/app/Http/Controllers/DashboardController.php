<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Payment;
use App\Models\Note;
use App\Models\AttendanceRecord;
use App\Models\Internship;
use App\Models\Classe;

class DashboardController extends Controller
{
    public function stats()
    {
        $totalStudents = Student::count();
        $totalTeachers = Teacher::count();
        $totalClasses  = Classe::count();

        $revenue      = Payment::where('status', 'Payé')->sum('amount');
        $totalPayments = Payment::count();
        $paidPayments  = Payment::where('status', 'Payé')->count();
        $paymentRate   = $totalPayments > 0 ? round(($paidPayments / $totalPayments) * 100, 1) : 0;

        $totalInternships    = Internship::count();
        $approvedInternships = Internship::where('status', 'Approved')->count();
        $internshipRate      = $totalInternships > 0 ? round(($approvedInternships / $totalInternships) * 100, 1) : 0;

        $totalAttendance = AttendanceRecord::count();
        $absences        = AttendanceRecord::where('status', 'absent')->count();
        $absenceRate     = $totalAttendance > 0 ? round(($absences / $totalAttendance) * 100, 1) : 0;

        $totalNotes   = Note::count();
        $passingNotes = Note::where('value', '>=', 10)->count();
        $successRate  = $totalNotes > 0 ? round(($passingNotes / $totalNotes) * 100, 1) : 0;

        return response()->json([
            'students_count'   => $totalStudents,
            'teachers_count'   => $totalTeachers,
            'classes_count'    => $totalClasses,
            'revenue'          => $revenue,
            'payment_rate'     => $paymentRate,
            'internship_rate'  => $internshipRate,
            'absence_rate'     => $absenceRate,
            'success_rate'     => $successRate,
        ]);
    }

    public function internshipStats()
    {
        $total    = Internship::count();
        $pending  = Internship::where('status', 'Pending')->count();
        $approved = Internship::where('status', 'Approved')->count();
        $rejected = Internship::where('status', 'Rejected')->count();
        $withReport   = Internship::whereNotNull('report_file')->count();
        $withDefense  = Internship::whereNotNull('defense_date')->count();

        return response()->json([
            'total'       => $total,
            'pending'     => $pending,
            'approved'    => $approved,
            'rejected'    => $rejected,
            'with_report' => $withReport,
            'with_defense'=> $withDefense,
        ]);
    }
}
