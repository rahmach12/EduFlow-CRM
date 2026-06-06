<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'amount_due',
        'amount_paid',
        'amount',
        'date',
        'status',
        'promotion_percentage',
        'promotion_amount',
        'receipt_number',
        'due_date',
        'paid_at',
        'payment_method',
        'transaction_reference',
        'proof_file_path',
        'is_validated',
        'validated_by',
        'installment_id',
    ];

    protected $casts = [
        'paid_at' => 'datetime',
        'is_validated' => 'boolean',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function installment()
    {
        return $this->belongsTo(Installment::class);
    }

    public function validator()
    {
        return $this->belongsTo(User::class, 'validated_by');
    }
}
