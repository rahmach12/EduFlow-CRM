<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Models\Student;
use App\Models\Classe;
use App\Models\Subject;
use App\Models\Note;
use Illuminate\Support\Facades\Hash;
use App\Jobs\EvaluateStudentPerformance;

class BadScoreSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $studentRole = Role::where('name', 'Student')->first();
        if (!$studentRole) {
            $studentRole = Role::create(['name' => 'Student']);
        }

        // 1. Create or retrieve User Chiheb Kammoun
        $user = User::firstOrCreate(
            ['email' => 'kammounchiheb@gmail.com'],
            [
                'first_name' => 'Chiheb',
                'last_name' => 'Kammoun',
                'password' => Hash::make('password123'),
                'role_id' => $studentRole->id,
            ]
        );

        // 2. Ensure we have a Class
        $classe = Classe::first();
        if (!$classe) {
            $classe = Classe::create(['name' => '1ere Annee Informatique']);
        }

        // 3. Create Student profile
        $student = Student::firstOrCreate(
            ['user_id' => $user->id],
            [
                'class_id' => $classe->id,
                'matricule' => 'STU-9999',
            ]
        );

        // 4. Ensure we have some Subjects
        $subjects = Subject::take(3)->get();
        if ($subjects->isEmpty()) {
            $subjects = collect([
                Subject::create(['name' => 'Mathématiques', 'coefficient' => 3]),
                Subject::create(['name' => 'Algorithmique', 'coefficient' => 4]),
                Subject::create(['name' => 'Physique', 'coefficient' => 2]),
            ]);
        }

        // 5. Add Extremely Bad Scores
        foreach ($subjects as $subject) {
            Note::create([
                'student_id' => $student->id,
                'subject_id' => $subject->id,
                'type' => 'Exam',
                'value' => rand(2, 6), // 2 to 6 out of 20
            ]);
        }

        $this->command->info('Dummy data for Chiheb Kammoun created with bad scores.');

        // 6. Manually Trigger the AI Evaluation Job to send the notification immediately
        $this->command->info('Triggering Ollama AI Evaluation for the bad scores...');
        dispatch(new EvaluateStudentPerformance($student->id))->afterResponse();
        // Fallback to sync dispatch in case afterResponse fails in console context
        // Actually, in CLI, afterResponse() might not fire if there's no response terminating.
        // So let's run it synchronously directly:
        $job = new EvaluateStudentPerformance($student->id);
        $job->handle();
        
        $this->command->info('Ollama AI Evaluation finished. Notification sent to Admin.');
    }
}
