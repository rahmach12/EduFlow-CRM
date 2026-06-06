<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\StudentFinance;
use App\Models\TuitionFee;
use App\Models\Discount;
use App\Models\Scholarship;
use App\Models\StudentDiscount;
use App\Models\Student;
use App\Services\PaymentService;
use App\Services\FinancialCalculationService;
use App\Services\UniversityNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class FinanceController extends Controller
{
    public function __construct(
        private PaymentService $paymentService,
        private FinancialCalculationService $calculator,
        private UniversityNotificationService $notifications
    ) {}

    /**
     * Get global financial statistics
     */
    public function stats()
    {
        $this->validateRole(['Admin', 'Finance Officer']);

        $totalCollected = (float) Payment::where('is_validated', true)->sum('amount');
        
        $totalOverdue = (float) \App\Models\Installment::where('status', 'Overdue')
            ->selectRaw('SUM(amount - amount_paid) as outstanding')
            ->first()->outstanding;

        $totalDiscounts = (float) StudentFinance::sum('total_discount');
        $totalScholarships = (float) StudentFinance::sum('total_scholarship');
        
        $studentsOverdueCount = StudentFinance::where('financial_status', 'Overdue')->count();
        $studentsBlockedCount = StudentFinance::where('financial_status', 'Administrative Block')->count();

        // Monthly collections (last 6 months)
        $monthlyCollections = Payment::where('is_validated', true)
            ->where('date', '>=', now()->subMonths(6)->startOfMonth())
            ->selectRaw('DATE_FORMAT(date, "%Y-%m") as month, SUM(amount) as total')
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return response()->json([
            'total_collected' => $totalCollected,
            'total_overdue' => $totalOverdue,
            'total_discounts' => $totalDiscounts,
            'total_scholarships' => $totalScholarships,
            'students_overdue_count' => $studentsOverdueCount,
            'students_blocked_count' => $studentsBlockedCount,
            'monthly_collections' => $monthlyCollections,
        ]);
    }

    /**
     * List all payments (keep backward compatibility)
     */
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

    /**
     * List all student finance records (Admin / Finance Officer view)
     */
    public function studentFinances(Request $request)
    {
        $this->validateRole(['Admin', 'Finance Officer']);

        $query = StudentFinance::with([
            'student.user', 
            'student.classe.filiere',
            'student.classe.academicLevel',
            'installments',
            'studentDiscounts.discount',
            'scholarships'
        ]);

        if ($request->filled('filiere_id')) {
            $query->whereHas('student.classe', function($q) use ($request) {
                $q->where('filiere_id', $request->filiere_id);
            });
        }

        if ($request->filled('financial_status')) {
            $query->where('financial_status', $request->financial_status);
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

        return response()->json($query->get());
    }

    /**
     * Get a specific student finance card
     */
    public function showStudentFinance($id)
    {
        $finance = StudentFinance::with([
            'student.user', 
            'student.classe.filiere',
            'student.classe.academicLevel',
            'installments',
            'studentDiscounts.discount',
            'scholarships'
        ])->findOrFail($id);

        $currentUser = auth()->guard('api')->user();
        if ($currentUser->role->name === 'Student' && $finance->student->user_id !== $currentUser->id) {
            return response()->json(['message' => 'Forbidden Access'], 403);
        }

        return response()->json($finance);
    }

    /**
     * Get active student finance for current logged-in student
     */
    public function myFinance()
    {
        $currentUser = auth()->guard('api')->user();
        if (!$currentUser->student) {
            return response()->json(['message' => 'Student record not found'], 404);
        }

        $finance = StudentFinance::with([
            'student.user',
            'student.classe.filiere',
            'student.classe.academicLevel',
            'installments',
            'studentDiscounts.discount',
            'scholarships'
        ])
        ->where('student_id', $currentUser->student->id)
        ->where('academic_year', '2025-2026')
        ->first();

        if (!$finance) {
            // Auto-create initial record if missing
            $tuitionConfig = TuitionFee::where('academic_level_id', $currentUser->student->classe?->academic_level_id)
                ->where('filiere_id', $currentUser->student->classe?->filiere_id)
                ->first();

            $finance = StudentFinance::create([
                'student_id' => $currentUser->student->id,
                'tuition_fee_id' => $tuitionConfig?->id,
                'academic_year' => '2025-2026',
                'base_tuition' => $tuitionConfig?->base_amount ?? 6500.00,
                'registration_fee' => $tuitionConfig?->registration_fee ?? 300.00,
                'administrative_fee' => $tuitionConfig?->administrative_fee ?? 150.00,
                'total_due' => ($tuitionConfig?->base_amount ?? 6500.00) + ($tuitionConfig?->registration_fee ?? 300.00) + ($tuitionConfig?->administrative_fee ?? 150.00),
                'financial_status' => 'Unpaid'
            ]);
            
            $this->calculator->recalculate($finance);
        }

        return response()->json($finance);
    }

    /**
     * Save/Create a payment
     */
    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'sometimes|in:cash,bank_transfer,check,online',
            'transaction_reference' => 'nullable|string',
            'proof' => 'nullable|file|mimes:jpeg,png,pdf|max:4096',
            'installment_id' => 'nullable|exists:installments,id',
            'date' => 'required|date',
            'due_date' => 'nullable|date',
            'details' => 'nullable|string',
            'amount_due' => 'nullable|numeric',
            'amount_paid' => 'nullable|numeric',
            'status' => 'nullable|string',
            'promotion_percentage' => 'nullable|numeric|min:0|max:100',
            'promotion_amount' => 'nullable|numeric|min:0',
        ]);

        $currentUser = auth()->guard('api')->user();
        
        // Handle file upload for proof
        $proofPath = null;
        if ($request->hasFile('proof')) {
            $proofPath = $request->file('proof')->store('payment_proofs', 'public');
        }

        $isAdminOrFinance = in_array($currentUser->role->name, ['Admin', 'Finance Officer']);
        
        $paymentData = [
            'student_id' => $request->student_id,
            'amount' => $request->amount,
            'payment_method' => $request->payment_method ?? 'cash',
            'transaction_reference' => $request->transaction_reference,
            'proof_file_path' => $proofPath,
            'is_validated' => $isAdminOrFinance, // Auto-validated if recorded by Admin/Finance
            'validated_by' => $isAdminOrFinance ? $currentUser->id : null,
            'installment_id' => $request->installment_id,
            'date' => $request->date,
            'due_date' => $request->due_date,
            'details' => $request->details,
            'amount_due' => $request->amount_due,
            'amount_paid' => $request->amount_paid,
            'status' => $request->status,
            'promotion_percentage' => $request->promotion_percentage,
            'promotion_amount' => $request->promotion_amount,
        ];

        try {
            $payment = $this->paymentService->recordPayment($paymentData);
            return response()->json($payment, 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Get a payment details
     */
    public function show(Payment $payment)
    {
        return response()->json($payment->load(['student.user', 'student.classe', 'invoices']));
    }

    /**
     * List all pending payments proof awaiting validation
     */
    public function pendingPayments()
    {
        $this->validateRole(['Admin', 'Finance Officer']);

        $pending = Payment::where('is_validated', false)
            ->with(['student.user', 'student.classe', 'installment', 'invoices'])
            ->orderBy('created_at')
            ->get();

        return response()->json($pending);
    }

    /**
     * Validate a payment
     */
    public function validatePayment($id)
    {
        $this->validateRole(['Admin', 'Finance Officer']);

        $payment = Payment::findOrFail($id);
        $currentUser = auth()->guard('api')->user();

        try {
            $validatedPayment = $this->paymentService->validatePayment($payment, $currentUser->id);
            return response()->json($validatedPayment);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Reject a payment
     */
    public function rejectPayment($id)
    {
        $this->validateRole(['Admin', 'Finance Officer']);

        $payment = Payment::findOrFail($id);

        try {
            $this->paymentService->rejectPayment($payment);
            return response()->json(['message' => 'Paiement rejeté et supprimé.']);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Edit student financial status (ex: apply administrative block)
     */
    public function updateStudentFinanceStatus(Request $request, $id)
    {
        $this->validateRole(['Admin', 'Finance Officer']);

        $request->validate([
            'financial_status' => 'required|in:Paid,Partially Paid,Unpaid,Overdue,Administrative Block',
            'is_redoublant' => 'sometimes|boolean',
            'redoublant_discount_percentage' => 'sometimes|numeric|min:0|max:100',
        ]);

        $finance = StudentFinance::findOrFail($id);
        
        $payload = $request->only(['financial_status']);
        if ($request->has('is_redoublant')) {
            $payload['is_redoublant'] = $request->is_redoublant;
            $payload['redoublant_discount_percentage'] = $request->redoublant_discount_percentage ?? 0.00;
        }

        $finance->update($payload);
        
        // Recalculate totals
        $this->calculator->recalculate($finance);

        return response()->json($finance->fresh(['student.user', 'installments']));
    }

    /**
     * Add a manual discount to student finance card
     */
    public function addDiscount(Request $request, $id)
    {
        $this->validateRole(['Admin', 'Finance Officer']);

        $request->validate([
            'discount_id' => 'required|exists:discounts,id',
        ]);

        $finance = StudentFinance::findOrFail($id);
        $discount = Discount::findOrFail($request->discount_id);

        // Check if already applied
        $exists = StudentDiscount::where('student_finance_id', $finance->id)
            ->where('discount_id', $discount->id)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Cette remise est déjà appliquée.'], 422);
        }

        // Calculate applied amount
        $appliedAmount = 0.00;
        if ($discount->type === 'Percentage') {
            $appliedAmount = round($finance->base_tuition * (((float) $discount->value) / 100), 2);
        } else {
            $appliedAmount = (float) $discount->value;
        }

        StudentDiscount::create([
            'student_finance_id' => $finance->id,
            'discount_id' => $discount->id,
            'applied_amount' => $appliedAmount
        ]);

        $this->calculator->recalculate($finance);

        return response()->json($finance->fresh(['student.user', 'studentDiscounts.discount']));
    }

    /**
     * Remove applied discount
     */
    public function removeDiscount($financeId, $discountId)
    {
        $this->validateRole(['Admin', 'Finance Officer']);

        $applied = StudentDiscount::where('student_finance_id', $financeId)
            ->where('discount_id', $discountId)
            ->firstOrFail();

        $applied->delete();

        $finance = StudentFinance::findOrFail($financeId);
        $this->calculator->recalculate($finance);

        return response()->json($finance->fresh(['student.user', 'studentDiscounts.discount']));
    }

    /**
     * Add a scholarship
     */
    public function addScholarship(Request $request, $id)
    {
        $this->validateRole(['Admin', 'Finance Officer']);

        $request->validate([
            'amount' => 'required|numeric|min:0',
            'provider' => 'required|string',
            'details' => 'nullable|string',
        ]);

        $finance = StudentFinance::findOrFail($id);

        Scholarship::create([
            'student_finance_id' => $finance->id,
            'amount' => $request->amount,
            'provider' => $request->provider,
            'details' => $request->details
        ]);

        $this->calculator->recalculate($finance);

        return response()->json($finance->fresh(['student.user', 'scholarships']));
    }

    /**
     * Remove a scholarship
     */
    public function removeScholarship($financeId, $scholarshipId)
    {
        $this->validateRole(['Admin', 'Finance Officer']);

        $scholarship = Scholarship::where('student_finance_id', $financeId)
            ->where('id', $scholarshipId)
            ->firstOrFail();

        $scholarship->delete();

        $finance = StudentFinance::findOrFail($financeId);
        $this->calculator->recalculate($finance);

        return response()->json($finance->fresh(['student.user', 'scholarships']));
    }

    /**
     * Manage global tuition fees configs
     */
    public function tuitionFeesList()
    {
        $this->validateRole(['Admin', 'Finance Officer']);
        return response()->json(TuitionFee::with(['academicLevel', 'filiere'])->get());
    }

    public function storeTuitionFee(Request $request)
    {
        $this->validateRole(['Admin', 'Finance Officer']);

        $request->validate([
            'academic_level_id' => 'required|exists:academic_levels,id',
            'filiere_id' => 'nullable|exists:filieres,id',
            'academic_year' => 'required|string',
            'base_amount' => 'required|numeric|min:0',
            'registration_fee' => 'required|numeric|min:0',
            'administrative_fee' => 'required|numeric|min:0',
            'installments_count' => 'required|integer|min:1|max:10',
        ]);

        $config = TuitionFee::updateOrCreate(
            [
                'academic_level_id' => $request->academic_level_id,
                'filiere_id' => $request->filiere_id,
                'academic_year' => $request->academic_year
            ],
            $request->only(['base_amount', 'registration_fee', 'administrative_fee', 'installments_count'])
        );

        return response()->json($config->load(['academicLevel', 'filiere']), 201);
    }

    /**
     * Manage global discounts configurations
     */
    public function discountsList()
    {
        return response()->json(Discount::all());
    }

    public function storeDiscount(Request $request)
    {
        $this->validateRole(['Admin', 'Finance Officer']);

        $request->validate([
            'name' => 'required|string',
            'code' => 'required|string|unique:discounts,code',
            'type' => 'required|in:Percentage,Fixed',
            'value' => 'required|numeric|min:0',
            'is_cumulative' => 'required|boolean',
            'is_automatic' => 'required|boolean',
        ]);

        $discount = Discount::create($request->all());

        return response()->json($discount, 201);
    }

    /**
     * Receipt detail (keep backward compatibility)
     */
    public function receipt(Payment $payment)
    {
        return response()->json([
            'receipt_number' => $payment->receipt_number,
            'student' => $payment->load('student.user', 'student.classe')->student,
            'amount_due' => $payment->amount_due ?? $payment->amount,
            'amount_paid' => $payment->amount_paid ?? $payment->amount,
            'promotion_percentage' => $payment->promotion_percentage ?? 0,
            'promotion_amount' => $payment->promotion_amount ?? 0,
            'status' => $payment->status,
            'date' => $payment->date,
            'details' => $payment->invoices()->latest()->first()?->details ?? 'Frais de scolarité',
            'payment_method' => $payment->payment_method,
            'transaction_reference' => $payment->transaction_reference,
            'installment_number' => $payment->installment?->installment_number ?? 1,
            'total_due_ledger' => $payment->student?->studentFinances()->latest()->first()?->total_due ?? $payment->amount_due
        ]);
    }

    /**
     * Delete a payment
     */
    public function destroy(Payment $payment)
    {
        $this->validateRole(['Admin', 'Finance Officer']);
        
        $installment = $payment->installment;
        $payment->delete();

        // Recalculate
        if ($installment) {
            $installment->update([
                'amount_paid' => $installment->payments()->where('is_validated', true)->sum('amount'),
                'status' => 'Unpaid' // will adjust on recalculation
            ]);
            $finance = $installment->studentFinance;
            if ($finance) {
                $this->calculator->updateFinancialStatus($finance);
            }
        }

        return response()->json(['message' => 'Payment deleted successfully']);
    }

    /**
     * Validate role helper
     */
    private function validateRole(array $roles)
    {
        $user = auth()->guard('api')->user();
        if (!$user || !$user->role || !in_array($user->role->name, $roles)) {
            abort(response()->json(['message' => 'Forbidden Access'], 403));
        }
    }
}
