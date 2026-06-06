<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Teacher extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'phone', 'address', 'subject_id', 'date_of_birth', 'photo', 'hourly_volume', 'department_id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function notes()
    {
        return $this->hasMany(Note::class);
    }

    public function classes()
    {
        return $this->belongsToMany(Classe::class, 'class_teacher', 'teacher_id', 'class_id')->withTimestamps();
    }

    public function subjects()
    {
        return $this->belongsToMany(Subject::class, 'subject_teacher', 'teacher_id', 'subject_id')->withTimestamps();
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function availabilities()
    {
        return $this->hasMany(TeacherAvailability::class);
    }
}
