<?php

namespace App\Http\Controllers;

use App\Models\Faculty;
use Illuminate\Http\Request;

class FacultyController extends Controller
{
    public function index()
    {
        return response()->json(
            Faculty::with(['filieres.classes.academicLevel'])
                ->withCount('filieres')
                ->orderBy('name')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:faculties,name',
            'code' => 'nullable|string|unique:faculties,code',
        ]);

        return response()->json(Faculty::create($validated), 201);
    }

    public function show(Faculty $faculty)
    {
        return response()->json(
            $faculty->load(['filieres.classes.academicLevel'])
        );
    }

    public function update(Request $request, Faculty $faculty)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|unique:faculties,name,' . $faculty->id,
            'code' => 'nullable|string|unique:faculties,code,' . $faculty->id,
        ]);

        $faculty->update($validated);

        return response()->json($faculty);
    }

    public function destroy(Faculty $faculty)
    {
        $faculty->delete();

        return response()->json(['message' => 'Faculty deleted successfully']);
    }
}
