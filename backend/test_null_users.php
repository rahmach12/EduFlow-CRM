<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$teachers = App\Models\Teacher::with('user')->get();
$hasNull = false;

foreach ($teachers as $t) {
    if (!$t->user) {
        echo "Teacher ID {$t->id} has NULL user!\n";
        $hasNull = true;
    }
}

if (!$hasNull) {
    echo "All teachers have valid users.\n";
}
