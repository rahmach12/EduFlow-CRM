<?php

namespace Tests\Feature;

use App\Models\Classe;
use App\Models\DocumentRequest;
use App\Models\Internship;
use App\Models\Notification;
use App\Models\Payment;
use App\Models\Role;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class RoleSecurityAndWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private array $rolesMap = [];

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['Admin', 'Teacher', 'Student', 'Finance Officer', 'Internship Manager', 'Scolarite'] as $roleName) {
            $this->rolesMap[$roleName] = Role::create(['name' => $roleName]);
        }
    }

    private function authenticate(User $user): array
    {
        $token = JWTAuth::fromUser($user);
        auth()->guard('api')->forgetUser();
        auth()->guard('api')->setUser($user);
        return [
            'Authorization' => 'Bearer ' . $token,
        ];
    }

    private function createUser(string $roleName, string $email, string $firstName = 'Test'): User
    {
        return User::create([
            'first_name' => $firstName,
            'last_name' => $roleName,
            'email' => $email,
            'password' => Hash::make('password123'),
            'role_id' => $this->rolesMap[$roleName]->id,
        ]);
    }

    /**
     * E2E Workflow: Student requests document -> Scolarité approves/rejects -> Student receives notification.
     */
    public function test_document_request_workflow_notifies_student(): void
    {
        $studentUser = $this->createUser('Student', 'stud1@test.local');
        $class = Classe::create(['name' => 'L3 GL', 'level' => 'Licence 3', 'academic_year' => '2025-2026']);
        $student = Student::create([
            'user_id' => $studentUser->id,
            'class_id' => $class->id,
            'matricule' => 'MAT999999',
            'phone' => '12345678',
            'address' => 'Tunis',
            'date_of_birth' => '2001-05-20',
        ]);

        $scolariteUser = $this->createUser('Scolarite', 'scol1@test.local');

        // Student requests a document
        $studentHeaders = $this->authenticate($studentUser);
        $requestResponse = $this->postJson('/api/document-requests', [
            'document_type' => 'attestation_presence',
        ], $studentHeaders);

        $requestResponse->assertCreated();
        $requestId = $requestResponse->json('id');

        // Scolarite approves the document request
        $scolariteHeaders = $this->authenticate($scolariteUser);
        $approveResponse = $this->putJson("/api/document-requests/{$requestId}/status", [
            'status' => 'approved',
        ], $scolariteHeaders);

        $approveResponse->assertOk();

        // Check if student received a notification
        $studentNotifications = Notification::where('user_id', $studentUser->id)->get();
        $this->assertTrue($studentNotifications->count() > 0);
        $this->assertStringContainsString('approuv', $studentNotifications->first()->message);
    }

    /**
     * E2E Workflow: Teacher sends class message -> Students receive real-time notification.
     */
    public function test_teacher_class_broadcast_notifies_students(): void
    {
        $teacherUser = $this->createUser('Teacher', 'teacher1@test.local');
        $studentUser = $this->createUser('Student', 'stud2@test.local');
        
        $class = Classe::create(['name' => 'L3 GL', 'level' => 'Licence 3', 'academic_year' => '2025-2026']);
        Student::create([
            'user_id' => $studentUser->id,
            'class_id' => $class->id,
            'matricule' => 'MAT888888',
            'phone' => '87654321',
            'address' => 'Sfax',
            'date_of_birth' => '2002-06-12',
        ]);

        $teacher = Teacher::create([
            'user_id' => $teacherUser->id,
            'phone' => '55443322',
            'address' => 'Tunis',
            'date_of_birth' => '1985-04-12',
        ]);
        $teacher->classes()->attach($class->id);

        $teacherHeaders = $this->authenticate($teacherUser);

        // Teacher sends a class broadcast
        $broadcastResponse = $this->postJson('/api/messages', [
            'subject' => 'Class Announcement',
            'body' => 'Tomorrow class is cancelled.',
            'class_id' => $class->id,
        ], $teacherHeaders);

        $broadcastResponse->assertCreated();

        // Verify the student received a notification
        $notification = Notification::where('user_id', $studentUser->id)->first();
        $this->assertNotNull($notification);
        $this->assertStringContainsString('Class Announcement', $notification->message);
    }

    /**
     * E2E Workflow: Finance Officer applies promotion -> Student receives alert + updated receipt.
     */
    public function test_finance_officer_applies_promotion_and_generates_receipt(): void
    {
        $financeUser = $this->createUser('Finance Officer', 'finance1@test.local');
        $studentUser = $this->createUser('Student', 'stud3@test.local');

        $class = Classe::create(['name' => 'L3 GL', 'level' => 'Licence 3', 'academic_year' => '2025-2026']);
        $student = Student::create([
            'user_id' => $studentUser->id,
            'class_id' => $class->id,
            'matricule' => 'MAT777777',
            'phone' => '55555555',
            'address' => 'Sousse',
            'date_of_birth' => '2000-09-09',
        ]);

        $financeHeaders = $this->authenticate($financeUser);

        // Create a payment record with promotion
        $paymentResponse = $this->postJson('/api/payments', [
            'student_id' => $student->id,
            'amount' => 1000,
            'amount_due' => 1000,
            'amount_paid' => 800,
            'date' => '2026-05-20',
            'status' => 'Partially Paid',
            'promotion_percentage' => 20,
            'details' => 'University Fees',
        ], $financeHeaders);

        $paymentResponse->assertCreated();
        $paymentId = $paymentResponse->json('id');

        // Check if student received a notification
        $notification = Notification::where('user_id', $studentUser->id)->first();
        $this->assertNotNull($notification);
        $this->assertStringContainsString('20%', $notification->message);

        // Verify Student can access the receipt PDF generation route successfully
        $studentHeaders = $this->authenticate($studentUser);
        $receiptResponse = $this->getJson("/api/payments/{$paymentId}/receipt", $studentHeaders);

        $receiptResponse->assertOk();
        $receiptResponse->assertJsonFragment([
            'promotion_percentage' => 20,
            'status' => 'Partially Paid',
        ]);
    }

    /**
     * E2E Workflow: Internship Manager approves/rejects stage -> Student receives defense schedule notification.
     */
    public function test_internship_manager_schedules_defense_and_notifies_student(): void
    {
        $managerUser = $this->createUser('Internship Manager', 'manager1@test.local');
        $studentUser = $this->createUser('Student', 'stud4@test.local');

        $class = Classe::create(['name' => 'L3 GL', 'level' => 'Licence 3', 'academic_year' => '2025-2026']);
        $student = Student::create([
            'user_id' => $studentUser->id,
            'class_id' => $class->id,
            'matricule' => 'MAT666666',
            'phone' => '44444444',
            'address' => 'Bizerte',
            'date_of_birth' => '2001-11-11',
        ]);

        $internship = Internship::create([
            'student_id' => $student->id,
            'type' => 'PFE',
            'company_name' => 'TechCorp',
            'start_date' => '2026-02-01',
            'end_date' => '2026-06-30',
            'status' => 'Pending',
        ]);

        $managerHeaders = $this->authenticate($managerUser);

        // Approve Internship Status
        $statusResponse = $this->postJson("/api/internships/{$internship->id}/status", [
            'status' => 'Approved',
        ], $managerHeaders);

        $statusResponse->assertOk();

        // Schedule Defense
        $defenseResponse = $this->postJson("/api/internships/{$internship->id}/defense", [
            'defense_date' => '2026-07-05 10:00:00',
            'defense_jury' => 'Dr. A, Dr. B',
            'defense_room' => 'Amphi A',
        ], $managerHeaders);

        $defenseResponse->assertOk();

        // Verify Student received defense schedule notification
        $notification = Notification::where('user_id', $studentUser->id)
            ->where('title', 'Soutenance planifiee')
            ->first();

        $this->assertNotNull($notification);
        $this->assertStringContainsString('Amphi A', $notification->message);
    }

    /**
     * Security: Verify students are rejected with a 403 Forbidden response when hitting Admin/Scolarité/Finance routes.
     */
    public function test_students_restricted_from_admin_scolarite_finance_actions(): void
    {
        $studentUser = $this->createUser('Student', 'stud5@test.local');
        $studentHeaders = $this->authenticate($studentUser);

        // Attempting to access Admin user listing
        $this->getJson('/api/users', $studentHeaders)->assertStatus(403);

        // Attempting to post class creation (Scolarite/Admin action)
        $this->postJson('/api/classes', [
            'name' => 'L3 Hackers',
            'level' => 'Licence 3',
            'academic_year' => '2025-2026',
        ], $studentHeaders)->assertStatus(403);

        // Attempting to record a payment (Finance action)
        $this->postJson('/api/payments', [
            'student_id' => 1,
            'amount' => 100,
            'date' => '2026-05-21',
            'status' => 'Paid',
        ], $studentHeaders)->assertStatus(403);
    }

    /**
     * Security: Verify teachers are rejected with a 403 Forbidden response when attempting to modify financial or administrative data.
     */
    public function test_teachers_restricted_from_admin_finance_actions(): void
    {
        $teacherUser = $this->createUser('Teacher', 'teacher2@test.local');
        $teacherHeaders = $this->authenticate($teacherUser);

        // Attempting to access Admin user listing
        $this->getJson('/api/users', $teacherHeaders)->assertStatus(403);

        // Attempting to record a payment (Finance action)
        $this->postJson('/api/payments', [
            'student_id' => 1,
            'amount' => 100,
            'date' => '2026-05-21',
            'status' => 'Paid',
        ], $teacherHeaders)->assertStatus(403);

        // Attempting to create a class (Scolarite action)
        $this->postJson('/api/classes', [
            'name' => 'L3 Updated',
            'level' => 'Licence 3',
            'academic_year' => '2025-2026',
        ], $teacherHeaders)->assertStatus(403);
    }
}
