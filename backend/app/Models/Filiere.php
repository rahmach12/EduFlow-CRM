<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Filiere extends Model
{
    use HasFactory;

    protected $fillable = ['faculty_id', 'name', 'code'];

    public function faculty()
    {
        return $this->belongsTo(Faculty::class);
    }

    public function classes()
    {
        return $this->hasMany(Classe::class);
    }

    public function internships()
    {
        return $this->hasMany(Internship::class, 'defense_filiere_id');
    }
}
