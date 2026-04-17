<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Announcement;
use App\Events\AnnouncementCreated;

class AnnouncementController extends Controller
{
    public function index()
    {
        return response()->json(Announcement::latest()->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string',
            'content' => 'required|string',
            'target_roles' => 'nullable|string',
            'date' => 'nullable|date'
        ]);

        $announcement = Announcement::create($request->all());

        event(new AnnouncementCreated($announcement));

        return response()->json($announcement, 201);
    }

    public function show(Announcement $announcement)
    {
        return response()->json($announcement);
    }

    public function update(Request $request, Announcement $announcement)
    {
        $request->validate([
            'title' => 'sometimes|string',
            'content' => 'sometimes|string',
        ]);

        $announcement->update($request->all());

        return response()->json($announcement);
    }

    public function destroy(Announcement $announcement)
    {
        $announcement->delete();
        return response()->json(['message' => 'Announcement deleted successfully']);
    }
}
