<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use App\Models\Classe;
use App\Models\Subject;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Note;
use App\Models\AttendanceSession;
use App\Models\AttendanceRecord;
use App\Models\Payment;
use App\Models\Notification;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            'Admin', 'Administration', 'Teacher', 'Student',
            'Finance Officer', 'Internship Officer', 'Scolarite',
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role]);
        }

        User::firstOrCreate(
            ['email' => 'admin@school.com'],
            [
                'first_name' => 'Admin',
                'last_name' => 'EduFlow',
                'gender' => 'Male',
                'password' => Hash::make('password123'),
                'role_id' => Role::where('name', 'Admin')->first()->id
            ]
        );

        User::firstOrCreate(
            ['email' => 'finance@school.com'],
            [
                'first_name' => 'Finance',
                'last_name' => 'Officer',
                'gender' => 'Female',
                'password' => Hash::make('password123'),
                'role_id' => Role::where('name', 'Finance Officer')->first()->id
            ]
        );

        User::firstOrCreate(
            ['email' => 'internship@school.com'],
            [
                'first_name' => 'Internship',
                'last_name' => 'Manager',
                'gender' => 'Male',
                'password' => Hash::make('password123'),
                'role_id' => Role::where('name', 'Internship Manager')->first()->id
            ]
        );

        // 1. Create Subjects
        $subjectNames = [
            'Algorithmique', 'Base de données', 'Réseaux', 'Génie logiciel', 
            'Programmation Web', 'Intelligence Artificielle', 'Mathématiques'
        ];
        $subjects = [];
        foreach ($subjectNames as $sub) {
            $subjects[] = Subject::firstOrCreate(['name' => $sub], ['coefficient' => rand(1, 4)]);
        }

        // 2. Create Classes
        $classNames = [
            'L1 Informatique', 'L2 Informatique', 'L3 Informatique', 
            'M1 Informatique', 'M2 Informatique', 'L1 Gestion', 'M1 Finance', 'M2 Marketing', 'L2 Réseaux'
        ];
        $classes = [];
        foreach ($classNames as $cls) {
            $classes[] = Classe::firstOrCreate(['name' => $cls], ['level' => 'Higher Ed']);
        }

        // 3. Create Teachers
        $teacherNames = [
            ['first' => 'Sami', 'last' => 'Ben Salah', 'gender' => 'Male'], 
            ['first' => 'Leyla', 'last' => 'Mbarek', 'gender' => 'Female'], 
            ['first' => 'Kais', 'last' => 'Bouzid', 'gender' => 'Male'], 
            ['first' => 'Ines', 'last' => 'Mejri', 'gender' => 'Female']
        ];
        $teachers = [];
        foreach ($teacherNames as $i => $t) {
            $cin = '0' . rand(1000000, 9999999);
            $user = User::firstOrCreate(
                ['email' => 'teacher' . $cin . '@eduflow.school'],
                [
                    'first_name' => $t['first'],
                    'last_name' => $t['last'],
                    'gender' => $t['gender'],
                    'password' => Hash::make('teacher'),
                    'cin' => $cin,
                    'role_id' => 3
                ]
            );
            $teacher = Teacher::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'phone' => '55' . rand(100000, 999999), 
                    'address' => 'Tunis, Tunisia', 
                    'date_of_birth' => Carbon::now()->subYears(rand(35, 55)),
                    'subject_id' => $subjects[array_rand($subjects)]->id
                ]
            );
            $teachers[] = $teacher;
        }

        // 4. Create Students (Tunisian Names)
        $studentNames = [
            ['first' => 'Rahma', 'last' => 'Chrina', 'gender' => 'Female'],
            ['first' => 'Mohamed', 'last' => 'Ben Ali', 'gender' => 'Male'],
            ['first' => 'Ahmed', 'last' => 'Trabelsi', 'gender' => 'Male'],
            ['first' => 'Mariem', 'last' => 'Gharbi', 'gender' => 'Female'],
            ['first' => 'Youssef', 'last' => 'Khlifi', 'gender' => 'Male'],
            ['first' => 'Amira', 'last' => 'Ben Salem', 'gender' => 'Female'],
            ['first' => 'Walid', 'last' => 'Jaziri', 'gender' => 'Male'],
            ['first' => 'Fatma', 'last' => 'Heni', 'gender' => 'Female'],
            ['first' => 'Khalil', 'last' => 'Mansouri', 'gender' => 'Male'],
            ['first' => 'Nour', 'last' => 'Abid', 'gender' => 'Female']
        ];
        
        $students = [];
        foreach ($studentNames as $i => $s) {
            $cin = '1' . rand(1000000, 9999999);
            $user = User::firstOrCreate(
                ['email' => 'student' . $cin . '@eduflow.school'],
                [
                    'first_name' => $s['first'],
                    'last_name' => $s['last'],
                    'gender' => $s['gender'],
                    'password' => Hash::make('student'),
                    'cin' => $cin,
                    'role_id' => 4 
                ]
            );
            
            $assignedClass = $classes[array_rand($classes)];
            
            $students[] = Student::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'class_id' => $assignedClass->id,
                    'date_of_birth' => Carbon::now()->subYears(rand(18, 24))->subDays(rand(0, 365)),
                    'phone' => '22' . rand(100000, 999999),
                    'address' => 'Tunis, Tunisia',
                ]
            );
        }

        // 5. Generate Notes, Absences, Payments
        foreach ($students as $student) {
            // Notes (Random subsets of subjects)
            foreach (collect($subjects)->random(rand(4, 7)) as $subject) {
                 Note::create([
                     'student_id' => $student->id,
                     'subject_id' => $subject->id,
                     'teacher_id' => $teachers[array_rand($teachers)]->id,
                     'type' => collect(['CC', 'DS', 'TP', 'Exam'])->random(),
                     'value' => rand(5, 20) // Some low grades to trigger AI Weakness, some high for Excellent
                 ]);
            }

            // Payments (Paid, Unpaid, Partial)
            $statusOptions = ['Payé', 'Impayé', 'Partiellement payé'];
            $amount = rand(500, 1500);
            $status = $statusOptions[array_rand($statusOptions)];
            Payment::create([
                'student_id' => $student->id,
                'amount' => $amount,
                'status' => $status,
                'date' => Carbon::now()->addDays(rand(-30, 30)),
            ]);
        }

        // Generate Attendance Sessions
        foreach ($classes as $class) {
            for ($i = 0; $i < 3; $i++) {
                $session = AttendanceSession::create([
                    'class_id' => $class->id,
                    'subject_id' => $subjects[array_rand($subjects)]->id,
                    'teacher_id' => $teachers[array_rand($teachers)]->id,
                    'date' => Carbon::now()->subDays(rand(1, 30)),
                    'start_time' => '08:30:00',
                    'end_time' => '10:00:00'
                ]);
                $classStudents = collect($students)->where('class_id', $class->id);
                foreach ($classStudents as $student) {
                    $status = rand(1, 10) > 3 ? 'present' : (rand(1, 2) == 1 ? 'absent' : 'late');
                    AttendanceRecord::create([
                        'session_id' => $session->id,
                        'student_id' => $student->id,
                        'status' => $status,
                        'reason' => $status === 'absent' ? 'Sick' : null
                    ]);
                }
            }
        }

        // 6. Fake Notifications
        Notification::firstOrCreate(['title' => 'Exam Schedule Fall Semester'], [
            'message' => 'Please note that the final exams will start on Jan 15th. Check your schedules.',
            'role' => 'Student',
            'is_read' => false
        ]);
        Notification::firstOrCreate(['title' => 'Holiday Notice'], [
            'message' => 'The university will be closed for the Independence Day holiday.',
            'role' => null,
            'is_read' => false
        ]);
        Notification::firstOrCreate(['title' => 'New Grade Added'], [
            'message' => 'Your recent exam grade has been posted.',
            'role' => 'Student',
            'is_read' => false
        ]);
    }
}
