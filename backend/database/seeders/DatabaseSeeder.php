<?php

namespace Database\Seeders;

use App\Models\AcademicLevel;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\Classe;
use App\Models\Faculty;
use App\Models\Filiere;
use App\Models\Note;
use App\Models\Notification;
use App\Models\Payment;
use App\Models\Role;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['Admin', 'Teacher', 'Student', 'Finance Officer', 'Internship Manager', 'Scolarite'] as $role) {
            Role::firstOrCreate(['name' => $role]);
        }

        $faculty = Faculty::firstOrCreate(
            ['name' => 'Faculte des Sciences Informatiques'],
            ['code' => 'FSI']
        );

        $filieres = collect([
            ['name' => 'Big Data', 'code' => 'BD'],
            ['name' => 'Genie Logiciel', 'code' => 'GL'],
            ['name' => 'Reseaux', 'code' => 'RES'],
            ['name' => 'Intelligence Artificielle', 'code' => 'IA'],
            ['name' => 'Securite Informatique', 'code' => 'SEC'],
        ])->mapWithKeys(fn ($filiere) => [
            $filiere['name'] => Filiere::firstOrCreate(
                ['faculty_id' => $faculty->id, 'name' => $filiere['name']],
                ['code' => $filiere['code']]
            )
        ]);

        $levels = collect([
            ['cycle' => 'Prepa', 'name' => '1ere Prepa', 'slug' => 'prepa-1', 'rank' => 10],
            ['cycle' => 'Prepa', 'name' => '2eme Prepa', 'slug' => 'prepa-2', 'rank' => 20],
            ['cycle' => 'Licence', 'name' => '1ere Licence', 'slug' => 'licence-1', 'rank' => 30],
            ['cycle' => 'Licence', 'name' => '2eme Licence', 'slug' => 'licence-2', 'rank' => 40],
            ['cycle' => 'Licence', 'name' => 'Terminale Licence', 'slug' => 'licence-3', 'rank' => 50],
            ['cycle' => 'Cycle Ingenieur', 'name' => '1ere Cycle', 'slug' => 'cycle-1', 'rank' => 60],
            ['cycle' => 'Cycle Ingenieur', 'name' => '2eme Cycle', 'slug' => 'cycle-2', 'rank' => 70],
            ['cycle' => 'Cycle Ingenieur', 'name' => '3eme Cycle', 'slug' => 'cycle-3', 'rank' => 80],
            ['cycle' => 'Master', 'name' => 'Master 1', 'slug' => 'master-1', 'rank' => 90],
            ['cycle' => 'Master', 'name' => 'Master 2', 'slug' => 'master-2', 'rank' => 100],
        ])->mapWithKeys(fn ($level) => [
            $level['slug'] => AcademicLevel::firstOrCreate(
                ['slug' => $level['slug']],
                ['cycle' => $level['cycle'], 'name' => $level['name'], 'rank' => $level['rank']]
            )
        ]);

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

        $subjectNames = [
            'Algorithmique', 'Base de donnees', 'Reseaux', 'Genie logiciel',
            'Programmation Web', 'Intelligence Artificielle', 'Mathematiques'
        ];
        $subjects = [];
        foreach ($subjectNames as $subjectName) {
            $subjects[] = Subject::firstOrCreate(['name' => $subjectName], ['coefficient' => rand(1, 4)]);
        }

        $classes = [];
        $classMatrix = [
            ['filiere' => 'Big Data', 'level' => 'licence-1', 'classes' => ['L1 Big Data A', 'L1 Big Data B']],
            ['filiere' => 'Big Data', 'level' => 'licence-2', 'classes' => ['L2 Big Data A', 'L2 Big Data B']],
            ['filiere' => 'Big Data', 'level' => 'licence-3', 'classes' => ['L3 Big Data A', 'L3 Big Data B']],
            ['filiere' => 'Genie Logiciel', 'level' => 'cycle-1', 'classes' => ['CI1 GL A']],
            ['filiere' => 'Reseaux', 'level' => 'master-1', 'classes' => ['M1 Reseaux A']],
            ['filiere' => 'Intelligence Artificielle', 'level' => 'master-2', 'classes' => ['M2 IA A']],
        ];

        foreach ($classMatrix as $entry) {
            foreach ($entry['classes'] as $className) {
                $filiere = $filieres[$entry['filiere']];
                $level = $levels[$entry['level']];
                $classes[] = Classe::firstOrCreate(
                    ['name' => $className],
                    [
                        'code' => strtoupper(str_replace(' ', '-', $className)),
                        'level' => $level->name,
                        'academic_year' => '2025-2026',
                        'faculty_id' => $faculty->id,
                        'filiere_id' => $filiere->id,
                        'academic_level_id' => $level->id,
                    ]
                );
            }
        }

        $teacherNames = [
            ['first' => 'Sami', 'last' => 'Ben Salah', 'gender' => 'Male'],
            ['first' => 'Leyla', 'last' => 'Mbarek', 'gender' => 'Female'],
            ['first' => 'Kais', 'last' => 'Bouzid', 'gender' => 'Male'],
            ['first' => 'Ines', 'last' => 'Mejri', 'gender' => 'Female']
        ];
        $teachers = [];
        foreach ($teacherNames as $teacherData) {
            $cin = '0' . rand(1000000, 9999999);
            $user = User::firstOrCreate(
                ['email' => 'teacher' . $cin . '@eduflow.school'],
                [
                    'first_name' => $teacherData['first'],
                    'last_name' => $teacherData['last'],
                    'gender' => $teacherData['gender'],
                    'password' => Hash::make('teacher'),
                    'cin' => $cin,
                    'role_id' => Role::where('name', 'Teacher')->first()->id
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
        foreach ($studentNames as $studentData) {
            $cin = '1' . rand(1000000, 9999999);
            $user = User::firstOrCreate(
                ['email' => 'student' . $cin . '@eduflow.school'],
                [
                    'first_name' => $studentData['first'],
                    'last_name' => $studentData['last'],
                    'gender' => $studentData['gender'],
                    'password' => Hash::make('student'),
                    'cin' => $cin,
                    'role_id' => Role::where('name', 'Student')->first()->id
                ]
            );

            $assignedClass = $classes[array_rand($classes)];

            $students[] = Student::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'class_id' => $assignedClass->id,
                    'matricule' => 'MAT' . rand(100000, 999999),
                    'date_of_birth' => Carbon::now()->subYears(rand(18, 24))->subDays(rand(0, 365)),
                    'phone' => '22' . rand(100000, 999999),
                    'address' => 'Tunis, Tunisia',
                ]
            );
        }

        foreach ($students as $student) {
            foreach (collect($subjects)->random(rand(4, 7)) as $subject) {
                Note::create([
                    'student_id' => $student->id,
                    'subject_id' => $subject->id,
                    'teacher_id' => $teachers[array_rand($teachers)]->id,
                    'type' => collect(['CC', 'DS', 'TP', 'Exam'])->random(),
                    'value' => rand(5, 20)
                ]);
            }

            $statusOptions = ['Paid', 'Unpaid', 'Partially Paid'];
            $amount = rand(500, 1500);
            $status = $statusOptions[array_rand($statusOptions)];
            Payment::create([
                'student_id' => $student->id,
                'amount' => $status === 'Paid' ? $amount : ($status === 'Partially Paid' ? round($amount / 2, 2) : 0),
                'amount_due' => $amount,
                'amount_paid' => $status === 'Paid' ? $amount : ($status === 'Partially Paid' ? round($amount / 2, 2) : 0),
                'status' => $status,
                'date' => Carbon::now()->addDays(rand(-30, 30)),
                'receipt_number' => 'RCPT-' . strtoupper(substr(uniqid(), -6)),
            ]);
        }

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
                    $status = rand(1, 10) > 3 ? 'present' : (rand(1, 2) === 1 ? 'absent' : 'late');
                    AttendanceRecord::create([
                        'session_id' => $session->id,
                        'student_id' => $student->id,
                        'status' => $status,
                        'reason' => $status === 'absent' ? 'Sick' : null
                    ]);
                }
            }
        }

        Notification::firstOrCreate(['title' => 'Exam Schedule Fall Semester'], [
            'message' => 'Please note that the final exams will start on Jan 15th. Check your schedules.',
            'role' => 'Student',
            'type' => 'announcement',
            'is_read' => false
        ]);
        Notification::firstOrCreate(['title' => 'Holiday Notice'], [
            'message' => 'The university will be closed for the Independence Day holiday.',
            'role' => null,
            'type' => 'announcement',
            'is_read' => false
        ]);
        Notification::firstOrCreate(['title' => 'New Grade Added'], [
            'message' => 'Your recent exam grade has been posted.',
            'role' => 'Student',
            'type' => 'grade',
            'is_read' => false
        ]);
    }
}
