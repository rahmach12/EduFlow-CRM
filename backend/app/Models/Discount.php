<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Discount extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'type',
        'value',
        'is_cumulative',
        'is_automatic',
    ];

    public function studentDiscounts()
    {
        return $this->hasMany(StudentDiscount::class);
    }
}
