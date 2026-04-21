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
        'title',
        'company_name',
        'supervisor_name',
        'supervisor_email',
        'start_date',
        'end_date',
        'status',
        'rejection_reason',
        'approved_by_user_id',
        'reviewed_at',
        'report_file',
        'defense_date',
        'defense_jury',
        'defense_room',
        'defense_filiere_id',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    public function defenseFiliere()
    {
        return $this->belongsTo(Filiere::class, 'defense_filiere_id');
    }
}
