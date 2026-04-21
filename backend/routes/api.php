<?php

use App\Http\Controllers\AcademicLevelController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClassController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FacultyController;
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
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:api')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::apiResource('students', StudentController::class);
    Route::apiResource('teachers', TeacherController::class);
    Route::apiResource('faculties', FacultyController::class);
    Route::apiResource('filieres', FiliereController::class);
    Route::apiResource('academic-levels', AcademicLevelController::class);
    Route::apiResource('classes', ClassController::class);
    Route::apiResource('subjects', SubjectController::class);
    Route::apiResource('notes', NoteController::class);
    Route::apiResource('payments', FinanceController::class);
    Route::get('payments/{payment}/receipt', [FinanceController::class, 'receipt']);

    Route::get('attendance', [AttendanceController::class, 'index']);
    Route::post('attendance', [AttendanceController::class, 'store']);
    Route::get('attendance/{id}', [AttendanceController::class, 'show']);
    Route::put('attendance/{id}', [AttendanceController::class, 'update']);
    Route::delete('attendance/{id}', [AttendanceController::class, 'destroy']);

    Route::get('notifications', [NotificationController::class, 'index']);
    Route::post('notifications', [NotificationController::class, 'store']);
    Route::put('notifications/{notification}/read', [NotificationController::class, 'markAsRead']);

    Route::get('internships', [InternshipController::class, 'index']);
    Route::post('internships', [InternshipController::class, 'store']);
    Route::put('internships/{internship}', [InternshipController::class, 'update']);
    Route::delete('internships/{internship}', [InternshipController::class, 'destroy']);
    Route::post('internships/{internship}/status', [InternshipController::class, 'updateStatus']);
    Route::post('internships/{internship}/defense', [InternshipController::class, 'scheduleDefense']);
    Route::post('internships/{internship}/upload-report', [InternshipController::class, 'uploadReport']);

    Route::get('students/{id}/average', [NoteController::class, 'calculateAverage']);

    Route::get('dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('dashboard/alerts', [DashboardController::class, 'alerts']);
    Route::get('dashboard/internships', [DashboardController::class, 'internshipStats']);
    Route::get('dashboard/scolarite', [ScolariteController::class, 'dashboard']);

    Route::get('scolarite/students', [ScolariteController::class, 'students']);
    Route::post('scolarite/eliminate/{student}', [ScolariteController::class, 'eliminate']);
    Route::post('scolarite/reinstate/{student}', [ScolariteController::class, 'reinstate']);

    Route::get('roles', [UserController::class, 'roles']);
    Route::get('users', [UserController::class, 'index']);
    Route::post('users', [UserController::class, 'store']);
    Route::put('users/{user}', [UserController::class, 'update']);
    Route::delete('users/{user}', [UserController::class, 'destroy']);

    Route::get('schedules', [ScheduleController::class, 'index']);
    Route::post('schedules/generate', [ScheduleController::class, 'generate']);
});
