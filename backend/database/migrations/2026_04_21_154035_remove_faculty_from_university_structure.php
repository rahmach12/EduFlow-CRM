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
        Schema::table('classes', function (Blueprint $table) {
            if (Schema::hasColumn('classes', 'faculty_id')) {
                $table->dropConstrainedForeignId('faculty_id');
            }
        });

        Schema::table('filieres', function (Blueprint $table) {
            if (Schema::hasColumn('filieres', 'faculty_id')) {
                $table->dropConstrainedForeignId('faculty_id');
                $table->dropUnique(['faculty_id', 'name']);
                $table->unique('name');
            }
        });

        Schema::dropIfExists('faculties');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('faculties', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('code')->nullable()->unique();
            $table->timestamps();
        });

        Schema::table('filieres', function (Blueprint $table) {
            $table->foreignId('faculty_id')->nullable()->constrained()->cascadeOnDelete();
            $table->dropUnique(['name']);
            $table->unique(['faculty_id', 'name']);
        });

        Schema::table('classes', function (Blueprint $table) {
            $table->foreignId('faculty_id')->nullable()->after('id')->constrained()->nullOnDelete();
        });
    }
};
