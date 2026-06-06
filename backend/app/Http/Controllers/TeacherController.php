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
        $teachers = Teacher::with(['user', 'subject', 'classes', 'subjects'])->get()->map(function ($teacher) {
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
                'user' => clone $teacher->user,
                'class_ids' => $teacher->classes->pluck('id')->toArray(),
                'classes' => $teacher->classes,
                'subject_ids' => $teacher->subjects->pluck('id')->toArray(),
                'subjects' => $teacher->subjects,
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
            'photo' => 'nullable|string',
            'class_ids' => 'nullable|array',
            'class_ids.*' => 'exists:classes,id',
            'subject_ids' => 'nullable|array',
            'subject_ids.*' => 'exists:subjects,id'
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
            'subject_id' => !empty($request->subject_ids) ? $request->subject_ids[0] : ($request->subject_id ?? null),
            'photo' => $request->photo
        ]);

        $teacher->classes()->sync($request->class_ids ?? []);
        $teacher->subjects()->sync($request->subject_ids ?? []);

        try {
            Mail::to($user->email)->send(new AccountCreatedMail($user, $password));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning("Failed to send account creation email to {$user->email}. Generated Password: {$password}. Error: " . $e->getMessage());
        }

        return response()->json($teacher->load('user', 'subject', 'classes', 'subjects'), 201);
    }

    public function show(Teacher $teacher)
    {
        $teacher->load(['user', 'subject', 'notes', 'classes', 'subjects']);
        $payload = array_merge($teacher->toArray(), [
            'first_name' => $teacher->user->first_name,
            'last_name' => $teacher->user->last_name,
            'email' => $teacher->user->email,
            'cin' => $teacher->user->cin,
            'gender' => $teacher->user->gender,
            'class_ids' => $teacher->classes->pluck('id')->toArray(),
            'subject_ids' => $teacher->subjects->pluck('id')->toArray(),
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
            'photo' => 'nullable|string',
            'class_ids' => 'nullable|array',
            'class_ids.*' => 'exists:classes,id',
            'subject_ids' => 'nullable|array',
            'subject_ids.*' => 'exists:subjects,id'
        ]);

        if ($request->has('first_name') || $request->has('last_name') || $request->has('email') || $request->has('password') || $request->has('cin') || $request->has('gender')) {
            $userData = $request->only('first_name', 'last_name', 'email', 'cin', 'gender');
            if ($request->has('password')) {
                $userData['password'] = Hash::make($request->password);
            }
            $teacher->user->update($userData);
        }

        $teacherData = $request->only('phone', 'address', 'date_of_birth', 'photo');
        if ($request->has('subject_ids')) {
            $teacherData['subject_id'] = !empty($request->subject_ids) ? $request->subject_ids[0] : null;
        } elseif ($request->has('subject_id')) {
            $teacherData['subject_id'] = $request->subject_id;
        }

        $teacher->update($teacherData);

        if ($request->has('class_ids')) {
            $teacher->classes()->sync($request->class_ids ?? []);
        }
        if ($request->has('subject_ids')) {
            $teacher->subjects()->sync($request->subject_ids ?? []);
        }

        return response()->json($teacher->load('user', 'subject', 'classes', 'subjects'));
    }

    public function destroy(Teacher $teacher)
    {
        $teacher->user->delete();
        return response()->json(['message' => 'Teacher deleted successfully']);
    }
}
