<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Group extends Model
{
    use HasFactory;

    protected $fillable = ['class_id', 'name'];

    public function classe()
    {
        return $this->belongsTo(Classe::class, 'class_id');
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }
}
