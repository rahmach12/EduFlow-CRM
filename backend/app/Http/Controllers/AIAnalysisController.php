<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\OllamaService;
use App\Models\Student;

class AIAnalysisController extends Controller
{
    protected OllamaService $ollamaService;

    public function __construct(OllamaService $ollamaService)
    {
        $this->ollamaService = $ollamaService;
    }

    /**
     * Analyze a student using the AI module
     */
    public function analyze(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
        ]);

        $student = Student::with(['user', 'classe', 'notes.subject', 'attendances'])->find($request->student_id);

        if (!$student) {
            return response()->json(['error' => 'Student not found'], 404);
        }

        // Prepare data to send to AI
        $studentData = [
            'name' => $student->user->first_name . ' ' . $student->user->last_name,
            'class' => $student->classe ? $student->classe->name : 'Unknown',
            'notes' => $student->notes->map(function($n) {
                return [
                    'subject' => $n->subject->name,
                    'value' => $n->value
                ];
            }),
            'absences' => $student->attendances->where('status', 'Absent')->count()
        ];

        $analysisResult = $this->ollamaService->analyzeStudent($studentData);

        if (!$analysisResult) {
            return response()->json(['error' => 'Failed to analyze student data. Please ensure Ollama is running locally.'], 500);
        }

        return response()->json($analysisResult);
    }
}
