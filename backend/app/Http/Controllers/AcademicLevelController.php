<?php

namespace App\Http\Controllers;

use App\Models\AcademicLevel;
use Illuminate\Http\Request;

class AcademicLevelController extends Controller
{
    public function index()
    {
        return response()->json(
            AcademicLevel::withCount('classes')
                ->orderBy('rank')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'cycle' => 'required|string',
            'name' => 'required|string',
            'slug' => 'required|string|unique:academic_levels,slug',
            'rank' => 'nullable|integer|min:0',
        ]);

        return response()->json(AcademicLevel::create($validated), 201);
    }

    public function show(AcademicLevel $academicLevel)
    {
        return response()->json($academicLevel->load('classes.filiere'));
    }

    public function update(Request $request, AcademicLevel $academicLevel)
    {
        $validated = $request->validate([
            'cycle' => 'sometimes|string',
            'name' => 'sometimes|string',
            'slug' => 'sometimes|string|unique:academic_levels,slug,' . $academicLevel->id,
            'rank' => 'nullable|integer|min:0',
        ]);

        $academicLevel->update($validated);

        return response()->json($academicLevel);
    }

    public function destroy(AcademicLevel $academicLevel)
    {
        $academicLevel->delete();

        return response()->json(['message' => 'Academic level deleted successfully']);
    }
}
