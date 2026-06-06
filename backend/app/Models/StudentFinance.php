<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentFinance extends Model
{
    use HasFactory;

    protected $table = 'student_finances';

    protected $fillable = [
        'student_id',
        'tuition_fee_id',
        'academic_year',
        'base_tuition',
        'registration_fee',
        'administrative_fee',
        'total_discount',
        'total_scholarship',
        'total_due',
        'total_paid',
        'is_redoublant',
        'redoublant_discount_percentage',
        'financial_status',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function tuitionFee()
    {
        return $this->belongsTo(TuitionFee::class);
    }

    public function installments()
    {
        return $this->hasMany(Installment::class);
    }

    public function studentDiscounts()
    {
        return $this->hasMany(StudentDiscount::class);
    }

    public function scholarships()
    {
        return $this->hasMany(Scholarship::class);
    }
}
