<?php

namespace App\Http\Controllers;

use App\Models\Filiere;
use Illuminate\Http\Request;

class FiliereController extends Controller
{
    public function index(Request $request)
    {
        $query = Filiere::with(['classes.academicLevel'])
            ->withCount('classes')
            ->orderBy('name');

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'code' => 'nullable|string',
        ]);

        return response()->json(Filiere::create($validated), 201);
    }

    public function show(Filiere $filiere)
    {
        return response()->json($filiere->load(['classes.academicLevel.students.user']));
    }

    public function update(Request $request, Filiere $filiere)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string',
            'code' => 'nullable|string',
        ]);

        $filiere->update($validated);

        return response()->json($filiere);
    }

    public function destroy(Filiere $filiere)
    {
        $filiere->delete();

        return response()->json(['message' => 'Filiere deleted successfully']);
    }
}
