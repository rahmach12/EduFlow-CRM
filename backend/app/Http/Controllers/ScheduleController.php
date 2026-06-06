<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Schedule;
use App\Models\Classe;
use App\Models\Group;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\Room;
use App\Models\Semester;
use App\Models\TimeSlot;
use App\Models\TeacherAvailability;
use App\Services\ScheduleGenerationService;

class ScheduleController extends Controller
{
    /**
     * Display a listing of schedules with filters
     */
    public function index(Request $request)
    {
        $user = auth()->guard('api')->user();
        $query = Schedule::with([
            'classe',
            'group',
            'subject',
            'teacher.user',
            'room',
            'timeSlot',
            'semester'
        ]);

        // Role-based filtering
        if ($user && $user->role) {
            if ($user->role->name === 'Teacher') {
                $teacher = $user->teacher;
                if ($teacher) {
                    $query->where('teacher_id', $teacher->id);
                } else {
                    return response()->json([]);
                }
            } elseif ($user->role->name === 'Student') {
                $student = $user->student;
                if ($student && $student->class_id) {
                    $query->where('class_id', $student->class_id);
                } else {
                    return response()->json([]);
                }
            }
        }

        // Apply manual filters from request
        if ($request->has('class_id') && $request->class_id) {
            $query->where('class_id', $request->class_id);
        }
        if ($request->has('teacher_id') && $request->teacher_id) {
            $query->where('teacher_id', $request->teacher_id);
        }
        if ($request->has('room_id') && $request->room_id) {
            $query->where('room_id', $request->room_id);
        }
        if ($request->has('semester_id') && $request->semester_id) {
            $query->where('semester_id', $request->semester_id);
        } else {
            // Default to active semester if available
            $activeSem = Semester::where('is_active', true)->first();
            if ($activeSem) {
                $query->where('semester_id', $activeSem->id);
            }
        }

        return response()->json($query->get());
    }

    /**
     * Automatic generation endpoint
     */
    public function generate(Request $request, ScheduleGenerationService $generator)
    {
        $request->validate([
            'semester_id' => 'required|exists:semesters,id'
        ]);

        $result = $generator->generate($request->semester_id);

        return response()->json($result, 200);
    }

    /**
     * Save a manual schedule entry with conflict detection
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'class_id' => 'required|exists:classes,id',
            'group_id' => 'nullable|exists:groups,id',
            'subject_id' => 'required|exists:subjects,id',
            'teacher_id' => 'required|exists:teachers,id',
            'room_id' => 'required|exists:rooms,id',
            'semester_id' => 'required|exists:semesters,id',
            'time_slot_id' => 'required|exists:time_slots,id',
            'day_of_week' => 'required|string',
            'type' => 'required|in:Cours,TP,TD',
            'frequency' => 'required|in:weekly,biweekly'
        ]);

        $conflicts = $this->detectConflicts($data);

        if (!empty($conflicts)) {
            return response()->json([
                'message' => 'Des conflits ont été détectés.',
                'errors' => $conflicts
            ], 422);
        }

        $schedule = Schedule::create($data);

        return response()->json([
            'message' => 'Séance ajoutée avec succès.',
            'schedule' => $schedule->load(['classe', 'group', 'subject', 'teacher.user', 'room', 'timeSlot'])
        ], 210);
    }

    /**
     * Update a manual schedule entry with conflict detection
     */
    public function update(Request $request, $id)
    {
        $schedule = Schedule::findOrFail($id);

        $data = $request->validate([
            'class_id' => 'required|exists:classes,id',
            'group_id' => 'nullable|exists:groups,id',
            'subject_id' => 'required|exists:subjects,id',
            'teacher_id' => 'required|exists:teachers,id',
            'room_id' => 'required|exists:rooms,id',
            'semester_id' => 'required|exists:semesters,id',
            'time_slot_id' => 'required|exists:time_slots,id',
            'day_of_week' => 'required|string',
            'type' => 'required|in:Cours,TP,TD',
            'frequency' => 'required|in:weekly,biweekly'
        ]);

        $conflicts = $this->detectConflicts($data, $id);

        if (!empty($conflicts)) {
            return response()->json([
                'message' => 'Des conflits ont été détectés.',
                'errors' => $conflicts
            ], 422);
        }

        $schedule->update($data);

        return response()->json([
            'message' => 'Séance modifiée avec succès.',
            'schedule' => $schedule->load(['classe', 'group', 'subject', 'teacher.user', 'room', 'timeSlot'])
        ]);
    }

    /**
     * Delete a schedule entry
     */
    public function destroy($id)
    {
        $schedule = Schedule::findOrFail($id);
        $schedule->delete();

        return response()->json(['message' => 'Séance supprimée avec succès.']);
    }

    /**
     * Load metadata options for forms and filters
     */
    public function options()
    {
        return response()->json([
            'classes' => Classe::with('groups')->get(),
            'subjects' => Subject::all(),
            'teachers' => Teacher::with('user')->get(),
            'rooms' => Room::all(),
            'semesters' => Semester::all(),
            'time_slots' => TimeSlot::orderBy('start_time')->get()
        ]);
    }

    /**
     * Retrieve availability for a specific teacher
     */
    public function getAvailabilities($teacherId)
    {
        $availabilities = TeacherAvailability::where('teacher_id', $teacherId)->get();
        return response()->json($availabilities);
    }

    /**
     * Update availabilities for a teacher
     */
    public function updateAvailabilities(Request $request, $teacherId)
    {
        $request->validate([
            'availabilities' => 'required|array',
            'availabilities.*.day_of_week' => 'required|string',
            'availabilities.*.time_slot_id' => 'required|exists:time_slots,id',
            'availabilities.*.is_available' => 'required|boolean'
        ]);

        foreach ($request->availabilities as $avail) {
            TeacherAvailability::updateOrCreate([
                'teacher_id' => $teacherId,
                'day_of_week' => $avail['day_of_week'],
                'time_slot_id' => $avail['time_slot_id']
            ], [
                'is_available' => $avail['is_available']
            ]);
        }

        return response()->json(['message' => 'Disponibilités mises à jour avec succès.']);
    }

    /**
     * Helper to detect conflicts for a schedule slot
     */
    private function detectConflicts(array $data, $excludeId = null): array
    {
        $conflicts = [];

        $classId = $data['class_id'];
        $groupId = $data['group_id'] ?? null;
        $teacherId = $data['teacher_id'];
        $roomId = $data['room_id'];
        $semesterId = $data['semester_id'];
        $timeSlotId = $data['time_slot_id'];
        $dayOfWeek = $data['day_of_week'];

        // 1. Room occuped conflict
        $roomOccupiedQuery = Schedule::where('semester_id', $semesterId)
            ->where('room_id', $roomId)
            ->where('day_of_week', $dayOfWeek)
            ->where('time_slot_id', $timeSlotId);
        if ($excludeId) {
            $roomOccupiedQuery->where('id', '!=', $excludeId);
        }
        $existingRoom = $roomOccupiedQuery->first();
        if ($existingRoom) {
            $roomName = Room::find($roomId)->name ?? 'inconnue';
            $conflicts[] = "La salle '{$roomName}' est déjà occupée à ce créneau.";
        }

        // 2. Teacher busy conflict
        $teacherBusyQuery = Schedule::where('semester_id', $semesterId)
            ->where('teacher_id', $teacherId)
            ->where('day_of_week', $dayOfWeek)
            ->where('time_slot_id', $timeSlotId);
        if ($excludeId) {
            $teacherBusyQuery->where('id', '!=', $excludeId);
        }
        $existingTeacher = $teacherBusyQuery->first();
        if ($existingTeacher) {
            $teacherName = Teacher::find($teacherId)->user->last_name ?? 'enseignant';
            $conflicts[] = "L'enseignant Prof. '{$teacherName}' est déjà affecté à une autre classe à ce créneau.";
        }

        // 3. Teacher availability constraint
        $avail = TeacherAvailability::where('teacher_id', $teacherId)
            ->where('day_of_week', $dayOfWeek)
            ->where('time_slot_id', $timeSlotId)
            ->first();
        if ($avail && !$avail->is_available) {
            $conflicts[] = "L'enseignant n'est pas disponible sur ce créneau d'après ses préférences.";
        }

        // 4. Class / Group busy conflict
        $classBusyQuery = Schedule::where('semester_id', $semesterId)
            ->where('day_of_week', $dayOfWeek)
            ->where('time_slot_id', $timeSlotId);
        if ($excludeId) {
            $classBusyQuery->where('id', '!=', $excludeId);
        }

        if ($groupId) {
            // Group specific check: check if the group is scheduled, OR if the whole class has a general session (group_id = null)
            $classBusyQuery->where(function($q) use ($classId, $groupId) {
                $q->where('group_id', $groupId)
                  ->orWhere(function($sq) use ($classId) {
                      $sq->where('class_id', $classId)->whereNull('group_id');
                  });
            });
            $existingClass = $classBusyQuery->first();
            if ($existingClass) {
                $conflicts[] = "Ce groupe est déjà occupé à ce créneau.";
            }
        } else {
            // Whole class session: check if any session exists for this class
            $classBusyQuery->where('class_id', $classId);
            $existingClass = $classBusyQuery->first();
            if ($existingClass) {
                $conflicts[] = "La classe a déjà un cours ou un TP/TD programmé à ce créneau.";
            }
        }

        return $conflicts;
    }
}
