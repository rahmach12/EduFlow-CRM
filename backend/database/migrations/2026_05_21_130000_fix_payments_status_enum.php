<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Modify the column type to string with default Unpaid first
        Schema::table('payments', function (Blueprint $table) {
            $table->string('status', 50)->default('Unpaid')->change();
        });

        // Update any existing French values to their English counterparts
        DB::table('payments')->where('status', 'Payé')->update(['status' => 'Paid']);
        DB::table('payments')->where('status', 'Impayé')->update(['status' => 'Unpaid']);
        DB::table('payments')->where('status', 'Partiellement payé')->update(['status' => 'Partially Paid']);
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('status', 50)->default('Impayé')->change();
        });

        DB::table('payments')->where('status', 'Paid')->update(['status' => 'Payé']);
        DB::table('payments')->where('status', 'Unpaid')->update(['status' => 'Impayé']);
        DB::table('payments')->where('status', 'Partially Paid')->update(['status' => 'Partiellement payé']);
    }
};
