<?php

namespace App\Http\Controllers;

use App\Models\DocumentRequest;
use App\Models\Notification;
use App\Models\Student;
use App\Events\NotificationCreated;
use Illuminate\Http\Request;

class DocumentRequestController extends Controller
{
    /**
     * List document requests.
     */
    public function index()
    {
        $user = auth()->guard('api')->user();
        $role = $user->role->name;

        if ($role === 'Student') {
            $student = $user->student;
            if (!$student) {
                return response()->json([], 200);
            }
            return response()->json(
                DocumentRequest::where('student_id', $student->id)
                    ->orderBy('created_at', 'desc')
                    ->get()
            );
        }

        if ($role === 'Scolarite' || $role === 'Admin') {
            return response()->json(
                DocumentRequest::with(['student.user', 'student.classe'])
                    ->orderBy('created_at', 'desc')
                    ->get()
            );
        }

        return response()->json(['message' => 'Unauthorized'], 403);
    }

    /**
     * Create a new document request.
     */
    public function store(Request $request)
    {
        $user = auth()->guard('api')->user();
        if ($user->role->name !== 'Student') {
            return response()->json(['message' => 'Only students can request documents'], 403);
        }

        $student = $user->student;
        if (!$student) {
            return response()->json(['message' => 'Student record not found'], 404);
        }

        $request->validate([
            'document_type' => 'required|string|in:attestation_presence,attestation_inscription,releve_notes,convention_stage,stage_papers'
        ]);

        $docRequest = DocumentRequest::create([
            'student_id' => $student->id,
            'document_type' => $request->document_type,
            'status' => 'pending'
        ]);

        return response()->json($docRequest, 201);
    }

    /**
     * Update status of a document request.
     */
    public function updateStatus(Request $request, $id)
    {
        $user = auth()->guard('api')->user();
        $role = $user->role->name;

        if ($role !== 'Scolarite' && $role !== 'Admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'status' => 'required|string|in:pending,approved,rejected,ready',
            'rejection_reason' => 'nullable|string'
        ]);

        $docRequest = DocumentRequest::findOrFail($id);
        $docRequest->update([
            'status' => $request->status,
            'rejection_reason' => $request->rejection_reason
        ]);

        // Send a notification to the student
        $studentUser = $docRequest->student->user;
        $docNames = [
            'attestation_presence' => 'Attestation de présence',
            'attestation_inscription' => 'Attestation d\'inscription',
            'releve_notes' => 'Relevé de notes',
            'convention_stage' => 'Convention de stage',
            'stage_papers' => 'Papiers de stage',
        ];
        $docName = $docNames[$docRequest->document_type] ?? 'Document administratif';

        $statusLabel = [
            'approved' => 'approuvée',
            'rejected' => 'rejetée',
            'ready' => 'prête pour téléchargement',
            'pending' => 'en attente'
        ][$request->status] ?? $request->status;

        $msg = "Votre demande de \"{$docName}\" est passée à l'état: {$statusLabel}.";
        if ($request->status === 'rejected' && $request->rejection_reason) {
            $msg .= " Motif: " . $request->rejection_reason;
        }

        $notification = Notification::create([
            'user_id' => $studentUser->id,
            'title' => 'Demande de document mise à jour',
            'message' => $msg,
            'type' => 'document',
            'is_read' => false
        ]);

        broadcast(new NotificationCreated($notification))->toOthers();

        return response()->json($docRequest->load(['student.user']));
    }
}
