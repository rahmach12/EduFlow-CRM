<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Payment;
use App\Services\UniversityNotificationService;
use Illuminate\Http\Request;

class FinanceController extends Controller
{
    public function __construct(private UniversityNotificationService $notifications)
    {
    }

    public function index(Request $request)
    {
        $query = Payment::with(['student.user', 'student.classe', 'invoices']);

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->whereHas('student', function ($studentQuery) use ($search) {
                $studentQuery->where('matricule', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('cin', 'like', "%{$search}%")
                            ->orWhere('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%");
                    });
            });
        }

        return response()->json($query->orderByDesc('created_at')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'amount' => 'required|numeric|min:0',
            'amount_due' => 'nullable|numeric|min:0',
            'amount_paid' => 'nullable|numeric|min:0',
            'date' => 'required|date',
            'due_date' => 'nullable|date',
            'status' => 'required|in:Paid,Unpaid,Partially Paid',
            'promotion_percentage' => 'nullable|numeric|min:0|max:100',
            'details' => 'nullable|string',
        ]);

        $amountDue = (float) ($request->amount_due ?? $request->amount);
        $promotionPercentage = (float) ($request->promotion_percentage ?? 0);
        $promotionAmount = round($amountDue * ($promotionPercentage / 100), 2);
        $amountPaid = (float) ($request->amount_paid ?? $request->amount);

        $payment = Payment::create([
            'student_id' => $request->student_id,
            'amount' => $amountPaid,
            'amount_due' => $amountDue,
            'amount_paid' => $amountPaid,
            'date' => $request->date,
            'due_date' => $request->due_date,
            'status' => $request->status,
            'promotion_percentage' => $promotionPercentage,
            'promotion_amount' => $promotionAmount,
            'receipt_number' => 'RCPT-' . now()->format('Ymd') . '-' . strtoupper(substr(uniqid(), -6)),
            'paid_at' => $request->status === 'Paid' ? now() : null,
        ]);

        if ($request->filled('details')) {
            Invoice::create([
                'payment_id' => $payment->id,
                'details' => $request->details,
            ]);
        }

        if ($promotionPercentage > 0 && $payment->student?->user) {
            $this->notifications->notifyUser(
                $payment->student->user,
                'Promotion appliquee',
                sprintf('Une promotion de %.0f%% a ete appliquee sur vos frais.', $promotionPercentage),
                'promotion_applied',
                ['payment_id' => $payment->id]
            );
        }

        return response()->json($payment->load('student.user', 'student.classe', 'invoices'), 201);
    }

    public function show(Payment $payment)
    {
        return response()->json($payment->load('student.user', 'student.classe', 'invoices'));
    }

    public function update(Request $request, Payment $payment)
    {
        $request->validate([
            'amount' => 'sometimes|numeric|min:0',
            'amount_due' => 'sometimes|numeric|min:0',
            'amount_paid' => 'sometimes|numeric|min:0',
            'date' => 'sometimes|date',
            'due_date' => 'nullable|date',
            'status' => 'sometimes|in:Paid,Unpaid,Partially Paid',
            'promotion_percentage' => 'nullable|numeric|min:0|max:100',
        ]);

        $payload = $request->only([
            'amount',
            'amount_due',
            'amount_paid',
            'date',
            'due_date',
            'status',
            'promotion_percentage',
        ]);

        if (array_key_exists('promotion_percentage', $payload)) {
            $baseAmount = (float) ($payload['amount_due'] ?? $payment->amount_due ?? $payment->amount);
            $payload['promotion_amount'] = round($baseAmount * (((float) $payload['promotion_percentage']) / 100), 2);
        }

        if (($payload['status'] ?? $payment->status) === 'Paid') {
            $payload['paid_at'] = now();
        }

        $payment->update($payload);

        return response()->json($payment->fresh()->load('student.user', 'student.classe', 'invoices'));
    }

    public function receipt(Payment $payment)
    {
        return response()->json([
            'receipt_number' => $payment->receipt_number,
            'student' => $payment->load('student.user', 'student.classe')->student,
            'amount_due' => $payment->amount_due ?? $payment->amount,
            'amount_paid' => $payment->amount_paid ?? $payment->amount,
            'promotion_percentage' => $payment->promotion_percentage,
            'promotion_amount' => $payment->promotion_amount,
            'status' => $payment->status,
            'date' => $payment->date,
            'details' => $payment->invoices()->latest()->first()?->details,
        ]);
    }

    public function destroy(Payment $payment)
    {
        $payment->delete();
        return response()->json(['message' => 'Payment deleted successfully']);
    }
}
