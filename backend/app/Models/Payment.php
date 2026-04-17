<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = ['student_id', 'amount', 'date', 'status'];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }
}
