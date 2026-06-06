<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Department;
use App\Models\Semester;
use App\Models\Room;
use App\Models\Group;
use App\Models\TimeSlot;
use App\Models\Teacher;
use App\Models\Subject;
use App\Models\Classe;
use App\Models\TeacherAvailability;

class AdvancedScheduleSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Semesters
        $s1 = Semester::firstOrCreate(['name' => 'Semestre 1'], ['is_active' => true]);
        $s2 = Semester::firstOrCreate(['name' => 'Semestre 2'], ['is_active' => false]);

        // 2. Create Departments
        $depIT = Department::firstOrCreate(['code' => 'IT'], ['name' => 'Département Informatique']);
        $depMath = Department::firstOrCreate(['code' => 'MATH'], ['name' => 'Département de Mathématiques']);
        $depTelecom = Department::firstOrCreate(['code' => 'TEL'], ['name' => 'Département Télécom & Réseaux']);

        // 3. Create Time Slots (Séances 1 to 5)
        $slots = [
            ['name' => 'Séance 1', 'start_time' => '08:30:00', 'end_time' => '10:00:00'],
            ['name' => 'Séance 2', 'start_time' => '10:15:00', 'end_time' => '11:45:00'],
            ['name' => 'Séance 3', 'start_time' => '12:00:00', 'end_time' => '13:30:00'],
            ['name' => 'Séance 4', 'start_time' => '13:45:00', 'end_time' => '15:15:00'],
            ['name' => 'Séance 5', 'start_time' => '15:30:00', 'end_time' => '17:00:00'],
        ];

        $timeSlots = [];
        foreach ($slots as $slot) {
            $timeSlots[] = TimeSlot::firstOrCreate(['name' => $slot['name']], [
                'start_time' => $slot['start_time'],
                'end_time' => $slot['end_time']
            ]);
        }

        // 4. Create Rooms
        $rooms = [
            ['name' => 'Amphi A', 'code' => 'AMP-A', 'type' => 'Cours', 'capacity' => 100],
            ['name' => 'Amphi B', 'code' => 'AMP-B', 'type' => 'Cours', 'capacity' => 100],
            ['name' => 'Salle 101', 'code' => 'S101', 'type' => 'Cours', 'capacity' => 40],
            ['name' => 'Salle 102', 'code' => 'S102', 'type' => 'Cours', 'capacity' => 40],
            ['name' => 'Salle TD 1', 'code' => 'STD1', 'type' => 'TD', 'capacity' => 30],
            ['name' => 'Salle TD 2', 'code' => 'STD2', 'type' => 'TD', 'capacity' => 30],
            ['name' => 'Laboratoire Informatique 1', 'code' => 'LAB-IT1', 'type' => 'TP', 'capacity' => 20],
            ['name' => 'Laboratoire Informatique 2', 'code' => 'LAB-IT2', 'type' => 'TP', 'capacity' => 20],
            ['name' => 'Laboratoire Réseaux', 'code' => 'LAB-RES', 'type' => 'TP', 'capacity' => 20],
        ];

        foreach ($rooms as $room) {
            Room::firstOrCreate(['code' => $room['code']], [
                'name' => $room['name'],
                'type' => $room['type'],
                'capacity' => $room['capacity']
            ]);
        }

        // 5. Update existing Subjects with realistic hours and colors
        $subjectHours = [
            'Algorithmique' => ['cours' => 3.0, 'td' => 1.5, 'tp' => 1.5, 'color' => '#3b82f6'], // blue
            'Base de donnees' => ['cours' => 1.5, 'td' => 1.5, 'tp' => 1.5, 'color' => '#10b981'], // emerald
            'Reseaux' => ['cours' => 3.0, 'td' => 0.0, 'tp' => 1.5, 'color' => '#f59e0b'], // amber
            'Genie logiciel' => ['cours' => 1.5, 'td' => 1.5, 'tp' => 0.0, 'color' => '#8b5cf6'], // purple
            'Programmation Web' => ['cours' => 1.5, 'td' => 0.0, 'tp' => 3.0, 'color' => '#ec4899'], // pink
            'Intelligence Artificielle' => ['cours' => 3.0, 'td' => 0.0, 'tp' => 1.5, 'color' => '#14b8a6'], // teal
            'Mathematiques' => ['cours' => 3.0, 'td' => 3.0, 'tp' => 0.0, 'color' => '#ef4444'], // red
        ];

        foreach ($subjectHours as $name => $hours) {
            $subj = Subject::where('name', $name)->first();
            if ($subj) {
                $subj->update([
                    'hours_cours' => $hours['cours'],
                    'hours_td' => $hours['td'],
                    'hours_tp' => $hours['tp'],
                    'color' => $hours['color']
                ]);
            }
        }

        // 6. Update existing Teachers with departments & hourly volumes
        $teachers = Teacher::all();
        $departments = [$depIT->id, $depMath->id, $depTelecom->id];
        
        foreach ($teachers as $idx => $teacher) {
            $teacher->update([
                'hourly_volume' => rand(15, 25),
                'department_id' => $departments[$idx % count($departments)]
            ]);

            // Create Teacher Availabilities (Available for Séance 1-4, Monday-Friday, Wednesday afternoon off)
            $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
            foreach ($days as $day) {
                foreach ($timeSlots as $slotIdx => $slot) {
                    // Wednesday afternoon (Séance 4 & 5) off
                    $isAvailable = true;
                    if ($day === 'Wednesday' && $slotIdx >= 3) {
                        $isAvailable = false;
                    }
                    // Friday afternoon (Séance 5) off
                    if ($day === 'Friday' && $slotIdx >= 4) {
                        $isAvailable = false;
                    }

                    TeacherAvailability::firstOrCreate([
                        'teacher_id' => $teacher->id,
                        'day_of_week' => $day,
                        'time_slot_id' => $slot->id
                    ], [
                        'is_available' => $isAvailable
                    ]);
                }
            }
        }

        // 7. Create Groups for all existing Classes (Groupe 1 and Groupe 2)
        $classes = Classe::all();
        foreach ($classes as $classe) {
            Group::firstOrCreate([
                'class_id' => $classe->id,
                'name' => 'Groupe 1'
            ]);
            Group::firstOrCreate([
                'class_id' => $classe->id,
                'name' => 'Groupe 2'
            ]);
        }
    }
}
