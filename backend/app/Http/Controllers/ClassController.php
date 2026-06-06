<?php

namespace App\Http\Controllers;

use App\Models\AcademicLevel;
use App\Models\Classe;
use Illuminate\Http\Request;

class ClassController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Classe::with(['filiere', 'academicLevel'])->withCount('students');

        if ($user && $user->role && $user->role->name === 'Teacher') {
            $teacher = $user->teacher;
            if ($teacher) {
                $query->whereHas('teachers', function($q) use ($teacher) {
                    $q->where('teachers.id', $teacher->id);
                });
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        if ($request->filled('filiere_id')) {
            $query->where('filiere_id', $request->integer('filiere_id'));
        }

        if ($request->filled('academic_level_id')) {
            $query->where('academic_level_id', $request->integer('academic_level_id'));
        }

        return response()->json($query->orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'code' => 'nullable|string',
            'level' => 'nullable|string',
            'academic_year' => 'nullable|string',
            'filiere_id' => 'nullable|exists:filieres,id',
            'academic_level_id' => 'nullable|exists:academic_levels,id',
        ]);

        $payload = $request->only([
            'name',
            'code',
            'level',
            'academic_year',
            'filiere_id',
            'academic_level_id',
        ]);

        if (! ($payload['level'] ?? null) && ! empty($payload['academic_level_id'])) {
            $payload['level'] = AcademicLevel::find($payload['academic_level_id'])?->name;
        }

        $classe = Classe::create($payload);

        return response()->json($classe->load(['filiere', 'academicLevel']), 201);
    }

    public function show(Classe $class)
    {
        $user = request()->user();
        if ($user && $user->role && $user->role->name === 'Teacher') {
            $teacher = $user->teacher;
            if (!$teacher || !$class->teachers()->where('teachers.id', $teacher->id)->exists()) {
                abort(403, 'Unauthorized action.');
            }
        }
        return response()->json($class->load(['filiere', 'academicLevel', 'students.user']));
    }

    public function update(Request $request, Classe $class)
    {
        $request->validate([
            'name' => 'sometimes|string',
            'code' => 'nullable|string',
            'level' => 'nullable|string',
            'academic_year' => 'nullable|string',
            'filiere_id' => 'nullable|exists:filieres,id',
            'academic_level_id' => 'nullable|exists:academic_levels,id',
        ]);

        $payload = $request->only([
            'name',
            'code',
            'level',
            'academic_year',
            'filiere_id',
            'academic_level_id',
        ]);

        if (array_key_exists('academic_level_id', $payload) && ! ($payload['level'] ?? null)) {
            $payload['level'] = AcademicLevel::find($payload['academic_level_id'])?->name;
        }

        $class->update($payload);

        return response()->json($class->load(['filiere', 'academicLevel']));
    }

    public function destroy(Classe $class)
    {
        $class->delete();
        return response()->json(['message' => 'Class deleted successfully']);
    }
}
