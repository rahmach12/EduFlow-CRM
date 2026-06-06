<?php

use App\Http\Controllers\AcademicLevelController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClassController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FiliereController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\InternshipController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\ScolariteController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DocumentRequestController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\SemesterController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\OllamaController;
use App\Http\Controllers\KonnectController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Public Webhook route for Konnect
Route::post('/konnect/webhook', [KonnectController::class, 'handleWebhook']);

Route::middleware('auth:api')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Konnect routes
    Route::prefix('konnect')->group(function () {
        Route::post('payment-link', [KonnectController::class, 'createPaymentLink']);
        Route::get('status/{paymentId}', [KonnectController::class, 'checkStatus']);
        Route::post('init', [KonnectController::class, 'initPayment']);
    });

    // --- Admin Only ---
    Route::middleware('role:Admin')->group(function () {
        Route::get('roles', [UserController::class, 'roles']);
        Route::get('users', [UserController::class, 'index']);
        Route::post('users', [UserController::class, 'store']);
        Route::put('users/{user}', [UserController::class, 'update']);
        Route::delete('users/{user}', [UserController::class, 'destroy']);
    });

    // --- Finance Officer & Admin Only ---
    Route::middleware('role:Admin,Finance Officer')->group(function () {
        Route::post('payments', [FinanceController::class, 'store']);
        Route::put('payments/{payment}', [FinanceController::class, 'update']);
        Route::delete('payments/{payment}', [FinanceController::class, 'destroy']);

        // New Financial ERP Routes
        Route::get('finance/stats', [FinanceController::class, 'stats']);
        Route::get('finance/student-finances', [FinanceController::class, 'studentFinances']);
        Route::get('/student-finances/{id}', [FinanceController::class, 'showStudentFinance']);
        Route::post('/student-finances/{id}/discount', [FinanceController::class, 'addDiscount']);
        Route::delete('/student-finances/{id}/discount/{discountId}', [FinanceController::class, 'removeDiscount']);
        Route::post('/student-finances/{id}/scholarship', [FinanceController::class, 'addScholarship']);
        Route::delete('/student-finances/{id}/scholarship/{scholarshipId}', [FinanceController::class, 'removeScholarship']);
        Route::put('/student-finances/{id}/status', [FinanceController::class, 'updateStudentFinanceStatus']);


        Route::post('finance/payments/{id}/validate', [FinanceController::class, 'validatePayment']);
        Route::post('finance/payments/{id}/reject', [FinanceController::class, 'rejectPayment']);
        Route::get('finance/tuition-fees', [FinanceController::class, 'tuitionFeesList']);
        Route::post('finance/tuition-fees', [FinanceController::class, 'storeTuitionFee']);
        Route::post('finance/discounts', [FinanceController::class, 'storeDiscount']);
    });
    Route::get('payments', [FinanceController::class, 'index'])->middleware('role:Admin,Finance Officer,Student');
    Route::get('payments/{payment}', [FinanceController::class, 'show'])->middleware('role:Admin,Finance Officer,Student');
    Route::get('payments/{payment}/receipt', [FinanceController::class, 'receipt'])->middleware('role:Admin,Finance Officer,Student');
    
    // Shared / Student Finance Routes
    Route::get('finance/student-finances/{id}', [FinanceController::class, 'showStudentFinance'])->middleware('role:Admin,Finance Officer,Student');
    Route::get('finance/my-finance', [FinanceController::class, 'myFinance'])->middleware('role:Student');
    Route::get('finance/discounts', [FinanceController::class, 'discountsList'])->middleware('role:Admin,Finance Officer,Student');

    // --- Scolarité & Admin Only ---
    Route::middleware('role:Admin,Scolarite')->group(function () {
        Route::post('students', [StudentController::class, 'store']);
        Route::put('students/{student}', [StudentController::class, 'update']);
        Route::delete('students/{student}', [StudentController::class, 'destroy']);

        Route::post('teachers', [TeacherController::class, 'store']);
        Route::put('teachers/{teacher}', [TeacherController::class, 'update']);
        Route::delete('teachers/{teacher}', [TeacherController::class, 'destroy']);

        Route::post('filieres', [FiliereController::class, 'store']);
        Route::put('filieres/{filiere}', [FiliereController::class, 'update']);
        Route::delete('filieres/{filiere}', [FiliereController::class, 'destroy']);

        Route::post('academic-levels', [AcademicLevelController::class, 'store']);
        Route::put('academic-levels/{academic_level}', [AcademicLevelController::class, 'update']);
        Route::delete('academic-levels/{academic_level}', [AcademicLevelController::class, 'destroy']);

        Route::post('classes', [ClassController::class, 'store']);
        Route::put('classes/{class}', [ClassController::class, 'update']);
        Route::delete('classes/{class}', [ClassController::class, 'destroy']);

        Route::post('subjects', [SubjectController::class, 'store']);
        Route::put('subjects/{subject}', [SubjectController::class, 'update']);
        Route::delete('subjects/{subject}', [SubjectController::class, 'destroy']);

        Route::get('dashboard/scolarite', [ScolariteController::class, 'dashboard']);
        Route::get('scolarite/students', [ScolariteController::class, 'students']);
        Route::post('scolarite/eliminate/{student}', [ScolariteController::class, 'eliminate']);
        Route::post('scolarite/reinstate/{student}', [ScolariteController::class, 'reinstate']);

        Route::post('schedules/generate', [ScheduleController::class, 'generate']);
        Route::post('schedules', [ScheduleController::class, 'store']);
        Route::put('schedules/{id}', [ScheduleController::class, 'update']);
        Route::delete('schedules/{id}', [ScheduleController::class, 'destroy']);

        Route::apiResource('rooms', RoomController::class)->except(['index']);
        Route::apiResource('semesters', SemesterController::class)->except(['index']);
    });

    // Academic Read Access (Shared)
    Route::get('students', [StudentController::class, 'index']);
    Route::get('students/{student}', [StudentController::class, 'show']);
    Route::get('teachers', [TeacherController::class, 'index']);
    Route::get('teachers/{teacher}', [TeacherController::class, 'show']);
    Route::get('filieres', [FiliereController::class, 'index']);
    Route::get('filieres/{filiere}', [FiliereController::class, 'show']);
    Route::get('academic-levels', [AcademicLevelController::class, 'index']);
    Route::get('academic-levels/{academic_level}', [AcademicLevelController::class, 'show']);
    Route::get('classes', [ClassController::class, 'index']);
    Route::get('classes/{class}', [ClassController::class, 'show']);
    Route::get('subjects', [SubjectController::class, 'index']);
    Route::get('subjects/{subject}', [SubjectController::class, 'show']);
    Route::get('test_db', function() {
        return response()->json([
            'db_connection' => config('database.default'),
            'db_database' => config('database.connections.' . config('database.default') . '.database'),
            'semesters_count' => \App\Models\Semester::count(),
            'rooms_count' => \App\Models\Room::count(),
            'classes_count' => \App\Models\Classe::count(),
            'teachers_count' => \App\Models\Teacher::count(),
        ]);
    });
    Route::get('schedules/options', [ScheduleController::class, 'options']);
    Route::get('schedules', [ScheduleController::class, 'index']);
    Route::get('schedules/teachers/{teacherId}/availabilities', [ScheduleController::class, 'getAvailabilities']);
    Route::post('schedules/teachers/{teacherId}/availabilities', [ScheduleController::class, 'updateAvailabilities']);

    Route::get('rooms', [RoomController::class, 'index']);
    Route::get('semesters', [SemesterController::class, 'index']);

    // --- Internship Manager & Admin Only ---
    Route::middleware('role:Admin,Internship Manager')->group(function () {
        Route::post('internships/{internship}/status', [InternshipController::class, 'updateStatus']);
        Route::post('internships/{internship}/defense', [InternshipController::class, 'scheduleDefense']);
        Route::delete('internships/{internship}', [InternshipController::class, 'destroy']);
    });
    Route::get('dashboard/internships', [DashboardController::class, 'internshipStats'])->middleware('role:Admin,Internship Manager');

    // General Internship Routes
    Route::get('internships', [InternshipController::class, 'index']);
    Route::post('internships', [InternshipController::class, 'store'])->middleware('role:Admin,Student');
    Route::put('internships/{internship}', [InternshipController::class, 'update'])->middleware('role:Admin,Student');
    Route::post('internships/{internship}/upload-report', [InternshipController::class, 'uploadReport'])->middleware('role:Admin,Student');

    // --- Teacher & Admin Only ---
    Route::middleware('role:Admin,Teacher')->group(function () {
        Route::post('notes', [NoteController::class, 'store']);
        Route::put('notes/{note}', [NoteController::class, 'update']);
        Route::delete('notes/{note}', [NoteController::class, 'destroy']);

        Route::post('attendance', [AttendanceController::class, 'store']);
        Route::put('attendance/{id}', [AttendanceController::class, 'update']);
        Route::delete('attendance/{id}', [AttendanceController::class, 'destroy']);
    });

    // Notes & Attendance Read Access (Shared/Filtered)
    Route::get('notes', [NoteController::class, 'index']);
    Route::get('notes/{note}', [NoteController::class, 'show']);
    Route::get('students/{id}/average', [NoteController::class, 'calculateAverage']);
    Route::get('attendance', [AttendanceController::class, 'index']);
    Route::get('attendance/{id}', [AttendanceController::class, 'show']);

    // --- Notifications ---
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::post('notifications', [NotificationController::class, 'store'])->middleware('role:Admin,Teacher,Scolarite');
    Route::put('notifications/{notification}/read', [NotificationController::class, 'markAsRead']);

    // --- Document Requests ---
    Route::get('document-requests', [DocumentRequestController::class, 'index']);
    Route::post('document-requests', [DocumentRequestController::class, 'store'])->middleware('role:Admin,Student');
    Route::put('document-requests/{id}/status', [DocumentRequestController::class, 'updateStatus'])->middleware('role:Admin,Scolarite');

    // --- Internal messaging ---
    Route::get('messages', [MessageController::class, 'index']);
    Route::post('messages', [MessageController::class, 'store']);
    Route::put('messages/{id}/read', [MessageController::class, 'markAsRead']);
    Route::get('messages/partners', [MessageController::class, 'getPartners']);

    // --- General Dashboard Stats ---
    Route::get('dashboard/stats', [DashboardController::class, 'stats'])->middleware('role:Admin,Scolarite,Finance Officer,Internship Manager');
    Route::get('dashboard/alerts', [DashboardController::class, 'alerts'])->middleware('role:Admin,Scolarite,Finance Officer,Internship Manager');
    Route::post('ollama/chat', [OllamaController::class, 'sendMessage'])->middleware('auth:api');
    Route::post('ai/analyze-student', [\App\Http\Controllers\AIAnalysisController::class, 'analyze'])->middleware('auth:api');
});
