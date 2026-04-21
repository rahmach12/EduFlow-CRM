<?php

namespace App\Http\Controllers;

use App\Mail\AccountCreatedMail;
use App\Models\Role;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class TeacherController extends Controller
{
    public function index()
    {
        $teachers = Teacher::with(['user', 'subject'])->get()->map(function ($teacher) {
            return [
                'id' => $teacher->id,
                'user_id' => $teacher->user_id,
                'first_name' => $teacher->user->first_name ?? '',
                'last_name' => $teacher->user->last_name ?? '',
                'gender' => $teacher->user->gender,
                'cin' => $teacher->user->cin,
                'email' => $teacher->user->email,
                'phone' => $teacher->phone,
                'address' => $teacher->address,
                'date_of_birth' => $teacher->date_of_birth,
                'photo' => $teacher->photo,
                'subject_id' => $teacher->subject_id,
                'subject' => $teacher->subject,
                'user' => clone $teacher->user
            ];
        });
        return response()->json($teachers);
    }

    public function store(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'email' => 'required|email|unique:users',
            'cin' => 'required|string|unique:users',
            'phone' => 'required|string',
            'address' => 'required|string',
            'date_of_birth' => 'required|date',
            'gender' => 'nullable|in:Male,Female',
            'subject_id' => 'nullable|exists:subjects,id',
            'photo' => 'nullable|string'
        ]);

        $password = Str::random(10);

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'gender' => $request->gender,
            'email' => $request->email,
            'cin' => $request->cin,
            'password' => Hash::make($password),
            'role_id' => Role::firstOrCreate(['name' => 'Teacher'])->id,
        ]);

        $teacher = Teacher::create([
            'user_id' => $user->id,
            'phone' => $request->phone,
            'address' => $request->address,
            'date_of_birth' => $request->date_of_birth,
            'subject_id' => $request->subject_id,
            'photo' => $request->photo
        ]);

        Mail::to($user->email)->send(new AccountCreatedMail($user, $password));

        return response()->json($teacher->load('user', 'subject'), 201);
    }

    public function show(Teacher $teacher)
    {
        $teacher->load(['user', 'subject', 'notes']);
        $payload = array_merge($teacher->toArray(), [
            'first_name' => $teacher->user->first_name,
            'last_name' => $teacher->user->last_name,
            'email' => $teacher->user->email,
            'cin' => $teacher->user->cin,
            'gender' => $teacher->user->gender,
        ]);
        return response()->json($payload);
    }

    public function update(Request $request, Teacher $teacher)
    {
        $request->validate([
            'first_name' => 'sometimes|string',
            'last_name' => 'sometimes|string',
            'email' => 'sometimes|email|unique:users,email,' . $teacher->user_id,
            'cin' => 'sometimes|string|unique:users,cin,' . $teacher->user_id,
            'phone' => 'sometimes|required|string',
            'address' => 'sometimes|required|string',
            'date_of_birth' => 'sometimes|required|date',
            'gender' => 'nullable|in:Male,Female',
            'subject_id' => 'nullable|exists:subjects,id',
            'photo' => 'nullable|string'
        ]);

        if ($request->has('first_name') || $request->has('last_name') || $request->has('email') || $request->has('password') || $request->has('cin') || $request->has('gender')) {
            $userData = $request->only('first_name', 'last_name', 'email', 'cin', 'gender');
            if ($request->has('password')) {
                $userData['password'] = Hash::make($request->password);
            }
            $teacher->user->update($userData);
        }

        $teacher->update($request->only('phone', 'address', 'date_of_birth', 'subject_id', 'photo'));

        return response()->json($teacher->load('user', 'subject'));
    }

    public function destroy(Teacher $teacher)
    {
        $teacher->user->delete();
        return response()->json(['message' => 'Teacher deleted successfully']);
    }
}
