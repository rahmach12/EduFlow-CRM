<?php

namespace App\Http\Controllers;

use App\Models\Filiere;
use Illuminate\Http\Request;

class FiliereController extends Controller
{
    public function index(Request $request)
    {
        $query = Filiere::with(['faculty', 'classes.academicLevel'])
            ->withCount('classes')
            ->orderBy('name');

        if ($request->filled('faculty_id')) {
            $query->where('faculty_id', $request->integer('faculty_id'));
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'faculty_id' => 'required|exists:faculties,id',
            'name' => 'required|string',
            'code' => 'nullable|string',
        ]);

        return response()->json(Filiere::create($validated)->load('faculty'), 201);
    }

    public function show(Filiere $filiere)
    {
        return response()->json($filiere->load(['faculty', 'classes.academicLevel.students.user']));
    }

    public function update(Request $request, Filiere $filiere)
    {
        $validated = $request->validate([
            'faculty_id' => 'sometimes|exists:faculties,id',
            'name' => 'sometimes|string',
            'code' => 'nullable|string',
        ]);

        $filiere->update($validated);

        return response()->json($filiere->load('faculty'));
    }

    public function destroy(Filiere $filiere)
    {
        $filiere->delete();

        return response()->json(['message' => 'Filiere deleted successfully']);
    }
}
