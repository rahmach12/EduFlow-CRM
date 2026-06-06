<?php

namespace App\Services;

use App\Models\StudentFinance;
use App\Models\Discount;
use App\Models\Installment;
use App\Models\StudentDiscount;
use App\Models\Student;
use Carbon\Carbon;

class FinancialCalculationService
{
    /**
     * Recalculate everything for a student's academic finance file
     */
    public function recalculate(StudentFinance $finance): StudentFinance
    {
        $baseTuition = (float) $finance->base_tuition;
        $registrationFee = (float) $finance->registration_fee;
        $administrativeFee = (float) $finance->administrative_fee;

        $totalDiscount = 0.00;
        $totalScholarship = 0.00;

        // 1. Redoublant discount (applied to base tuition)
        if ($finance->is_redoublant && $finance->redoublant_discount_percentage > 0) {
            $totalDiscount += round($baseTuition * (((float) $finance->redoublant_discount_percentage) / 100), 2);
        }

        // 2. Fetch all applied discounts via student_discounts relation
        $appliedDiscounts = $finance->studentDiscounts()->with('discount')->get();
        
        // Sibling auto-discount check
        $hasSiblingDiscount = $appliedDiscounts->contains(function ($sd) {
            return $sd->discount?->code === 'DISC_FRATRIE';
        });

        // If not already applied, check if we should auto-apply the sibling discount
        if (!$hasSiblingDiscount && !$finance->is_redoublant) {
            $student = $finance->student;
            if ($student && $student->user) {
                $lastName = $student->user->last_name;
                $siblingExists = Student::whereHas('user', function ($q) use ($lastName, $student) {
                    $q->where('last_name', $lastName)
                      ->where('id', '!=', $student->user_id);
                })->exists();

                if ($siblingExists) {
                    $siblingDiscount = Discount::where('code', 'DISC_FRATRIE')->first();
                    if ($siblingDiscount) {
                        $appliedAmount = round($baseTuition * (((float) $siblingDiscount->value) / 100), 2);
                        
                        // Create StudentDiscount link
                        StudentDiscount::create([
                            'student_finance_id' => $finance->id,
                            'discount_id' => $siblingDiscount->id,
                            'applied_amount' => $appliedAmount
                        ]);

                        // Refresh relation
                        $appliedDiscounts = $finance->studentDiscounts()->with('discount')->get();
                    }
                }
            }
        }

        // 3. Process cumulative logic
        // Rule: If a discount is NOT cumulative (e.g. Bourse Excellence), it overrides all other discounts unless cumulative rules allow it.
        $nonCumulativeDiscounts = $appliedDiscounts->filter(fn($sd) => !$sd->discount?->is_cumulative);
        $cumulativeDiscounts = $appliedDiscounts->filter(fn($sd) => $sd->discount?->is_cumulative);

        if ($nonCumulativeDiscounts->isNotEmpty()) {
            // Apply the largest non-cumulative discount only, ignore cumulative ones
            $bestNonCumulative = $nonCumulativeDiscounts->sortByDesc('applied_amount')->first();
            
            // If it is a percentage or fixed, apply it
            $totalDiscount = (float) $bestNonCumulative->applied_amount;
        } else {
            // Sum all cumulative discounts
            foreach ($cumulativeDiscounts as $sd) {
                $totalDiscount += (float) $sd->applied_amount;
            }
            // Add redoublant if it was calculated
            if ($finance->is_redoublant && $finance->redoublant_discount_percentage > 0) {
                // Already added to $totalDiscount in step 1
            }
        }

        // 4. Calculate scholarships (Bourses)
        $totalScholarship = (float) $finance->scholarships()->sum('amount');

        // Net Due calculation
        $totalDue = ($baseTuition + $registrationFee + $administrativeFee) - ($totalDiscount + $totalScholarship);
        if ($totalDue < 0) {
            $totalDue = 0.00;
        }

        // 5. Update finance record totals
        $finance->update([
            'total_discount' => $totalDiscount,
            'total_scholarship' => $totalScholarship,
            'total_due' => $totalDue,
        ]);

        // 6. Regenerate or adjust installments (Tranches)
        $this->adjustInstallments($finance);

        // 7. Update status based on payment progress
        $this->updateFinancialStatus($finance);

        return $finance->fresh(['installments', 'studentDiscounts.discount', 'scholarships']);
    }

    /**
     * Adjust the 3 installments based on the total net due amount
     */
    private function adjustInstallments(StudentFinance $finance): void
    {
        $installments = $finance->installments()->orderBy('installment_number')->get();
        $totalDue = (float) $finance->total_due;

        if ($installments->count() === 0) {
            // Create default 3 installments
            $installmentAmount = round($totalDue / 3, 2);
            $dueDates = [
                Carbon::now()->addDays(30), // Tranche 1
                Carbon::now()->addMonths(3), // Tranche 2
                Carbon::now()->addMonths(6), // Tranche 3
            ];

            for ($i = 1; $i <= 3; $i++) {
                Installment::create([
                    'student_finance_id' => $finance->id,
                    'installment_number' => $i,
                    'amount' => $i === 3 ? ($totalDue - ($installmentAmount * 2)) : $installmentAmount,
                    'due_date' => $dueDates[$i - 1],
                    'amount_paid' => 0.00,
                    'status' => 'Unpaid',
                ]);
            }
        } else {
            // Recalculate existing installments proportionally
            $installmentAmount = round($totalDue / 3, 2);
            foreach ($installments as $idx => $inst) {
                $i = $idx + 1;
                $newAmount = $i === 3 ? ($totalDue - ($installmentAmount * 2)) : $installmentAmount;
                
                // Keep installment paid status intact if already paid
                $status = $inst->status;
                if ($inst->amount_paid >= $newAmount) {
                    $status = 'Paid';
                } elseif ($inst->amount_paid > 0) {
                    $status = 'Partially Paid';
                } else {
                    $status = $inst->due_date->isPast() ? 'Overdue' : 'Unpaid';
                }

                $inst->update([
                    'amount' => $newAmount,
                    'status' => $status,
                ]);
            }
        }
    }

    /**
     * Determine and save the global financial status of the student
     */
    public function updateFinancialStatus(StudentFinance $finance): void
    {
        $finance->refresh();
        $totalDue = (float) $finance->total_due;
        
        // Sum validated payments
        $totalPaid = (float) $finance->installments()->sum('amount_paid');
        
        // Check if there are overdue installments
        $hasOverdue = $finance->installments()->where('status', 'Overdue')->exists();

        $status = 'Unpaid';
        if ($totalPaid >= $totalDue && $totalDue > 0) {
            $status = 'Paid';
        } elseif ($totalPaid > 0) {
            $status = $hasOverdue ? 'Overdue' : 'Partially Paid';
        } else {
            $status = $hasOverdue ? 'Overdue' : 'Unpaid';
        }

        // Preserve administrative block if already applied
        if ($finance->financial_status === 'Administrative Block') {
            $status = 'Administrative Block';
        }

        $finance->update([
            'total_paid' => $totalPaid,
            'financial_status' => $status,
        ]);
    }
}
