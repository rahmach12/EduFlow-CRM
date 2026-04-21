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
        return response()->json(
            Role::whereIn('name', Role::ADMIN_ALLOWED)
                ->orderBy('name')
                ->get()
        );
    }

    /**
     * List all users with their roles (Super Admin only).
     */
    public function index()
    {
        $users = User::with(['role', 'student.classe.filiere', 'teacher.subject'])
            ->whereHas('role', fn ($query) => $query->whereIn('name', Role::ADMIN_ALLOWED))
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

        $role = Role::findOrFail($request->role_id);
        abort_unless(in_array($role->name, Role::ADMIN_ALLOWED, true), 422, 'Admin can only create internal staff roles.');

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name'  => $request->last_name,
            'email'      => $request->email,
            'password'   => Hash::make($request->password),
            'role_id'    => $request->role_id,
            'cin'        => $request->cin,
            'gender'     => $request->gender,
        ]);

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
