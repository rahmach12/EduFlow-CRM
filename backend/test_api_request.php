<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Http;

try {
    echo "1. Attempting login as admin@school.com...\n";
    $loginResponse = Http::post('http://127.0.0.1:8000/api/login', [
        'email' => 'admin@school.com',
        'password' => 'password123'
    ]);

    if (!$loginResponse->successful()) {
        throw new \Exception("Login failed: " . $loginResponse->body());
    }

    $token = $loginResponse->json()['token'] ?? $loginResponse->json()['access_token'] ?? null;
    if (!$token) {
        throw new \Exception("No token found in response: " . $loginResponse->body());
    }
    echo "Login successful! Token acquired.\n\n";

    echo "2. Hitting GET /api/schedules/options...\n";
    $optionsResponse = Http::withToken($token)
        ->get('http://127.0.0.1:8000/api/schedules/options');

    echo "Status Code: " . $optionsResponse->status() . "\n";
    echo "Headers:\n";
    print_r($optionsResponse->headers());
    echo "\nBody:\n";
    echo $optionsResponse->body() . "\n";

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
