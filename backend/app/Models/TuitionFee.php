<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TuitionFee extends Model
{
    use HasFactory;

    protected $fillable = [
        'academic_level_id',
        'filiere_id',
        'academic_year',
        'base_amount',
        'registration_fee',
        'administrative_fee',
        'installments_count',
    ];

    public function academicLevel()
    {
        return $this->belongsTo(AcademicLevel::class);
    }

    public function filiere()
    {
        return $this->belongsTo(Filiere::class);
    }

    public function studentFinances()
    {
        return $this->hasMany(StudentFinance::class);
    }
}
