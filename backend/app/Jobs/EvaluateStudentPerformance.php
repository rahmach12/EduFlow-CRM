<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Student;
use App\Models\User;
use App\Models\Notification;

class EvaluateStudentPerformance implements ShouldQueue
{
    use Queueable;

    public $studentId;

    /**
     * Create a new job instance.
     */
    public function __construct($studentId)
    {
        $this->studentId = $studentId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $student = Student::with(['user', 'classe', 'notes.subject'])->find($this->studentId);
        if (!$student) return;

        $totalSum = 0;
        $totalCoef = 0;

        foreach ($student->notes->groupBy('subject_id') as $subjectId => $notes) {
            $subject = $notes->first()->subject;
            $coef = $subject->coefficient;
            $avg = $notes->avg('value');
            $totalSum += ($avg * $coef);
            $totalCoef += $coef;
        }

        if ($totalCoef == 0) return;

        $generalAverage = $totalSum / $totalCoef;

        // Condition for bad score: Average under 10
        if ($generalAverage < 10) {
            $this->notifyAdminWithAI($student, $generalAverage);
        }
    }

    protected function notifyAdminWithAI($student, $average)
    {
        $className = $student->classe ? $student->classe->name : 'Unknown Class';
        $name = $student->user->first_name . ' ' . $student->user->last_name;

        // Use OllamaService to generate the alert message
        $ollamaService = app(\App\Services\OllamaService::class);
        $message = $ollamaService->generateAlert($name, $className, $average);

        if (!$message) {
            $message = "⚠️ L'étudiant {$name} ({$className}) présente une moyenne très faible de " . round($average, 2) . "/20. Un suivi pédagogique urgent est recommandé.";
        }

        try {
            // Send notification to Admins
            $admins = User::whereHas('role', function($q) {
                $q->whereIn('name', ['Admin', 'Administration']);
            })->get();

            foreach ($admins as $admin) {
                $notification = Notification::create([
                    'user_id' => $admin->id,
                    'title' => "⚠️ Alerte Académique: {$name}",
                    'message' => trim($message),
                    'is_read' => false
                ]);
                
                // Broadcast for real-time update
                broadcast(new \App\Events\NotificationCreated($notification))->toOthers();
            }
        } catch (\Exception $e) {
            Log::error('AI Evaluation notification failed: ' . $e->getMessage());
        }
    }
}
