<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Classe extends Model
{
    use HasFactory;

    protected $table = 'classes';

    protected $fillable = [
        'faculty_id',
        'filiere_id',
        'academic_level_id',
        'name',
        'code',
        'level',
        'academic_year',
    ];

    public function faculty()
    {
        return $this->belongsTo(Faculty::class);
    }

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
}
