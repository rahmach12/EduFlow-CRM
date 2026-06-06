<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\OllamaService;
use App\Models\Chat;
use Auth;

class OllamaController extends Controller
{
    protected OllamaService $ollamaService;

    public function __construct(OllamaService $ollamaService)
    {
        $this->ollamaService = $ollamaService;
    }

    /**
     * Handle a chat message and forward it to the Ollama API securely.
     *
     * Expected JSON payload: { "message": "..." }
     * Returns: { "reply": "..." }
     */
    public function sendMessage(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
        ]);

        $message = $request->input('message');
        $user = $request->user();

        // Use the centralized Ollama service to get the reply
        $reply = $this->ollamaService->chat($message);

        if (!$reply) {
            return response()->json(['error' => 'Failed to communicate with LLM'], 500);
        }

        // Optional persistence
        if (config('chat.persist', false)) {
            Chat::create([
                'user_id' => $user->id,
                'message' => $message,
                'reply'   => $reply,
            ]);
        }

        return response()->json(['reply' => $reply]);
    }
}

?>
