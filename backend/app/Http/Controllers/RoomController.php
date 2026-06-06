<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Room;

class RoomController extends Controller
{
    public function index()
    {
        return response()->json(Room::all());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'code' => 'required|string|unique:rooms,code',
            'type' => 'required|in:Cours,TP,TD',
            'capacity' => 'required|integer|min:1'
        ]);

        $room = Room::create($data);
        return response()->json($room, 201);
    }

    public function show($id)
    {
        return response()->json(Room::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $room = Room::findOrFail($id);
        $data = $request->validate([
            'name' => 'required|string',
            'code' => 'required|string|unique:rooms,code,' . $id,
            'type' => 'required|in:Cours,TP,TD',
            'capacity' => 'required|integer|min:1'
        ]);

        $room->update($data);
        return response()->json($room);
    }

    public function destroy($id)
    {
        $room = Room::findOrFail($id);
        $room->delete();
        return response()->json(['message' => 'Salle supprimée avec succès.']);
    }
}
