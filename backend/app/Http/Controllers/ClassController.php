<?php

namespace App\Http\Controllers;

use App\Models\AcademicLevel;
use App\Models\Classe;
use Illuminate\Http\Request;

class ClassController extends Controller
{
    public function index(Request $request)
    {
        $query = Classe::with(['faculty', 'filiere', 'academicLevel'])->withCount('students');

        if ($request->filled('faculty_id')) {
            $query->where('faculty_id', $request->integer('faculty_id'));
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
            'faculty_id' => 'nullable|exists:faculties,id',
            'filiere_id' => 'nullable|exists:filieres,id',
            'academic_level_id' => 'nullable|exists:academic_levels,id',
        ]);

        $payload = $request->only([
            'name',
            'code',
            'level',
            'academic_year',
            'faculty_id',
            'filiere_id',
            'academic_level_id',
        ]);

        if (! ($payload['level'] ?? null) && ! empty($payload['academic_level_id'])) {
            $payload['level'] = AcademicLevel::find($payload['academic_level_id'])?->name;
        }

        $classe = Classe::create($payload);

        return response()->json($classe->load(['faculty', 'filiere', 'academicLevel']), 201);
    }

    public function show(Classe $class)
    {
        return response()->json($class->load(['faculty', 'filiere', 'academicLevel', 'students.user']));
    }

    public function update(Request $request, Classe $class)
    {
        $request->validate([
            'name' => 'sometimes|string',
            'code' => 'nullable|string',
            'level' => 'nullable|string',
            'academic_year' => 'nullable|string',
            'faculty_id' => 'nullable|exists:faculties,id',
            'filiere_id' => 'nullable|exists:filieres,id',
            'academic_level_id' => 'nullable|exists:academic_levels,id',
        ]);

        $payload = $request->only([
            'name',
            'code',
            'level',
            'academic_year',
            'faculty_id',
            'filiere_id',
            'academic_level_id',
        ]);

        if (array_key_exists('academic_level_id', $payload) && ! ($payload['level'] ?? null)) {
            $payload['level'] = AcademicLevel::find($payload['academic_level_id'])?->name;
        }

        $class->update($payload);

        return response()->json($class->load(['faculty', 'filiere', 'academicLevel']));
    }

    public function destroy(Classe $class)
    {
        $class->delete();
        return response()->json(['message' => 'Class deleted successfully']);
    }
}
