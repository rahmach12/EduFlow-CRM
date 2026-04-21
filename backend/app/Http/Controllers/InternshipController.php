<?php

namespace App\Http\Controllers;

use App\Models\Internship;
use App\Models\Student;
use App\Services\UniversityNotificationService;
use Illuminate\Http\Request;

class InternshipController extends Controller
{
    public function __construct(private UniversityNotificationService $notifications)
    {
    }

    public function index(Request $request)
    {
        $query = Internship::with([
            'student.user',
            'student.classe.faculty',
            'student.classe.filiere',
            'student.classe.academicLevel',
            'approvedBy',
            'defenseFiliere',
        ]);

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->filled('filiere_id')) {
            $query->whereHas('student.classe', fn ($classeQuery) => $classeQuery->where('filiere_id', $request->integer('filiere_id')));
        }

        if ($request->filled('academic_level_id')) {
            $query->whereHas('student.classe', fn ($classeQuery) => $classeQuery->where('academic_level_id', $request->integer('academic_level_id')));
        }

        if ($request->filled('class_id')) {
            $query->whereHas('student', fn ($studentQuery) => $studentQuery->where('class_id', $request->integer('class_id')));
        }

        return response()->json($query->orderByDesc('created_at')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'type' => 'nullable|string',
            'title' => 'nullable|string',
            'company_name' => 'required|string',
            'supervisor_name' => 'nullable|string',
            'supervisor_email' => 'nullable|email',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $student = Student::with('classe.academicLevel')->findOrFail($validated['student_id']);
        $validated['type'] = $validated['type'] ?: $this->determineInternshipType($student);

        $internship = Internship::create($validated);

        return response()->json([
            'message' => 'Internship request submitted successfully',
            'data' => $internship->load('student.user', 'student.classe.academicLevel')
        ], 201);
    }

    public function update(Request $request, Internship $internship)
    {
        $validated = $request->validate([
            'type' => 'sometimes|string',
            'title' => 'nullable|string',
            'company_name' => 'sometimes|string',
            'supervisor_name' => 'nullable|string',
            'supervisor_email' => 'nullable|email',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date|after_or_equal:start_date',
            'status' => 'sometimes|in:Pending,Approved,Rejected',
            'rejection_reason' => 'nullable|string',
            'defense_date' => 'nullable|date',
            'defense_jury' => 'nullable|string',
            'defense_room' => 'nullable|string',
            'defense_filiere_id' => 'nullable|exists:filieres,id',
        ]);

        $internship->update($validated);

        return response()->json([
            'message' => 'Internship updated successfully',
            'data' => $internship->load('student.user', 'student.classe.filiere', 'student.classe.academicLevel')
        ]);
    }

    public function updateStatus(Request $request, Internship $internship)
    {
        $validated = $request->validate([
            'status' => 'required|in:Pending,Approved,Rejected',
            'rejection_reason' => 'nullable|required_if:status,Rejected|string',
        ]);

        $internship->update([
            'status' => $validated['status'],
            'rejection_reason' => $validated['status'] === 'Rejected' ? ($validated['rejection_reason'] ?? null) : null,
            'approved_by_user_id' => auth()->guard('api')->id(),
            'reviewed_at' => now(),
        ]);

        $studentUser = $internship->load('student.user')->student?->user;
        if ($studentUser) {
            $this->notifications->notifyUser(
                $studentUser,
                'Mise a jour du stage',
                $validated['status'] === 'Approved'
                    ? 'Votre stage a ete approuve.'
                    : 'Votre demande de stage a ete rejetee. Motif: ' . $validated['rejection_reason'],
                $validated['status'] === 'Approved' ? 'internship_approved' : 'internship_rejected',
                ['internship_id' => $internship->id]
            );
        }

        return response()->json([
            'message' => 'Internship status updated successfully',
            'data' => $internship->fresh()->load('student.user', 'student.classe.filiere', 'student.classe.academicLevel')
        ]);
    }

    public function scheduleDefense(Request $request, Internship $internship)
    {
        $validated = $request->validate([
            'defense_date' => 'required|date',
            'defense_jury' => 'required|string',
            'defense_room' => 'required|string',
            'defense_filiere_id' => 'nullable|exists:filieres,id',
        ]);

        $internship->update($validated);

        $studentUser = $internship->load('student.user')->student?->user;
        if ($studentUser) {
            $this->notifications->notifyUser(
                $studentUser,
                'Soutenance planifiee',
                sprintf('Votre soutenance est prevue le %s en salle %s.', $validated['defense_date'], $validated['defense_room']),
                'defense_scheduled',
                ['internship_id' => $internship->id]
            );
        }

        return response()->json([
            'message' => 'Defense scheduled successfully',
            'data' => $internship->fresh()->load('student.user', 'defenseFiliere')
        ]);
    }

    public function uploadReport(Request $request, Internship $internship)
    {
        $request->validate([
            'report' => 'required|file|mimes:pdf|max:10240',
        ]);

        if ($request->hasFile('report')) {
            $path = $request->file('report')->store('internship_reports', 'public');
            $internship->update(['report_file' => $path]);

            return response()->json([
                'message' => 'Report uploaded successfully',
                'path' => $path
            ]);
        }

        return response()->json(['message' => 'Failed to upload report'], 400);
    }

    public function destroy(Internship $internship)
    {
        $internship->delete();
        return response()->json(['message' => 'Internship deleted successfully']);
    }

    private function determineInternshipType(Student $student): string
    {
        return match ($student->classe?->academicLevel?->slug) {
            'licence-1', 'cycle-1', 'master-1' => 'Stage obligatoire',
            'licence-2', 'cycle-2' => 'PFA',
            'licence-3', 'cycle-3', 'master-2' => 'PFE',
            default => 'Stage d\'ete',
        };
    }
}
