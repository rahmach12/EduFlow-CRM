<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * List all roles (for user creation form).
     */
    public function roles()
    {
        return response()->json(Role::orderBy('name')->get());
    }

    /**
     * List all users with their roles (Super Admin only).
     */
    public function index()
    {
        $users = User::with(['role', 'student.classe', 'teacher.subject'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($users);
    }

    /**
     * Create any user account (with role).
     */
    public function store(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string',
            'last_name'  => 'required|string',
            'email'      => 'required|email|unique:users',
            'password'   => 'required|min:6',
            'role_id'    => 'required|exists:roles,id',
            'cin'        => 'nullable|string|unique:users',
            'gender'     => 'nullable|in:Male,Female',
        ]);

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name'  => $request->last_name,
            'email'      => $request->email,
            'password'   => Hash::make($request->password),
            'role_id'    => $request->role_id,
            'cin'        => $request->cin,
            'gender'     => $request->gender,
        ]);

        // Auto-create Student or Teacher profile if applicable
        $role = Role::find($request->role_id);
        if ($role && $role->name === 'Student') {
            Student::create([
                'user_id'  => $user->id,
                'class_id' => $request->class_id ?? null,
                'phone'    => $request->phone ?? null,
                'address'  => $request->address ?? null,
            ]);
        } elseif ($role && $role->name === 'Teacher') {
            Teacher::create([
                'user_id'    => $user->id,
                'subject_id' => $request->subject_id ?? null,
                'phone'      => $request->phone ?? null,
                'address'    => $request->address ?? null,
            ]);
        }

        return response()->json($user->fresh()->load(['role']), 201);
    }

    /**
     * Update a user.
     */
    public function update(Request $request, User $user)
    {
        $request->validate([
            'first_name' => 'sometimes|string',
            'last_name'  => 'sometimes|string',
            'email'      => 'sometimes|email|unique:users,email,' . $user->id,
            'role_id'    => 'sometimes|exists:roles,id',
        ]);

        $data = $request->only(['first_name', 'last_name', 'email', 'role_id', 'gender']);
        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);
        return response()->json($user->fresh()->load('role'));
    }

    /**
     * Delete a user.
     */
    public function destroy(User $user)
    {
        $user->delete();
        return response()->json(['message' => 'User deleted successfully']);
    }
}
