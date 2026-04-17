<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'class_id', 'date_of_birth', 'phone', 'address', 'photo',
        'is_eliminated', 'elimination_reason',
    ];

    protected $casts = [
        'is_eliminated' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function classe()
    {
        return $this->belongsTo(Classe::class, 'class_id');
    }

    public function notes()
    {
        return $this->hasMany(Note::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function attendanceRecords()
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    public function internships()
    {
        return $this->hasMany(Internship::class);
    }
}

