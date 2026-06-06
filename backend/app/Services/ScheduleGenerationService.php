<?php

namespace App\Services;

use App\Models\Classe;
use App\Models\Subject;
use App\Models\Room;
use App\Models\TimeSlot;
use App\Models\Teacher;
use App\Models\Schedule;
use App\Models\Semester;

class ScheduleGenerationService
{
    /**
     * Generate weekly schedules for a specific semester
     *
     * @param int $semesterId
     * @return array
     */
    public function generate(int $semesterId): array
    {
        $semester = Semester::findOrFail($semesterId);

        // 1. Clear existing schedules for this semester
        Schedule::where('semester_id', $semester->id)->delete();

        // 2. Fetch all required entities
        // Only generate for classes in the current academic year
        $currentAcademicYear = date('Y') . '-' . (date('Y') + 1);
        $classes = Classe::with('groups')
            ->where('academic_year', $currentAcademicYear)
            ->get();
        
        // If no classes found for computed year, try fetching all classes (fallback)
        if ($classes->isEmpty()) {
            $classes = Classe::with('groups')->get();
        }
        $subjects = Subject::all();
        $rooms = Room::all();
        $timeSlots = TimeSlot::orderBy('start_time')->get();
        $teachers = Teacher::with(['subjects', 'classes', 'availabilities'])->get();
        
        $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // 3. Build the tasks list
        $tasks = [];
        $unassigned = [];

        foreach ($classes as $class) {
            foreach ($subjects as $subject) {
                // Find teacher assigned to both this class and this subject
                $teacher = $teachers->first(function($t) use ($class, $subject) {
                    return $t->classes->contains('id', $class->id) && $t->subjects->contains('id', $subject->id);
                });

                // Fallback: any teacher that teaches this subject
                if (!$teacher) {
                    $teacher = $teachers->first(function($t) use ($subject) {
                        return $t->subjects->contains('id', $subject->id);
                    });
                }

                if (!$teacher) {
                    // Cannot schedule without teacher
                    if ($subject->hours_cours > 0 || $subject->hours_td > 0 || $subject->hours_tp > 0) {
                        $unassigned[] = [
                            'class' => $class->name,
                            'subject' => $subject->name,
                            'type' => 'Tous',
                            'group' => null,
                            'reason' => 'Aucun enseignant assigné à cette matière'
                        ];
                    }
                    continue;
                }

                // Add Cours tasks
                $coursSessions = (int) round($subject->hours_cours / 1.5);
                for ($i = 0; $i < $coursSessions; $i++) {
                    $tasks[] = [
                        'class' => $class,
                        'subject' => $subject,
                        'teacher' => $teacher,
                        'type' => 'Cours',
                        'group' => null
                    ];
                }

                // Add TD tasks (scheduled by group if groups exist)
                $tdSessions = (int) round($subject->hours_td / 1.5);
                for ($i = 0; $i < $tdSessions; $i++) {
                    if ($class->groups->count() > 0) {
                        foreach ($class->groups as $group) {
                            $tasks[] = [
                                'class' => $class,
                                'subject' => $subject,
                                'teacher' => $teacher,
                                'type' => 'TD',
                                'group' => $group
                            ];
                        }
                    } else {
                        $tasks[] = [
                            'class' => $class,
                            'subject' => $subject,
                            'teacher' => $teacher,
                            'type' => 'TD',
                            'group' => null
                        ];
                    }
                }

                // Add TP tasks (always scheduled by group if groups exist)
                $tpSessions = (int) round($subject->hours_tp / 1.5);
                for ($i = 0; $i < $tpSessions; $i++) {
                    if ($class->groups->count() > 0) {
                        foreach ($class->groups as $group) {
                            $tasks[] = [
                                'class' => $class,
                                'subject' => $subject,
                                'teacher' => $teacher,
                                'type' => 'TP',
                                'group' => $group
                            ];
                        }
                    } else {
                        $tasks[] = [
                            'class' => $class,
                            'subject' => $subject,
                            'teacher' => $teacher,
                            'type' => 'TP',
                            'group' => null
                        ];
                    }
                }
            }
        }

        // 4. Sort tasks: TPs first, then TDs, then Cours (TP is most constrained on labs)
        usort($tasks, function($a, $b) {
            $typesOrder = ['TP' => 3, 'TD' => 2, 'Cours' => 1];
            return $typesOrder[$b['type']] <=> $typesOrder[$a['type']];
        });

        // 5. In-memory scheduling registers to prevent database query overhead
        $busyTeachers = [];    // "$teacherId:$day:$timeSlotId" => true
        $busyClasses = [];     // "$classId:$day:$timeSlotId" => true (for whole class busy)
        $busyGroups = [];      // "$groupId:$day:$timeSlotId" => true
        $busyRooms = [];       // "$roomId:$day:$timeSlotId" => true
        $teacherHours = [];    // $teacherId => total hours (1 session = 1.5h)
        $classSubjectDays = []; // "$classId:$subjectId:$day" => count
        $classDayCounts = [];  // "$classId:$day" => count

        $generatedCount = 0;

        // 6. Schedule each task
        foreach ($tasks as $task) {
            $class = $task['class'];
            $subject = $task['subject'];
            $teacher = $task['teacher'];
            $type = $task['type'];
            $group = $task['group'];

            $bestSlot = null;
            $bestScore = INF;

            // Iterate over all possible slots to find the best match
            foreach ($days as $day) {
                foreach ($timeSlots as $slot) {
                    // Check teacher availability
                    $avail = $teacher->availabilities->first(function($a) use ($day, $slot) {
                        return $a->day_of_week === $day && $a->time_slot_id === $slot->id;
                    });
                    if ($avail && !$avail->is_available) {
                        continue; // Teacher not available
                    }

                    // Check if teacher is busy
                    if (isset($busyTeachers["{$teacher->id}:$day:{$slot->id}"])) {
                        continue;
                    }

                    // Check teacher max hours
                    if (($teacherHours[$teacher->id] ?? 0) + 1.5 > $teacher->hourly_volume) {
                        continue;
                    }

                    // Check if class is busy with whole class session
                    if (isset($busyClasses["{$class->id}:$day:{$slot->id}"])) {
                        continue;
                    }

                    // Check group constraints
                    if ($group) {
                        if (isset($busyGroups["{$group->id}:$day:{$slot->id}"])) {
                            continue;
                        }
                    } else {
                        // Whole class session: none of the class groups can be busy
                        $groupBusy = false;
                        foreach ($class->groups as $g) {
                            if (isset($busyGroups["{$g->id}:$day:{$slot->id}"])) {
                                $groupBusy = true;
                                break;
                            }
                        }
                        if ($groupBusy) {
                            continue;
                        }
                    }

                    // Filter rooms matching the session type
                    $matchingRooms = $rooms->filter(function($r) use ($type) {
                        if ($type === 'TP') {
                            return $r->type === 'TP';
                        }
                        if ($type === 'TD') {
                            return $r->type === 'TD' || $r->type === 'Cours';
                        }
                        return $r->type === 'Cours';
                    });

                    // If no matching rooms, fallback to any available room
                    if ($matchingRooms->isEmpty()) {
                        $matchingRooms = $rooms;
                    }

                    foreach ($matchingRooms as $room) {
                        // Check if room is busy
                        if (isset($busyRooms["{$room->id}:$day:{$slot->id}"])) {
                            continue;
                        }

                        // Calculate penalty score (lower is better)
                        $score = 0;

                        // Penalty for scheduling same subject multiple times on same day
                        if (isset($classSubjectDays["{$class->id}:{$subject->id}:$day"])) {
                            $score += 100;
                        }

                        // Penalty to balance class days
                        $score += ($classDayCounts["{$class->id}:$day"] ?? 0) * 10;

                        // Choose the candidate with the lowest penalty
                        if ($score < $bestScore) {
                            $bestScore = $score;
                            $bestSlot = [
                                'day' => $day,
                                'slot_id' => $slot->id,
                                'room_id' => $room->id
                            ];
                        }
                    }
                }
            }

            if ($bestSlot) {
                // Save schedule entry
                Schedule::create([
                    'class_id' => $class->id,
                    'group_id' => $group ? $group->id : null,
                    'subject_id' => $subject->id,
                    'teacher_id' => $teacher->id,
                    'room_id' => $bestSlot['room_id'],
                    'semester_id' => $semester->id,
                    'time_slot_id' => $bestSlot['slot_id'],
                    'day_of_week' => $bestSlot['day'],
                    'type' => $type,
                    'frequency' => 'weekly'
                ]);

                // Record allocations in memory
                $day = $bestSlot['day'];
                $slotId = $bestSlot['slot_id'];
                $roomId = $bestSlot['room_id'];

                $busyRooms["$roomId:$day:$slotId"] = true;
                $busyTeachers["{$teacher->id}:$day:$slotId"] = true;

                if ($group) {
                    $busyGroups["{$group->id}:$day:$slotId"] = true;
                } else {
                    $busyClasses["{$class->id}:$day:$slotId"] = true;
                    foreach ($class->groups as $g) {
                        $busyGroups["{$g->id}:$day:$slotId"] = true;
                    }
                }

                $teacherHours[$teacher->id] = ($teacherHours[$teacher->id] ?? 0) + 1.5;
                $classSubjectDays["{$class->id}:{$subject->id}:$day"] = ($classSubjectDays["{$class->id}:{$subject->id}:$day"] ?? 0) + 1;
                $classDayCounts["{$class->id}:$day"] = ($classDayCounts["{$class->id}:$day"] ?? 0) + 1;

                $generatedCount++;
            } else {
                $unassigned[] = [
                    'class' => $class->name,
                    'subject' => $subject->name,
                    'type' => $type,
                    'group' => $group ? $group->name : null,
                    'reason' => 'Pas de créneau horaire ou de salle libre respectant les contraintes'
                ];
            }
        }

        return [
            'success' => true,
            'semester' => $semester->name,
            'generated_count' => $generatedCount,
            'unassigned_count' => count($unassigned),
            'unassigned_sessions' => $unassigned
        ];
    }
}
