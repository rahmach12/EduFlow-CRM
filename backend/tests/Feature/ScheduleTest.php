<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Role;
use App\Models\Semester;
use App\Models\Room;
use App\Models\TimeSlot;
use App\Models\Teacher;
use App\Models\Subject;
use App\Models\Classe;
use App\Models\Schedule;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ScheduleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Create Roles
        $adminRole = Role::firstOrCreate(['name' => 'Admin']);
        Role::firstOrCreate(['name' => 'Teacher']);
        Role::firstOrCreate(['name' => 'Student']);

        // Create Admin User
        $this->adminUser = User::factory()->create([
            'email' => 'admin_test@school.com',
            'role_id' => $adminRole->id
        ]);
    }

    public function test_admin_can_fetch_schedules_options()
    {
        $response = $this->actingAs($this->adminUser, 'api')
            ->getJson('/api/schedules/options');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'classes', 'subjects', 'teachers', 'rooms', 'semesters', 'time_slots'
        ]);
    }

    public function test_automatic_schedule_generation()
    {
        // Setup data
        $semester = Semester::create(['name' => 'Semestre 1', 'is_active' => true]);
        $room1 = Room::create(['name' => 'Salle 101', 'code' => 'S101', 'type' => 'Cours', 'capacity' => 40]);
        $room2 = Room::create(['name' => 'Labo 1', 'code' => 'L1', 'type' => 'TP', 'capacity' => 20]);
        
        $slot1 = TimeSlot::create(['name' => 'Séance 1', 'start_time' => '08:30:00', 'end_time' => '10:00:00']);
        $slot2 = TimeSlot::create(['name' => 'Séance 2', 'start_time' => '10:15:00', 'end_time' => '11:45:00']);

        $subject = Subject::create(['name' => 'Algorithmique', 'coefficient' => 3, 'hours_cours' => 3.0, 'hours_tp' => 1.5, 'color' => '#3b82f6']);

        $classe = Classe::create(['name' => 'CI1 GL A', 'code' => 'CI1-GL-A', 'level' => '1']);

        // Create Teacher User and Teacher
        $teacherUser = User::factory()->create(['role_id' => Role::where('name', 'Teacher')->first()->id]);
        $teacher = Teacher::create([
            'user_id' => $teacherUser->id,
            'hourly_volume' => 20
        ]);
        
        // Sync subject and class
        $teacher->subjects()->attach($subject->id);
        $teacher->classes()->attach($classe->id);

        // Generate schedule
        $response = $this->actingAs($this->adminUser, 'api')
            ->postJson('/api/schedules/generate', [
                'semester_id' => $semester->id
            ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success', 'generated_count', 'unassigned_count'
        ]);

        $this->assertDatabaseHas('schedules', [
            'class_id' => $classe->id,
            'subject_id' => $subject->id,
            'teacher_id' => $teacher->id,
            'semester_id' => $semester->id,
        ]);
    }

    public function test_prevent_clashing_manual_schedules()
    {
        $semester = Semester::create(['name' => 'Semestre 1', 'is_active' => true]);
        $room = Room::create(['name' => 'Salle 101', 'code' => 'S101', 'type' => 'Cours', 'capacity' => 40]);
        $slot = TimeSlot::create(['name' => 'Séance 1', 'start_time' => '08:30:00', 'end_time' => '10:00:00']);
        $subject = Subject::create(['name' => 'Algorithmique', 'coefficient' => 3, 'hours_cours' => 3.0]);
        
        $class1 = Classe::create(['name' => 'CI1 GL A', 'code' => 'CI1-GL-A']);
        $class2 = Classe::create(['name' => 'CI1 GL B', 'code' => 'CI1-GL-B']);

        $teacherUser = User::factory()->create(['role_id' => Role::where('name', 'Teacher')->first()->id]);
        $teacher = Teacher::create(['user_id' => $teacherUser->id, 'hourly_volume' => 20]);

        // Create initial session
        Schedule::create([
            'class_id' => $class1->id,
            'subject_id' => $subject->id,
            'teacher_id' => $teacher->id,
            'room_id' => $room->id,
            'semester_id' => $semester->id,
            'time_slot_id' => $slot->id,
            'day_of_week' => 'Monday',
            'type' => 'Cours',
            'frequency' => 'weekly'
        ]);

        // Try to schedule class2 at the same slot and room with the same teacher (Double clash)
        $response = $this->actingAs($this->adminUser, 'api')
            ->postJson('/api/schedules', [
                'class_id' => $class2->id,
                'subject_id' => $subject->id,
                'teacher_id' => $teacher->id,
                'room_id' => $room->id,
                'semester_id' => $semester->id,
                'time_slot_id' => $slot->id,
                'day_of_week' => 'Monday',
                'type' => 'Cours',
                'frequency' => 'weekly'
            ]);

        // Should return 422 Unprocessable Entity due to conflicts
        $response->assertStatus(422);
        $response->assertJsonStructure(['message', 'errors']);
    }
}
