<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'document_type',
        'status',
        'rejection_reason',
        'attachment_path',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
