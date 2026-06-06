<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TimeSlot extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'start_time', 'end_time'];

    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }

    public function availabilities()
    {
        return $this->hasMany(TeacherAvailability::class);
    }
}
