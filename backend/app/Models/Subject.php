<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'coefficient', 'hours_cours', 'hours_td', 'hours_tp', 'color'];

    public function teachers()
    {
        return $this->belongsToMany(Teacher::class, 'subject_teacher');
    }

    public function notes()
    {
        return $this->hasMany(Note::class);
    }
}
