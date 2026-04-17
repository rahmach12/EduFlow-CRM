<?php

namespace App\Http\Controllers;

use App\Models\Internship;
use Illuminate\Http\Request;

class InternshipController extends Controller
{
    public function index(Request $request)
    {
        $query = Internship::with('student.user');
        
        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'type' => 'required|in:PFE,PFA,Summer',
            'company_name' => 'required|string',
            'supervisor_name' => 'nullable|string',
            'supervisor_email' => 'nullable|email',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $internship = Internship::create($validated);

        return response()->json([
            'message' => 'Internship request submitted successfully',
            'data' => $internship->load('student.user')
        ], 201);
    }

    public function update(Request $request, Internship $internship)
    {
        $validated = $request->validate([
            'type' => 'sometimes|in:PFE,PFA,Summer',
            'company_name' => 'sometimes|string',
            'supervisor_name' => 'nullable|string',
            'supervisor_email' => 'nullable|email',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date|after_or_equal:start_date',
            'status' => 'sometimes|in:Pending,Approved,Rejected',
            'defense_date' => 'nullable|date',
        ]);

        $internship->update($validated);

        return response()->json([
            'message' => 'Internship updated successfully',
            'data' => $internship->load('student.user')
        ]);
    }

    public function updateStatus(Request $request, Internship $internship)
    {
        $validated = $request->validate([
            'status' => 'required|in:Pending,Approved,Rejected',
        ]);

        $internship->update($validated);

        return response()->json([
            'message' => 'Internship status updated successfully',
            'data' => $internship->load('student.user')
        ]);
    }

    public function uploadReport(Request $request, Internship $internship)
    {
        $request->validate([
            'report' => 'required|file|mimes:pdf|max:10240', // max 10MB PDF
        ]);

        if ($request->hasFile('report')) {
            $path = $request->file('report')->store('internship_reports', 'public');
            $internship->update(['report_file' => $path]);
            
            return response()->json([
                'message' => 'Report uploaded successfully',
                'path' => $path
            ]);
        }

        return response()->json(['message' => 'Failed to upload report'], 400);
    }

    public function destroy(Internship $internship)
    {
        $internship->delete();
        return response()->json(['message' => 'Internship deleted successfully']);
    }
}
