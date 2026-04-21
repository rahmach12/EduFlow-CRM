<?php

namespace Tests\Feature;

use App\Models\Classe;
use App\Models\Internship;
use App\Models\Notification;
use App\Models\Role;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthAndDashboardTest extends TestCase
{
    use RefreshDatabase;

    private function authenticate(User $user): array
    {
        $token = JWTAuth::fromUser($user);

        return [
            'Authorization' => 'Bearer ' . $token,
        ];
    }

    public function test_user_can_login_and_fetch_profile(): void
    {
        $role = Role::create(['name' => 'Admin']);
        $user = User::create([
            'first_name' => 'Rahma',
            'last_name' => 'Chrina',
            'email' => 'admin@test.local',
            'password' => Hash::make('password123'),
            'role_id' => $role->id,
        ]);

        $loginResponse = $this->postJson('/api/login', [
            'email' => 'admin@test.local',
            'password' => 'password123',
        ]);

        $loginResponse
            ->assertOk()
            ->assertJsonStructure([
                'access_token',
                'token_type',
                'expires_in',
                'user' => ['id', 'first_name', 'last_name', 'role'],
            ]);

        $profileResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $loginResponse->json('access_token'),
        ])->getJson('/api/me');

        $profileResponse
            ->assertOk()
            ->assertJsonPath('id', $user->id)
            ->assertJsonPath('role.name', 'Admin');
    }

    public function test_dashboard_stats_and_alerts_return_expected_business_data(): void
    {
        $adminRole = Role::create(['name' => 'Admin']);
        $studentRole = Role::create(['name' => 'Student']);
        $teacherRole = Role::create(['name' => 'Teacher']);

        $admin = User::create([
            'first_name' => 'Admin',
            'last_name' => 'Owner',
            'email' => 'owner@test.local',
            'password' => Hash::make('password123'),
            'role_id' => $adminRole->id,
        ]);

        $class = Classe::create([
            'name' => 'L3 GL',
            'level' => 'Licence',
            'academic_year' => '2025-2026',
        ]);

        $teacherUser = User::create([
            'first_name' => 'Sami',
            'last_name' => 'Ben Salah',
            'email' => 'teacher@test.local',
            'password' => Hash::make('password123'),
            'role_id' => $teacherRole->id,
        ]);

        Teacher::create([
            'user_id' => $teacherUser->id,
            'phone' => '22123456',
            'address' => 'Tunis',
            'date_of_birth' => '1985-01-10',
        ]);

        $studentUser = User::create([
            'first_name' => 'Rahma',
            'last_name' => 'Chrina',
            'email' => 'student@test.local',
            'password' => Hash::make('password123'),
            'role_id' => $studentRole->id,
        ]);

        $student = Student::create([
            'user_id' => $studentUser->id,
            'class_id' => $class->id,
            'date_of_birth' => '2001-04-17',
            'phone' => '55112233',
            'address' => 'Sfax',
            'is_eliminated' => true,
        ]);

        Internship::create([
            'student_id' => $student->id,
            'type' => 'PFE',
            'company_name' => 'OpenAI',
            'start_date' => '2026-02-01',
            'end_date' => '2026-06-30',
            'status' => 'Pending',
        ]);

        Notification::create([
            'title' => 'Rappel',
            'message' => 'Paiement en attente',
            'is_read' => false,
        ]);

        $headers = $this->authenticate($admin);

        $statsResponse = $this->withHeaders($headers)->getJson('/api/dashboard/stats');
        $statsResponse
            ->assertOk()
            ->assertJsonPath('students_count', 1)
            ->assertJsonPath('teachers_count', 1)
            ->assertJsonPath('classes_count', 1);

        $alertsResponse = $this->withHeaders($headers)->getJson('/api/dashboard/alerts');
        $alertsResponse
            ->assertOk()
            ->assertJsonCount(4)
            ->assertJsonFragment(['key' => 'finance_follow_up', 'value' => 0])
            ->assertJsonFragment(['key' => 'internship_queue', 'value' => 1])
            ->assertJsonFragment(['key' => 'student_risk', 'value' => 1])
            ->assertJsonFragment(['key' => 'notification_backlog', 'value' => 1]);
    }
}
