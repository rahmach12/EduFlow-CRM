<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Http;

try {
    $loginResponse = Http::post('http://127.0.0.1:8000/api/login', [
        'email' => 'admin@school.com',
        'password' => 'password123'
    ]);

    $token = $loginResponse->json()['token'] ?? $loginResponse->json()['access_token'] ?? null;
    
    $optionsResponse = Http::withToken($token)
        ->get('http://127.0.0.1:8000/api/schedules/options');

    file_put_contents('options_response.json', $optionsResponse->body());
    echo "Saved API response to options_response.json\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
