<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Classe extends Model
{
    use HasFactory;

    protected $table = 'classes';

    protected $fillable = [
        'filiere_id',
        'academic_level_id',
        'name',
        'code',
        'level',
        'academic_year',
    ];

    public function filiere()
    {
        return $this->belongsTo(Filiere::class);
    }

    public function academicLevel()
    {
        return $this->belongsTo(AcademicLevel::class);
    }

    public function students()
    {
        return $this->hasMany(Student::class, 'class_id');
    }

    public function teachers()
    {
        return $this->belongsToMany(Teacher::class, 'class_teacher', 'class_id', 'teacher_id')->withTimestamps();
    }

    public function groups()
    {
        return $this->hasMany(Group::class, 'class_id');
    }
}
