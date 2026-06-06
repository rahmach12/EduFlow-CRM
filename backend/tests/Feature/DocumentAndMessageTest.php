<?php

namespace Tests\Feature;

use App\Models\Classe;
use App\Models\DocumentRequest;
use App\Models\Message;
use App\Models\Role;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class DocumentAndMessageTest extends TestCase
{
    use RefreshDatabase;

    private function authenticate(User $user): array
    {
        $token = JWTAuth::fromUser($user);
        auth()->guard('api')->forgetUser();
        auth()->guard('api')->setUser($user);
        return [
            'Authorization' => 'Bearer ' . $token,
        ];
    }

    public function test_student_can_request_document_and_scolarite_can_update_status(): void
    {
        $studentRole = Role::create(['name' => 'Student']);
        $scolariteRole = Role::create(['name' => 'Scolarite']);

        $studentUser = User::create([
            'first_name' => 'Sami',
            'last_name' => 'Student',
            'email' => 'student@test.local',
            'password' => Hash::make('password123'),
            'role_id' => $studentRole->id,
        ]);

        $class = Classe::create([
            'name' => 'L1 GL A',
            'level' => 'Licence 1',
            'academic_year' => '2025-2026',
        ]);

        $student = Student::create([
            'user_id' => $studentUser->id,
            'class_id' => $class->id,
            'matricule' => 'MAT112233',
            'phone' => '22111333',
            'address' => 'Sousse',
            'date_of_birth' => '2002-05-15',
        ]);

        $scolariteUser = User::create([
            'first_name' => 'Anis',
            'last_name' => 'Scolarite',
            'email' => 'scolarite@test.local',
            'password' => Hash::make('password123'),
            'role_id' => $scolariteRole->id,
        ]);

        // 1. Submit a document request
        $studentHeaders = $this->authenticate($studentUser);
        $requestResponse = $this->postJson('/api/document-requests', [
            'document_type' => 'attestation_presence',
        ], $studentHeaders);

        $requestResponse->assertCreated()
            ->assertJsonPath('document_type', 'attestation_presence')
            ->assertJsonPath('status', 'pending');

        $requestId = $requestResponse->json('id');

        // 2. Fetch own document requests as student
        $studentListResponse = $this->getJson('/api/document-requests', $studentHeaders);
        $studentListResponse->assertOk()
            ->assertJsonCount(1)
            ->assertJsonFragment(['id' => $requestId, 'status' => 'pending']);

        // 3. Scolarite updates status to approved
        $scolariteHeaders = $this->authenticate($scolariteUser);
        $updateResponse = $this->putJson("/api/document-requests/{$requestId}/status", [
            'status' => 'approved',
        ], $scolariteHeaders);

        $updateResponse->assertOk()
            ->assertJsonPath('status', 'approved');

        // 4. Scolarite rejects document request with reason
        $rejectResponse = $this->putJson("/api/document-requests/{$requestId}/status", [
            'status' => 'rejected',
            'rejection_reason' => 'Photo non conforme',
        ], $scolariteHeaders);

        $rejectResponse->assertOk()
            ->assertJsonPath('status', 'rejected')
            ->assertJsonPath('rejection_reason', 'Photo non conforme');
    }

    public function test_internal_messaging_direct_and_partner_retrieval(): void
    {
        $studentRole = Role::create(['name' => 'Student']);
        $teacherRole = Role::create(['name' => 'Teacher']);

        $class = Classe::create([
            'name' => 'L1 GL A',
            'level' => 'Licence 1',
            'academic_year' => '2025-2026',
        ]);

        $studentUser = User::create([
            'first_name' => 'Ali',
            'last_name' => 'Student',
            'email' => 'student_msg@test.local',
            'password' => Hash::make('password123'),
            'role_id' => $studentRole->id,
        ]);

        $student = Student::create([
            'user_id' => $studentUser->id,
            'class_id' => $class->id,
            'matricule' => 'MAT112233',
            'phone' => '22111333',
            'address' => 'Sousse',
            'date_of_birth' => '2002-05-15',
        ]);

        $teacherUser = User::create([
            'first_name' => 'Mariem',
            'last_name' => 'Teacher',
            'email' => 'teacher_msg@test.local',
            'password' => Hash::make('password123'),
            'role_id' => $teacherRole->id,
        ]);

        $teacher = Teacher::create([
            'user_id' => $teacherUser->id,
            'phone' => '55443322',
            'address' => 'Tunis',
            'date_of_birth' => '1985-04-12',
        ]);
        $teacher->classes()->attach($class->id);

        // Authenticate teacher
        $teacherHeaders = $this->authenticate($teacherUser);

        // 1. Get partners (Teacher should see Student in partners list)
        $partnersResponse = $this->getJson('/api/messages/partners', $teacherHeaders);
        $partnersResponse->assertOk()
            ->assertJsonFragment([
                'id' => $studentUser->id,
                'name' => 'Ali Student',
                'email' => 'student_msg@test.local',
                'role' => 'Student',
            ]);

        // 2. Send message from Teacher to Student
        $sendResponse = $this->postJson('/api/messages', [
            'subject' => 'Projet de fin d\'études',
            'body' => 'Bonjour Ali, as-tu choisi ton sujet ?',
            'receiver_id' => $studentUser->id,
        ], $teacherHeaders);

        $sendResponse->assertCreated()
            ->assertJsonPath('subject', 'Projet de fin d\'études')
            ->assertJsonPath('body', 'Bonjour Ali, as-tu choisi ton sujet ?');

        $messageId = $sendResponse->json('id');

        // 3. Student views messages inbox
        $studentHeaders = $this->authenticate($studentUser);
        $inboxResponse = $this->getJson('/api/messages', $studentHeaders);
        $inboxResponse->assertOk()
            ->assertJsonCount(1)
            ->assertJsonFragment(['id' => $messageId, 'is_unread' => true]);

        // 4. Mark message as read
        $readResponse = $this->putJson("/api/messages/{$messageId}/read", [], $studentHeaders);
        $readResponse->assertOk();

        // 5. Reply to the message
        $replyResponse = $this->postJson('/api/messages', [
            'parent_id' => $messageId,
            'body' => 'Oui, j\'aimerais travailler sur le CRM.',
        ], $studentHeaders);

        $replyResponse->assertCreated()
            ->assertJsonPath('parent_id', $messageId)
            ->assertJsonPath('subject', 'Re: Projet de fin d\'études')
            ->assertJsonPath('body', 'Oui, j\'aimerais travailler sur le CRM.');
    }
}
