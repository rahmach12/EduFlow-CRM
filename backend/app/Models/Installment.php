<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Installment extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_finance_id',
        'installment_number',
        'amount',
        'due_date',
        'amount_paid',
        'status',
        'penalty_amount',
        'paid_at',
    ];

    protected $casts = [
        'due_date' => 'date',
        'paid_at' => 'datetime',
    ];

    public function studentFinance()
    {
        return $this->belongsTo(StudentFinance::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}
