<?php

namespace App\Http\Controllers;

use App\Models\AcademicLevel;
use App\Models\AttendanceRecord;
use App\Models\Classe;
use App\Models\Filiere;
use App\Models\Internship;
use App\Models\Note;
use App\Models\Payment;
use App\Models\Student;
use App\Models\Teacher;

class DashboardController extends Controller
{
    public function stats()
    {
        $totalStudents = Student::count();
        $totalTeachers = Teacher::count();
        $totalClasses = Classe::count();

        $revenue = Payment::where('status', 'Paid')->sum('amount_paid');
        $totalPayments = Payment::count();
        $paidPayments = Payment::where('status', 'Paid')->count();
        $paymentRate = $totalPayments > 0 ? round(($paidPayments / $totalPayments) * 100, 1) : 0;

        $totalInternships = Internship::count();
        $approvedInternships = Internship::where('status', 'Approved')->count();
        $internshipRate = $totalInternships > 0 ? round(($approvedInternships / $totalInternships) * 100, 1) : 0;

        $totalAttendance = AttendanceRecord::count();
        $absences = AttendanceRecord::where('status', 'absent')->count();
        $absenceRate = $totalAttendance > 0 ? round(($absences / $totalAttendance) * 100, 1) : 0;

        $totalNotes = Note::count();
        $passingNotes = Note::where('value', '>=', 10)->count();
        $successRate = $totalNotes > 0 ? round(($passingNotes / $totalNotes) * 100, 1) : 0;

        return response()->json([
            'students_count' => $totalStudents,
            'teachers_count' => $totalTeachers,
            'classes_count' => $totalClasses,
            'filieres_count' => Filiere::count(),
            'academic_levels_count' => AcademicLevel::count(),
            'revenue' => $revenue,
            'payment_rate' => $paymentRate,
            'internship_rate' => $internshipRate,
            'absence_rate' => $absenceRate,
            'success_rate' => $successRate,
        ]);
    }

    public function internshipStats()
    {
        $total = Internship::count();
        $pending = Internship::where('status', 'Pending')->count();
        $approved = Internship::where('status', 'Approved')->count();
        $rejected = Internship::where('status', 'Rejected')->count();
        $withReport = Internship::whereNotNull('report_file')->count();
        $withDefense = Internship::whereNotNull('defense_date')->count();
        $byType = Internship::selectRaw('type, count(*) as total')->groupBy('type')->pluck('total', 'type');

        return response()->json([
            'total' => $total,
            'pending' => $pending,
            'approved' => $approved,
            'rejected' => $rejected,
            'with_report' => $withReport,
            'with_defense' => $withDefense,
            'by_type' => $byType,
        ]);
    }

    public function alerts()
    {
        $unpaidPayments = Payment::whereIn('status', ['Unpaid', 'Partially Paid'])->count();
        $pendingInternships = Internship::where('status', 'Pending')->count();
        $eliminatedStudents = Student::where('is_eliminated', true)->count();
        $unreadNotifications = \App\Models\Notification::where('is_read', false)->count();

        return response()->json([
            [
                'key' => 'finance_follow_up',
                'type' => 'finance',
                'title' => 'Suivi financier',
                'description' => 'Paiements impayes ou partiellement payes a relancer.',
                'value' => $unpaidPayments,
            ],
            [
                'key' => 'internship_queue',
                'type' => 'internship',
                'title' => 'Stages en attente',
                'description' => 'Demandes de stage a valider par le responsable.',
                'value' => $pendingInternships,
            ],
            [
                'key' => 'student_risk',
                'type' => 'academic',
                'title' => 'Etudiants elimines',
                'description' => 'Etudiants actuellement marques comme elimines.',
                'value' => $eliminatedStudents,
            ],
            [
                'key' => 'notification_backlog',
                'type' => 'academic',
                'title' => 'Notifications non lues',
                'description' => 'Notifications globales encore non traitees.',
                'value' => $unreadNotifications,
            ],
        ]);
    }
}
