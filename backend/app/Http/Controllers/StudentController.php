<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use App\Mail\AccountCreatedMail;

class StudentController extends Controller
{
    public function index()
    {
        $students = Student::with(['user', 'classe'])->get()->map(function ($student) {
            return [
                'id' => $student->id,
                'user_id' => $student->user_id,
                'first_name' => $student->user->first_name ?? '',
                'last_name' => $student->user->last_name ?? '',
                'gender' => $student->user->gender,
                'cin' => $student->user->cin,
                'email' => $student->user->email,
                'phone' => $student->phone,
                'address' => $student->address,
                'date_of_birth' => $student->date_of_birth,
                'photo' => $student->photo,
                'class_id' => $student->class_id,
                'classe' => $student->classe,
                'user' => clone $student->user // Keeping full object just in case frontend relies on it
            ];
        });
        return response()->json($students);
    }

    public function store(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'email' => 'required|email|unique:users',
            'cin' => 'required|string|unique:users',
            'class_id' => 'required|exists:classes,id',
            'date_of_birth' => 'required|date',
            'phone' => 'required|string',
            'address' => 'required|string',
            'gender' => 'nullable|in:Male,Female',
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
            'role_id' => 4 // Student role
        ]);

        $student = Student::create([
            'user_id' => $user->id,
            'class_id' => $request->class_id,
            'date_of_birth' => $request->date_of_birth,
            'phone' => $request->phone,
            'address' => $request->address,
            'photo' => $request->photo
        ]);

        // Dispatch Email
        Mail::to($user->email)->send(new AccountCreatedMail($user, $password));

        return response()->json($student->load('user', 'classe'), 201);
    }

    public function show(Student $student)
    {
        $student->load(['user', 'classe', 'notes', 'absences', 'payments']);
        $payload = array_merge($student->toArray(), [
            'first_name' => $student->user->first_name,
            'last_name' => $student->user->last_name,
            'email' => $student->user->email,
            'cin' => $student->user->cin,
            'gender' => $student->user->gender,
        ]);
        return response()->json($payload);
    }

    public function update(Request $request, Student $student)
    {
        $request->validate([
            'first_name' => 'sometimes|string',
            'last_name' => 'sometimes|string',
            'email' => 'sometimes|email|unique:users,email,'.$student->user_id,
            'cin' => 'sometimes|string|unique:users,cin,'.$student->user_id,
            'class_id' => 'nullable|exists:classes,id',
            'date_of_birth' => 'nullable|date',
            'phone' => 'sometimes|required|string',
            'address' => 'sometimes|required|string',
            'gender' => 'nullable|in:Male,Female',
            'photo' => 'nullable|string'
        ]);

        if ($request->has('first_name') || $request->has('last_name') || $request->has('email') || $request->has('password') || $request->has('cin') || $request->has('gender')) {
            $userData = $request->only('first_name', 'last_name', 'email', 'cin', 'gender');
            if ($request->has('password')) {
                $userData['password'] = Hash::make($request->password);
            }
            $student->user->update($userData);
        }

        $student->update($request->only('class_id', 'date_of_birth', 'phone', 'address', 'photo'));

        return response()->json($student->load('user', 'classe'));
    }

    public function destroy(Student $student)
    {
        $student->user->delete(); // This will cascade delete student record
        return response()->json(['message' => 'Student deleted successfully']);
    }
}
