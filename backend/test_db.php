<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Semester;
use App\Models\Classe;
use App\Models\Room;
use App\Models\TimeSlot;

echo "Semesters count: " . Semester::count() . "\n";
echo "Classes count: " . Classe::count() . "\n";
echo "Rooms count: " . Room::count() . "\n";
echo "TimeSlots count: " . TimeSlot::count() . "\n";
foreach (Semester::all() as $s) {
    echo "Semester: ID={$s->id}, Name={$s->name}, Active={$s->is_active}\n";
}
