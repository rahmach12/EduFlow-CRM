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
        Schema::table('payments', function (Blueprint $table) {
            $table->string('payment_method')->default('cash'); // 'cash', 'bank_transfer', 'check', 'online'
            $table->string('transaction_reference')->nullable(); // check number or transfer reference ID
            $table->string('proof_file_path')->nullable(); // bank slip or check image upload
            $table->boolean('is_validated')->default(true); // false for submitted bank slips/checks awaiting validation
            $table->foreignId('validated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('installment_id')->nullable()->constrained('installments')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['installment_id']);
            $table->dropForeign(['validated_by']);
            $table->dropColumn(['payment_method', 'transaction_reference', 'proof_file_path', 'is_validated', 'validated_by', 'installment_id']);
        });
    }
};
