<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Semester;

class SemesterController extends Controller
{
    public function index()
    {
        return response()->json(Semester::all());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'is_active' => 'required|boolean'
        ]);

        if ($data['is_active']) {
            Semester::where('is_active', true)->update(['is_active' => false]);
        }

        $semester = Semester::create($data);
        return response()->json($semester, 201);
    }

    public function show($id)
    {
        return response()->json(Semester::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $semester = Semester::findOrFail($id);
        $data = $request->validate([
            'name' => 'required|string',
            'is_active' => 'required|boolean'
        ]);

        if ($data['is_active']) {
            Semester::where('id', '!=', $id)->where('is_active', true)->update(['is_active' => false]);
        }

        $semester->update($data);
        return response()->json($semester);
    }

    public function destroy($id)
    {
        $semester = Semester::findOrFail($id);
        $semester->delete();
        return response()->json(['message' => 'Semestre supprimé avec succès.']);
    }
}
