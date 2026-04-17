<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Internship extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'type',
        'company_name',
        'supervisor_name',
        'supervisor_email',
        'start_date',
        'end_date',
        'status',
        'report_file',
        'defense_date',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
