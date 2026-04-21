<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('internships', function (Blueprint $table) {
            $table->string('title')->nullable()->after('type');
            $table->text('rejection_reason')->nullable()->after('status');
            $table->foreignId('approved_by_user_id')->nullable()->after('rejection_reason')->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable()->after('approved_by_user_id');
            $table->text('defense_jury')->nullable()->after('defense_date');
            $table->string('defense_room')->nullable()->after('defense_jury');
            $table->foreignId('defense_filiere_id')->nullable()->after('defense_room')->constrained('filieres')->nullOnDelete();
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->decimal('amount_due', 10, 2)->nullable()->after('student_id');
            $table->decimal('amount_paid', 10, 2)->nullable()->after('amount_due');
            $table->decimal('promotion_percentage', 5, 2)->default(0)->after('amount_paid');
            $table->decimal('promotion_amount', 10, 2)->default(0)->after('promotion_percentage');
            $table->string('receipt_number')->nullable()->after('status');
            $table->date('due_date')->nullable()->after('receipt_number');
            $table->timestamp('paid_at')->nullable()->after('due_date');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->string('type')->nullable()->after('role');
            $table->json('data')->nullable()->after('message');
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropColumn(['type', 'data']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn([
                'amount_due',
                'amount_paid',
                'promotion_percentage',
                'promotion_amount',
                'receipt_number',
                'due_date',
                'paid_at',
            ]);
        });

        Schema::table('internships', function (Blueprint $table) {
            $table->dropConstrainedForeignId('defense_filiere_id');
            $table->dropConstrainedForeignId('approved_by_user_id');
            $table->dropColumn([
                'title',
                'rejection_reason',
                'reviewed_at',
                'defense_jury',
                'defense_room',
            ]);
        });
    }
};
