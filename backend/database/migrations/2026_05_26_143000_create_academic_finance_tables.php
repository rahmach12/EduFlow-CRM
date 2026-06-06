<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Tuition Fees Global Rates Configuration
        Schema::create('tuition_fees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_level_id')->constrained('academic_levels')->onDelete('cascade');
            $table->foreignId('filiere_id')->nullable()->constrained('filieres')->onDelete('cascade');
            $table->string('academic_year'); // e.g. "2025-2026"
            $table->decimal('base_amount', 10, 2);
            $table->decimal('registration_fee', 10, 2)->default(0.00);
            $table->decimal('administrative_fee', 10, 2)->default(0.00);
            $table->integer('installments_count')->default(3);
            $table->timestamps();
        });

        // 2. Discounts Types Configuration
        Schema::create('discounts', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g. "Remise Fratrie"
            $table->string('code')->unique(); // e.g. "FRATRIE_10"
            $table->enum('type', ['Percentage', 'Fixed']);
            $table->decimal('value', 10, 2);
            $table->boolean('is_cumulative')->default(true);
            $table->boolean('is_automatic')->default(false);
            $table->timestamps();
        });

        // 3. Student Personal Academic Finance accounts
        Schema::create('student_finances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('tuition_fee_id')->nullable()->constrained('tuition_fees')->onDelete('set null');
            $table->string('academic_year');
            $table->decimal('base_tuition', 10, 2);
            $table->decimal('registration_fee', 10, 2)->default(0.00);
            $table->decimal('administrative_fee', 10, 2)->default(0.00);
            $table->decimal('total_discount', 10, 2)->default(0.00);
            $table->decimal('total_scholarship', 10, 2)->default(0.00);
            $table->decimal('total_due', 10, 2); // Net to pay: (base + reg + admin) - (discount + scholarship)
            $table->decimal('total_paid', 10, 2)->default(0.00);
            $table->boolean('is_redoublant')->default(false);
            $table->decimal('redoublant_discount_percentage', 5, 2)->default(0.00);
            $table->enum('financial_status', ['Paid', 'Partially Paid', 'Unpaid', 'Overdue', 'Administrative Block'])->default('Unpaid');
            $table->timestamps();
        });

        // 4. Installments payment plan
        Schema::create('installments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_finance_id')->constrained('student_finances')->onDelete('cascade');
            $table->integer('installment_number');
            $table->decimal('amount', 10, 2);
            $table->date('due_date');
            $table->decimal('amount_paid', 10, 2)->default(0.00);
            $table->enum('status', ['Paid', 'Partially Paid', 'Unpaid', 'Overdue'])->default('Unpaid');
            $table->decimal('penalty_amount', 10, 2)->default(0.00);
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });

        // 5. Applied discounts to student account
        Schema::create('student_discounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_finance_id')->constrained('student_finances')->onDelete('cascade');
            $table->foreignId('discount_id')->constrained('discounts')->onDelete('cascade');
            $table->decimal('applied_amount', 10, 2);
            $table->timestamps();
        });

        // 6. Applied Scholarships to student account
        Schema::create('scholarships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_finance_id')->constrained('student_finances')->onDelete('cascade');
            $table->decimal('amount', 10, 2);
            $table->string('provider'); // e.g. "Ministère de l'Enseignement", "Fondation"
            $table->text('details')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scholarships');
        Schema::dropIfExists('student_discounts');
        Schema::dropIfExists('installments');
        Schema::dropIfExists('student_finances');
        Schema::dropIfExists('discounts');
        Schema::dropIfExists('tuition_fees');
    }
};
