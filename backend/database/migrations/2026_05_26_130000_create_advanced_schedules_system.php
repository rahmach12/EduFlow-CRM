<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Departments table
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->timestamps();
        });

        // 2. Semesters table
        Schema::create('semesters', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->boolean('is_active')->default(false);
            $table->timestamps();
        });

        // 3. Rooms table
        Schema::create('rooms', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->enum('type', ['Cours', 'TP', 'TD'])->default('Cours');
            $table->integer('capacity')->default(30);
            $table->timestamps();
        });

        // 4. Groups table
        Schema::create('groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();

            $table->unique(['class_id', 'name']);
        });

        // 5. Time Slots table
        Schema::create('time_slots', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g. "Séance 1"
            $table->time('start_time');
            $table->time('end_time');
            $table->timestamps();
        });

        // 6. Teacher Availabilities table
        Schema::create('teacher_availabilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained()->cascadeOnDelete();
            $table->string('day_of_week'); // e.g. 'Monday'
            $table->foreignId('time_slot_id')->constrained('time_slots')->cascadeOnDelete();
            $table->boolean('is_available')->default(true);
            $table->timestamps();

            $table->unique(['teacher_id', 'day_of_week', 'time_slot_id'], 'teacher_avail_day_slot_unique');
        });

        // 7. Add columns to teachers
        Schema::table('teachers', function (Blueprint $table) {
            $table->integer('hourly_volume')->default(20)->after('subject_id');
            $table->foreignId('department_id')->nullable()->after('hourly_volume')->constrained()->nullOnDelete();
        });

        // 8. Add columns to subjects
        Schema::table('subjects', function (Blueprint $table) {
            $table->decimal('hours_cours', 4, 1)->default(0)->after('coefficient');
            $table->decimal('hours_td', 4, 1)->default(0)->after('hours_cours');
            $table->decimal('hours_tp', 4, 1)->default(0)->after('hours_td');
            $table->string('color')->default('#6366f1')->after('hours_tp');
        });

        // 9. Recreate schedules table
        Schema::dropIfExists('schedules');

        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('group_id')->nullable()->constrained('groups')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained('teachers')->cascadeOnDelete();
            $table->foreignId('room_id')->constrained('rooms')->cascadeOnDelete();
            $table->foreignId('semester_id')->constrained('semesters')->cascadeOnDelete();
            $table->foreignId('time_slot_id')->constrained('time_slots')->cascadeOnDelete();
            $table->string('day_of_week');
            $table->enum('type', ['Cours', 'TP', 'TD'])->default('Cours');
            $table->enum('frequency', ['weekly', 'biweekly'])->default('weekly');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedules');

        Schema::table('subjects', function (Blueprint $table) {
            $table->dropColumn(['hours_cours', 'hours_td', 'hours_tp', 'color']);
        });

        Schema::table('teachers', function (Blueprint $table) {
            $table->dropConstrainedForeignId('department_id');
            $table->dropColumn('hourly_volume');
        });

        Schema::dropIfExists('teacher_availabilities');
        Schema::dropIfExists('time_slots');
        Schema::dropIfExists('groups');
        Schema::dropIfExists('rooms');
        Schema::dropIfExists('semesters');
        Schema::dropIfExists('departments');

        // Recreate basic schedules table
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->onDelete('cascade');
            $table->foreignId('subject_id')->constrained()->onDelete('cascade');
            $table->foreignId('teacher_id')->constrained()->onDelete('cascade');
            $table->string('day_of_week');
            $table->time('start_time');
            $table->time('end_time');
            $table->timestamps();
        });
    }
};
