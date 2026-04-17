<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Schedule;
use App\Models\Classe;
use App\Models\Subject;
use App\Models\Teacher;

class ScheduleController extends Controller
{
    public function index()
    {
        return response()->json(Schedule::with(['classe', 'subject', 'teacher.user'])->get());
    }

    public function generate(Request $request)
    {
        // 1. Clear existing schedules to regenerate a fresh one
        Schedule::truncate();

        $classes = Classe::all();
        $subjects = Subject::all();
        $teachers = Teacher::with('subjects')->get();

        $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        $timeSlots = [
            ['start' => '08:30:00', 'end' => '10:00:00'],
            ['start' => '10:15:00', 'end' => '11:45:00'],
            ['start' => '14:00:00', 'end' => '15:30:00'],
            ['start' => '15:45:00', 'end' => '17:15:00'],
        ];

        $generatedSchedules = [];

        foreach ($classes as $classe) {
            // Give each class a random subset of 5 subjects to study
            $classSubjects = $subjects->random(min(5, $subjects->count()));

            $availableSlots = [];
            foreach ($days as $day) {
                foreach ($timeSlots as $slot) {
                    $availableSlots[] = ['day' => $day, 'slot' => $slot];
                }
            }

            // Shuffle available slots for randomness
            shuffle($availableSlots);

            foreach ($classSubjects as $subject) {
                // Find a teacher who teaches this subject
                $teacher = tap($teachers->filter(function($t) use ($subject) {
                    return $t->subjects->contains($subject->id);
                })->random() ?? $teachers->random()); // Fallback to random teacher if none found

                if (!empty($availableSlots)) {
                    $assignedSlot = array_pop($availableSlots);

                    $schedule = Schedule::create([
                        'class_id' => $classe->id,
                        'subject_id' => $subject->id,
                        'teacher_id' => $teacher->id,
                        'day_of_week' => $assignedSlot['day'],
                        'start_time' => $assignedSlot['slot']['start'],
                        'end_time' => $assignedSlot['slot']['end'],
                    ]);

                    $generatedSchedules[] = $schedule;
                }
            }
        }

        return response()->json([
            'message' => 'Schedule successfully generated using AI-rules!',
            'count' => count($generatedSchedules)
        ], 201);
    }
}
