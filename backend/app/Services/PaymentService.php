<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Installment;
use App\Models\StudentFinance;
use App\Models\Invoice;
use App\Models\TuitionFee;
use App\Services\UniversityNotificationService;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class PaymentService
{
    public function __construct(
        private FinancialCalculationService $calculator,
        private UniversityNotificationService $notifications
    ) {}

    /**
     * Record a new payment (either validated by Admin, or pending validation for Student)
     */
    public function recordPayment(array $data): Payment
    {
        $studentId = $data['student_id'];
        $amount = (float) $data['amount'];
        $method = $data['payment_method'] ?? 'cash';
        $reference = $data['transaction_reference'] ?? null;
        $proofPath = $data['proof_file_path'] ?? null;
        $isValidated = isset($data['is_validated']) ? (bool) $data['is_validated'] : true;
        $validatedBy = $data['validated_by'] ?? null;
        $details = $data['details'] ?? 'Paiement de scolarité';

        // Find the student's active finance file for the current year
        $finance = StudentFinance::where('student_id', $studentId)
            ->where('academic_year', '2025-2026')
            ->first();

        if (!$finance) {
            // Auto-create a default StudentFinance record for backward compatibility (e.g. in test suites)
            $student = \App\Models\Student::find($studentId);
            $tuitionConfig = TuitionFee::where('academic_level_id', $student?->classe?->academic_level_id)
                ->where('filiere_id', $student?->classe?->filiere_id)
                ->first();

            $finance = StudentFinance::create([
                'student_id' => $studentId,
                'tuition_fee_id' => $tuitionConfig?->id,
                'academic_year' => '2025-2026',
                'base_tuition' => $tuitionConfig?->base_amount ?? 6500.00,
                'registration_fee' => $tuitionConfig?->registration_fee ?? 300.00,
                'administrative_fee' => $tuitionConfig?->administrative_fee ?? 150.00,
                'total_due' => ($tuitionConfig?->base_amount ?? 6500.00) + ($tuitionConfig?->registration_fee ?? 300.00) + ($tuitionConfig?->administrative_fee ?? 150.00),
                'total_paid' => 0.00,
                'financial_status' => 'Unpaid'
            ]);
            $this->calculator->recalculate($finance);
        }

        // Find the target installment or default to the oldest unpaid installment
        $installmentId = $data['installment_id'] ?? null;
        if (!$installmentId) {
            $oldestUnpaid = $finance->installments()
                ->whereIn('status', ['Unpaid', 'Partially Paid', 'Overdue'])
                ->orderBy('installment_number')
                ->first();
            
            $installmentId = $oldestUnpaid ? $oldestUnpaid->id : null;
        }

        // Generate receipt number
        $receiptNumber = 'RCPT-' . now()->format('Ymd') . '-' . strtoupper(substr(uniqid(), -6));

        $promotionPercentage = isset($data['promotion_percentage']) ? (float) $data['promotion_percentage'] : 0.0;
        $promotionAmount = isset($data['promotion_amount']) ? (float) $data['promotion_amount'] : ($promotionPercentage / 100 * $amount);

        $payment = Payment::create([
            'student_id' => $studentId,
            'amount' => $amount,
            'amount_due' => $data['amount_due'] ?? $finance->total_due, // reference
            'amount_paid' => $data['amount_paid'] ?? $amount,
            'date' => $data['date'] ?? now()->toDateString(),
            'due_date' => $data['due_date'] ?? null,
            'status' => $data['status'] ?? ($isValidated ? 'Paid' : 'Unpaid'), // 'Unpaid' means pending validation
            'receipt_number' => $receiptNumber,
            'paid_at' => $isValidated ? now() : null,
            'payment_method' => $method,
            'transaction_reference' => $reference,
            'proof_file_path' => $proofPath,
            'is_validated' => $isValidated,
            'validated_by' => $validatedBy,
            'installment_id' => $installmentId,
            'promotion_percentage' => $promotionPercentage,
            'promotion_amount' => $promotionAmount,
        ]);

        // Create Invoice entry if details provided
        Invoice::create([
            'payment_id' => $payment->id,
            'details' => $details,
        ]);

        if ($promotionPercentage > 0) {
            $student = \App\Models\Student::with('user')->find($studentId);
            if ($student && $student->user) {
                $this->notifications->notifyUser(
                    $student->user,
                    'Promotion appliquée',
                    sprintf('Une promotion de %d%% a été appliquée à votre paiement.', $promotionPercentage),
                    'promotion_applied',
                    ['payment_id' => $payment->id]
                );
            }
        }

        if ($isValidated) {
            $this->applyPaymentToInstallment($payment);
        }

        return $payment->load(['student.user', 'installment']);
    }

    /**
     * Validate a pending bank transfer / check payment
     */
    public function validatePayment(Payment $payment, int $validatorId): Payment
    {
        if ($payment->is_validated) {
            return $payment;
        }

        $payment->update([
            'is_validated' => true,
            'validated_by' => $validatorId,
            'status' => 'Paid',
            'paid_at' => now(),
        ]);

        $this->applyPaymentToInstallment($payment);

        // Notify Student
        $studentUser = $payment->student?->user;
        if ($studentUser) {
            $this->notifications->notifyUser(
                $studentUser,
                'Paiement validé',
                sprintf('Votre paiement de %s TND par %s a été validé avec succès.', number_format($payment->amount, 2), $payment->payment_method),
                'payment_validated',
                ['payment_id' => $payment->id]
            );
        }

        return $payment->fresh(['student.user', 'installment']);
    }

    /**
     * Reject a pending payment proof
     */
    public function rejectPayment(Payment $payment): void
    {
        if ($payment->is_validated) {
            throw new \Exception("Impossible de rejeter un paiement déjà validé.");
        }

        // Delete proof file if exists
        if ($payment->proof_file_path) {
            Storage::disk('public')->delete($payment->proof_file_path);
        }

        $payment->delete();
    }

    /**
     * Apply a validated payment's amount to its associated installment
     */
    private function applyPaymentToInstallment(Payment $payment): void
    {
        $installment = $payment->installment;
        if (!$installment) {
            return;
        }

        $amount = (float) $payment->amount;
        $newAmountPaid = (float) $installment->amount_paid + $amount;
        $installmentAmount = (float) $installment->amount;

        // Check if installment is fully paid
        $status = 'Partially Paid';
        $paidAt = null;
        if ($newAmountPaid >= $installmentAmount) {
            $status = 'Paid';
            $paidAt = now();
        }

        // Apply late fee if paid late and not already penalized
        if ($installment->due_date->isPast() && $installment->status !== 'Paid' && $installment->penalty_amount == 0.00) {
            // Apply 50 TND delay fee
            $installment->penalty_amount = 50.00;
            
            // Adjust the parent student finance total due
            $finance = $installment->studentFinance;
            if ($finance) {
                $finance->update([
                    'total_due' => $finance->total_due + 50.00
                ]);
            }
        }

        $installment->update([
            'amount_paid' => $newAmountPaid,
            'status' => $status,
            'paid_at' => $paidAt ?? $installment->paid_at,
        ]);

        // Recalculate parent student finance
        $finance = $installment->studentFinance;
        if ($finance) {
            $this->calculator->updateFinancialStatus($finance);
        }
    }
}
