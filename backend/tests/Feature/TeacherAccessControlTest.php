<?php

namespace Tests\Feature;

use App\Models\Classe;
use App\Models\Role;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Subject;
use App\Models\User;
use App\Models\Note;
use App\Models\Message;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class TeacherAccessControlTest extends TestCase
{
    use RefreshDatabase;

    private array $rolesMap = [];

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['Admin', 'Teacher', 'Student', 'Scolarite'] as $roleName) {
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

    private function createUser(string $roleName, string $email): User
    {
        return User::create([
            'first_name' => 'Test',
            'last_name' => $roleName,
            'email' => $email,
            'password' => Hash::make('password123'),
            'role_id' => $this->rolesMap[$roleName]->id,
        ]);
    }

    /**
     * Test admin can assign multiple classes & subjects to a teacher.
     */
    public function test_admin_can_assign_classes_and_subjects_to_teacher(): void
    {
        $admin = $this->createUser('Admin', 'admin@school.com');
        $headers = $this->authenticate($admin);

        $class1 = Classe::create(['name' => 'Class A']);
        $class2 = Classe::create(['name' => 'Class B']);
        $subject1 = Subject::create(['name' => 'Math']);
        $subject2 = Subject::create(['name' => 'Physics']);

        $teacherUser = $this->createUser('Teacher', 'teacher@school.com');
        $teacher = Teacher::create([
            'user_id' => $teacherUser->id,
            'phone' => '123456',
            'address' => 'Test Street',
            'date_of_birth' => '1980-01-01',
        ]);

        $response = $this->putJson("/api/teachers/{$teacher->id}", [
            'class_ids' => [$class1->id, $class2->id],
            'subject_ids' => [$subject1->id, $subject2->id],
        ], $headers);

        $response->assertOk();
        $this->assertDatabaseHas('class_teacher', ['teacher_id' => $teacher->id, 'class_id' => $class1->id]);
        $this->assertDatabaseHas('class_teacher', ['teacher_id' => $teacher->id, 'class_id' => $class2->id]);
        $this->assertDatabaseHas('subject_teacher', ['teacher_id' => $teacher->id, 'subject_id' => $subject1->id]);
        $this->assertDatabaseHas('subject_teacher', ['teacher_id' => $teacher->id, 'subject_id' => $subject2->id]);
    }

    /**
     * Test teacher can only see their assigned classes.
     */
    public function test_teacher_can_only_see_assigned_classes(): void
    {
        $class1 = Classe::create(['name' => 'Assigned Class']);
        $class2 = Classe::create(['name' => 'Unassigned Class']);

        $teacherUser = $this->createUser('Teacher', 'teacher@school.com');
        $teacher = Teacher::create(['user_id' => $teacherUser->id]);
        $teacher->classes()->attach($class1->id);

        $headers = $this->authenticate($teacherUser);

        // Test Index
        $response = $this->getJson('/api/classes', $headers);
        $response->assertOk();
        $response->assertJsonCount(1);
        $response->assertJsonFragment(['name' => 'Assigned Class']);
        $response->assertJsonMissing(['name' => 'Unassigned Class']);

        // Test Show assigned class
        $this->getJson("/api/classes/{$class1->id}", $headers)->assertOk();

        // Test Show unassigned class
        $this->getJson("/api/classes/{$class2->id}", $headers)->assertStatus(403);
    }

    /**
     * Test teacher can only see students in their assigned classes.
     */
    public function test_teacher_can_only_see_students_in_assigned_classes(): void
    {
        $class1 = Classe::create(['name' => 'Class 1']);
        $class2 = Classe::create(['name' => 'Class 2']);

        $studentUser1 = $this->createUser('Student', 'student1@school.com');
        $student1 = Student::create(['user_id' => $studentUser1->id, 'class_id' => $class1->id]);

        $studentUser2 = $this->createUser('Student', 'student2@school.com');
        $student2 = Student::create(['user_id' => $studentUser2->id, 'class_id' => $class2->id]);

        $teacherUser = $this->createUser('Teacher', 'teacher@school.com');
        $teacher = Teacher::create(['user_id' => $teacherUser->id]);
        $teacher->classes()->attach($class1->id);

        $headers = $this->authenticate($teacherUser);

        // Test Index
        $response = $this->getJson('/api/students', $headers);
        $response->assertOk();
        $response->assertJsonCount(1);
        $response->assertJsonFragment(['id' => $student1->id]);
        $response->assertJsonMissing(['id' => $student2->id]);

        // Test Show assigned student
        $this->getJson("/api/students/{$student1->id}", $headers)->assertOk();

        // Test Show unassigned student
        $this->getJson("/api/students/{$student2->id}", $headers)->assertStatus(403);
    }

    /**
     * Test teacher grading security.
     */
    public function test_teacher_grading_security(): void
    {
        $class1 = Classe::create(['name' => 'Class 1']);
        $class2 = Classe::create(['name' => 'Class 2']);

        $studentUser1 = $this->createUser('Student', 'student1@school.com');
        $student1 = Student::create(['user_id' => $studentUser1->id, 'class_id' => $class1->id]);

        $studentUser2 = $this->createUser('Student', 'student2@school.com');
        $student2 = Student::create(['user_id' => $studentUser2->id, 'class_id' => $class2->id]);

        $subject1 = Subject::create(['name' => 'Math']);
        $subject2 = Subject::create(['name' => 'Physics']);

        $teacherUser = $this->createUser('Teacher', 'teacher@school.com');
        $teacher = Teacher::create(['user_id' => $teacherUser->id]);
        $teacher->classes()->attach($class1->id);
        $teacher->subjects()->attach($subject1->id);

        $headers = $this->authenticate($teacherUser);

        // 1. Success case: assigned class, taught subject
        $response = $this->postJson('/api/notes', [
            'student_id' => $student1->id,
            'subject_id' => $subject1->id,
            'type' => 'Exam',
            'value' => 15,
        ], $headers);
        $response->assertCreated();

        // 2. Failure: student not in assigned class
        $response = $this->postJson('/api/notes', [
            'student_id' => $student2->id,
            'subject_id' => $subject1->id,
            'type' => 'Exam',
            'value' => 15,
        ], $headers);
        $response->assertStatus(403);

        // 3. Failure: subject not taught by teacher
        $response = $this->postJson('/api/notes', [
            'student_id' => $student1->id,
            'subject_id' => $subject2->id,
            'type' => 'Exam',
            'value' => 15,
        ], $headers);
        $response->assertStatus(403);
    }

    /**
     * Test teacher attendance logging security.
     */
    public function test_teacher_attendance_security(): void
    {
        $class1 = Classe::create(['name' => 'Class 1']);
        $class2 = Classe::create(['name' => 'Class 2']);

        $studentUser1 = $this->createUser('Student', 'student1@school.com');
        $student1 = Student::create(['user_id' => $studentUser1->id, 'class_id' => $class1->id]);

        $subject1 = Subject::create(['name' => 'Math']);
        $subject2 = Subject::create(['name' => 'Physics']);

        $teacherUser = $this->createUser('Teacher', 'teacher@school.com');
        $teacher = Teacher::create(['user_id' => $teacherUser->id]);
        $teacher->classes()->attach($class1->id);
        $teacher->subjects()->attach($subject1->id);

        $headers = $this->authenticate($teacherUser);

        // 1. Success case: log attendance for class 1, subject 1
        $response = $this->postJson('/api/attendance', [
            'class_id' => $class1->id,
            'subject_id' => $subject1->id,
            'date' => '2026-05-21',
            'start_time' => '08:30:00',
            'end_time' => '10:00:00',
            'records' => [
                ['student_id' => $student1->id, 'status' => 'present']
            ]
        ], $headers);
        $response->assertCreated();

        // 2. Failure: class 2 is not assigned
        $response = $this->postJson('/api/attendance', [
            'class_id' => $class2->id,
            'subject_id' => $subject1->id,
            'date' => '2026-05-21',
            'start_time' => '08:30:00',
            'end_time' => '10:00:00',
            'records' => [
                ['student_id' => $student1->id, 'status' => 'present']
            ]
        ], $headers);
        $response->assertStatus(403);

        // 3. Failure: subject 2 is not taught by teacher
        $response = $this->postJson('/api/attendance', [
            'class_id' => $class1->id,
            'subject_id' => $subject2->id,
            'date' => '2026-05-21',
            'start_time' => '08:30:00',
            'end_time' => '10:00:00',
            'records' => [
                ['student_id' => $student1->id, 'status' => 'present']
            ]
        ], $headers);
        $response->assertStatus(403);
    }

    /**
     * Test teacher messaging/broadcasting security.
     */
    public function test_teacher_messaging_security(): void
    {
        $class1 = Classe::create(['name' => 'Class 1']);
        $class2 = Classe::create(['name' => 'Class 2']);

        $studentUser1 = $this->createUser('Student', 'student1@school.com');
        $student1 = Student::create(['user_id' => $studentUser1->id, 'class_id' => $class1->id]);

        $studentUser2 = $this->createUser('Student', 'student2@school.com');
        $student2 = Student::create(['user_id' => $studentUser2->id, 'class_id' => $class2->id]);

        $teacherUser = $this->createUser('Teacher', 'teacher@school.com');
        $teacher = Teacher::create(['user_id' => $teacherUser->id]);
        $teacher->classes()->attach($class1->id);

        $headers = $this->authenticate($teacherUser);

        // 1. Success: message student of class 1
        $response = $this->postJson('/api/messages', [
            'receiver_id' => $studentUser1->id,
            'subject' => 'Hello student 1',
            'body' => 'Message body',
        ], $headers);
        $response->assertCreated();

        // 2. Failure: message student of class 2 (not assigned)
        $response = $this->postJson('/api/messages', [
            'receiver_id' => $studentUser2->id,
            'subject' => 'Hello student 2',
            'body' => 'Message body',
        ], $headers);
        $response->assertStatus(403);

        // 3. Success: broadcast to class 1
        $response = $this->postJson('/api/messages', [
            'class_id' => $class1->id,
            'subject' => 'Class Broadcast',
            'body' => 'Welcome',
        ], $headers);
        $response->assertCreated();

        // 4. Failure: broadcast to class 2 (not assigned)
        $response = $this->postJson('/api/messages', [
            'class_id' => $class2->id,
            'subject' => 'Class Broadcast',
            'body' => 'Welcome',
        ], $headers);
        $response->assertStatus(403);
    }

    /**
     * Test teacher can only see their assigned subjects.
     */
    public function test_teacher_can_only_see_assigned_subjects(): void
    {
        $subject1 = Subject::create(['name' => 'Assigned Subject']);
        $subject2 = Subject::create(['name' => 'Unassigned Subject']);

        $teacherUser = $this->createUser('Teacher', 'teacher@school.com');
        $teacher = Teacher::create(['user_id' => $teacherUser->id]);
        $teacher->subjects()->attach($subject1->id);

        $headers = $this->authenticate($teacherUser);

        // Test Index
        $response = $this->getJson('/api/subjects', $headers);
        $response->assertOk();
        $response->assertJsonCount(1);
        $response->assertJsonFragment(['name' => 'Assigned Subject']);
        $response->assertJsonMissing(['name' => 'Unassigned Subject']);

        // Test Show assigned subject
        $this->getJson("/api/subjects/{$subject1->id}", $headers)->assertOk();

        // Test Show unassigned subject
        $this->getJson("/api/subjects/{$subject2->id}", $headers)->assertStatus(403);
    }
}
