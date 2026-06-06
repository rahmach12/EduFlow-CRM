<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OllamaService
{
    protected string $baseUrl;
    protected string $model;

    public function __construct()
    {
        // Forcing 127.0.0.1 for security
        $this->baseUrl = env('OLLAMA_API_URL', 'http://127.0.0.1:11434/api');
        $this->model = env('OLLAMA_MODEL', 'llama2');
    }

    /**
     * Send a general chat message (used by the Chatbot)
     */
    public function chat(string $message): ?string
    {
        $jsonPath = base_path('../frontend/src/data/company_data.json');
        $companyInfo = '';
        if (file_exists($jsonPath)) {
            $companyInfo = "\nVoici les informations de l'entreprise pour t'aider à répondre :\n" . file_get_contents($jsonPath);
        }

        $systemPrompt = "Tu es l'assistant virtuel officiel de l'application EduFlow CRM. Tu dois aider les utilisateurs (étudiants, professeurs, administration) de manière polie et concise. Réponds toujours en français." . $companyInfo;

        try {
            $response = Http::post("{$this->baseUrl}/chat", [
                'model' => $this->model,
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $message],
                ],
                'stream' => false,
            ]);

            return $response->json('message.content');
        } catch (\Exception $e) {
            Log::error('OllamaService chat failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Analyze a student's performance and return strict JSON
     */
    public function analyzeStudent(array $studentData): ?array
    {
        $systemPrompt = "Tu es un expert en analyse pédagogique pour EduFlow CRM. 
Tu dois analyser les informations de l'étudiant fournies et répondre UNIQUEMENT avec un objet JSON valide, sans aucun texte avant ou après. 
Le format JSON doit être exactement : 
{
    \"risk_level\": \"Low|Medium|High\",
    \"issues\": [\"liste des problèmes identifiés\"],
    \"recommendations\": [\"liste des recommandations d'amélioration\"]
}";

        $userPrompt = "Analyse cet étudiant : " . json_encode($studentData);

        try {
            $response = Http::post("{$this->baseUrl}/chat", [
                'model' => $this->model,
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userPrompt],
                ],
                // Ollama supports format: "json" for strict json mode
                'format' => 'json',
                'stream' => false,
            ]);

            $content = $response->json('message.content');
            
            if ($content) {
                return json_decode($content, true);
            }
            return null;
        } catch (\Exception $e) {
            Log::error('OllamaService analyzeStudent failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Generate an alert message for a failing student
     */
    public function generateAlert(string $studentName, string $className, float $average): ?string
    {
        $prompt = "Tu es un assistant IA pour une université. Un étudiant nommé {$studentName} dans la classe {$className} a une moyenne critique de " . round($average, 2) . "/20 en raison de mauvaises notes. Rédige un message d'alerte court, urgent et professionnel (maximum 2 phrases) en français pour notifier l'administration du risque d'échec de cet étudiant. Ne donne que le message d'alerte, pas de salutations ni de texte avant ou après.";

        try {
            $response = Http::post("{$this->baseUrl}/generate", [
                'model' => $this->model,
                'prompt' => $prompt,
                'stream' => false,
            ]);

            return $response->json('response');
        } catch (\Exception $e) {
            Log::error('OllamaService generateAlert failed: ' . $e->getMessage());
            return null;
        }
    }
}
