<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Subject;

class SubjectController extends Controller
{
    public function index()
    {
        return response()->json(Subject::all());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'coefficient' => 'required|integer|min:1'
        ]);

        $subject = Subject::create($request->all());

        if ($request->has('teacher_ids')) {
            $subject->teachers()->sync($request->teacher_ids);
        }

        return response()->json($subject->load('teachers'), 201);
    }

    public function show(Subject $subject)
    {
        return response()->json($subject->load('teachers'));
    }

    public function update(Request $request, Subject $subject)
    {
        $request->validate([
            'name' => 'sometimes|string',
            'coefficient' => 'sometimes|integer|min:1'
        ]);

        $subject->update($request->only('name', 'coefficient'));

        if ($request->has('teacher_ids')) {
            $subject->teachers()->sync($request->teacher_ids);
        }

        return response()->json($subject->load('teachers'));
    }

    public function destroy(Subject $subject)
    {
        $subject->delete();
        return response()->json(['message' => 'Subject deleted successfully']);
    }
}
