<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Classe;

class ClassController extends Controller
{
    public function index()
    {
        return response()->json(Classe::withCount('students')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'          => 'required|string',
            'level'         => 'nullable|string',
            'academic_year' => 'nullable|string',
        ]);

        $classe = Classe::create($request->only(['name', 'level', 'academic_year']));

        return response()->json($classe, 201);
    }

    public function show(Classe $class)
    {
        return response()->json($class->load('students.user'));
    }

    public function update(Request $request, Classe $class)
    {
        $request->validate([
            'name'          => 'sometimes|string',
            'level'         => 'nullable|string',
            'academic_year' => 'nullable|string',
        ]);

        $class->update($request->only(['name', 'level', 'academic_year']));

        return response()->json($class);
    }

    public function destroy(Classe $class)
    {
        // Nullify or reject? cascade handled by db usually or we can check
        $class->delete();
        return response()->json(['message' => 'Class deleted successfully']);
    }
}
