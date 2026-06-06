<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$controller = app(\App\Http\Controllers\ScheduleController::class);
$response = $controller->options();

$data = json_decode($response->getContent(), true);
echo "Keys in response:\n";
print_r(array_keys($data));

echo "\nSemesters count: " . count($data['semesters']) . "\n";
echo "Classes count: " . count($data['classes']) . "\n";
print_r($data['semesters']);
