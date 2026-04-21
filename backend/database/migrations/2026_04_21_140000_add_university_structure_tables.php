<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('faculties', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('code')->nullable()->unique();
            $table->timestamps();
        });

        Schema::create('filieres', function (Blueprint $table) {
            $table->id();
            $table->foreignId('faculty_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('code')->nullable();
            $table->timestamps();

            $table->unique(['faculty_id', 'name']);
        });

        Schema::create('academic_levels', function (Blueprint $table) {
            $table->id();
            $table->string('cycle');
            $table->string('name');
            $table->string('slug')->unique();
            $table->unsignedInteger('rank')->default(0);
            $table->timestamps();
        });

        Schema::table('classes', function (Blueprint $table) {
            $table->foreignId('faculty_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->foreignId('filiere_id')->nullable()->after('faculty_id')->constrained('filieres')->nullOnDelete();
            $table->foreignId('academic_level_id')->nullable()->after('filiere_id')->constrained('academic_levels')->nullOnDelete();
            $table->string('code')->nullable()->after('name');
        });

        Schema::table('students', function (Blueprint $table) {
            $table->string('matricule')->nullable()->unique()->after('class_id');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropUnique(['matricule']);
            $table->dropColumn('matricule');
        });

        Schema::table('classes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('academic_level_id');
            $table->dropConstrainedForeignId('filiere_id');
            $table->dropConstrainedForeignId('faculty_id');
            $table->dropColumn('code');
        });

        Schema::dropIfExists('academic_levels');
        Schema::dropIfExists('filieres');
        Schema::dropIfExists('faculties');
    }
};
