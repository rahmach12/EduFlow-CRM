<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentDiscount extends Model
{
    use HasFactory;

    protected $table = 'student_discounts';

    protected $fillable = [
        'student_finance_id',
        'discount_id',
        'applied_amount',
    ];

    public function studentFinance()
    {
        return $this->belongsTo(StudentFinance::class);
    }

    public function discount()
    {
        return $this->belongsTo(Discount::class);
    }
}
