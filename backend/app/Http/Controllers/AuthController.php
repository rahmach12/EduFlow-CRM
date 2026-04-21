<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Role;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $rules = [
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
            'role' => 'required|in:student,teacher',
            'cin' => 'required|string|unique:users,cin',
            'gender' => 'nullable|in:Male,Female',
            'date_of_birth' => 'required|date',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
        ];

        if ($request->role === 'student') {
            $rules['class_id'] = 'required|exists:classes,id';
        } else {
            $rules['subject_id'] = 'nullable|exists:subjects,id';
        }

        $request->validate($rules);

        $roleName = $request->role === 'teacher' ? 'Teacher' : 'Student';
        $role = Role::firstOrCreate(['name' => $roleName]);

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'cin' => $request->cin,
            'gender' => $request->gender,
            'password' => Hash::make($request->password),
            'role_id' => $role->id,
        ]);

        if ($roleName === 'Student') {
            Student::create([
                'user_id' => $user->id,
                'class_id' => $request->input('class_id'),
                'matricule' => $request->input('matricule'),
                'date_of_birth' => $request->input('date_of_birth'),
                'phone' => $request->input('phone'),
                'address' => $request->input('address'),
            ]);
        } else {
            Teacher::create([
                'user_id' => $user->id,
                'subject_id' => $request->input('subject_id'),
                'date_of_birth' => $request->input('date_of_birth'),
                'phone' => $request->input('phone'),
                'address' => $request->input('address'),
            ]);
        }

        $token = JWTAuth::fromUser($user);

        return response()->json(compact('user', 'token'), 201);
    }

    public function login(Request $request)
    {
        $credentials = $request->only('email', 'password');

        if (! $token = auth()->guard('api')->attempt($credentials)) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        return $this->respondWithToken($token);
    }

    public function me()
    {
        return response()->json(auth()->guard('api')->user()->load([
            'role',
            'student.classe.faculty',
            'student.classe.filiere',
            'student.classe.academicLevel',
            'teacher.subject',
        ]));
    }

    public function logout()
    {
        auth()->guard('api')->logout();

        return response()->json(['message' => 'Successfully logged out']);
    }

    protected function respondWithToken($token)
    {
        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth()->guard('api')->factory()->getTTL() * 60,
            'user' => auth()->guard('api')->user()->load([
                'role',
                'student.classe.faculty',
                'student.classe.filiere',
                'student.classe.academicLevel',
                'teacher.subject',
            ])
        ]);
    }
}
