<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Generate a fresh JWT token for the first admin user
$adminUser = \App\Models\User::whereHas('role', function($q){ $q->where('name', 'Admin'); })->first();
$token = auth()->guard('api')->login($adminUser);

$response = (new \App\Http\Controllers\ScheduleController())->options();
echo "Controller direct call:\n";
echo "Semesters: " . count(json_decode($response->getContent(), true)['semesters']) . "\n";
echo "Rooms: " . count(json_decode($response->getContent(), true)['rooms']) . "\n";

// HTTP Call to the local server
$ch = curl_init('http://127.0.0.1:8000/api/test_db');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $token,
    'Accept: application/json'
]);
$res = curl_exec($ch);
curl_close($ch);
echo "\nHTTP call to /api/test_db:\n";
echo $res . "\n";

$ch2 = curl_init('http://127.0.0.1:8000/api/schedules/options');
curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch2, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $token,
    'Accept: application/json'
]);
$res2 = curl_exec($ch2);
curl_close($ch2);
echo "\nHTTP call to /api/schedules/options:\n";
$data2 = json_decode($res2, true);
echo "Semesters: " . count($data2['semesters']) . "\n";
echo "Rooms: " . count($data2['rooms']) . "\n";
