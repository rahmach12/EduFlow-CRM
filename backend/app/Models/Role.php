<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    /** @use HasFactory<\Database\Factories\RoleFactory> */
    use HasFactory;

    protected $fillable = ['name'];

    public const ADMIN_ALLOWED = [
        'Admin',
        'Finance Officer',
        'Internship Manager',
        'Scolarite',
    ];

    public const SELF_REGISTRATION = [
        'Student',
        'Teacher',
    ];
}
