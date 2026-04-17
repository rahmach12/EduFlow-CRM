<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Classe extends Model
{
    use HasFactory;

    protected $table = 'classes';

    protected $fillable = ['name', 'level', 'academic_year'];

    public function students()
    {
        return $this->hasMany(Student::class, 'class_id');
    }
}
