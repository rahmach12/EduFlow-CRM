<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AcademicLevel;
use App\Models\Filiere;
use App\Models\Classe;
use App\Models\Student;
use App\Models\User;
use App\Models\TuitionFee;
use App\Models\Discount;
use App\Models\StudentFinance;
use App\Models\Installment;
use App\Models\StudentDiscount;
use App\Models\Scholarship;
use App\Models\Payment;
use Carbon\Carbon;

class AcademicFinanceSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed global discounts config
        $discounts = [
            [
                'name' => 'Remise Fratrie (Frère/Sœur)',
                'code' => 'DISC_FRATRIE',
                'type' => 'Percentage',
                'value' => 10.00, // 10%
                'is_cumulative' => true,
                'is_automatic' => true
            ],
            [
                'name' => 'Remise Majeur de Promotion',
                'code' => 'DISC_MAJOR',
                'type' => 'Percentage',
                'value' => 15.00, // 15%
                'is_cumulative' => true,
                'is_automatic' => false
            ],
            [
                'name' => 'Remise Paiement Comptant (Cash)',
                'code' => 'DISC_CASH',
                'type' => 'Percentage',
                'value' => 5.00, // 5%
                'is_cumulative' => true,
                'is_automatic' => true
            ],
            [
                'name' => 'Bourse Excellence Académique',
                'code' => 'DISC_BOURSE_EXC',
                'type' => 'Percentage',
                'value' => 50.00, // 50%
                'is_cumulative' => false,
                'is_automatic' => false
            ],
            [
                'name' => 'Partenariat Lycée / Scolaire',
                'code' => 'DISC_PARTNER',
                'type' => 'Fixed',
                'value' => 500.00, // 500 TND
                'is_cumulative' => true,
                'is_automatic' => false
            ]
        ];

        $discountModels = [];
        foreach ($discounts as $d) {
            $discountModels[$d['code']] = Discount::firstOrCreate(['code' => $d['code']], $d);
        }

        // 2. Seed tuition fees rates for academic levels and filieres
        $levels = AcademicLevel::all();
        $filieres = Filiere::all();

        $tuitionFeeConfigs = [];

        foreach ($levels as $level) {
            // Base tuition fee depending on cycle
            $baseAmount = 6000.00; // Default
            if (str_contains(strtolower($level->cycle), 'licence')) {
                $baseAmount = 6500.00;
            } elseif (str_contains(strtolower($level->cycle), 'ingénieur') || str_contains(strtolower($level->cycle), 'cycle')) {
                $baseAmount = 7800.00;
            } elseif (str_contains(strtolower($level->cycle), 'master')) {
                $baseAmount = 8500.00;
            } elseif (str_contains(strtolower($level->cycle), 'prépa')) {
                $baseAmount = 5500.00;
            }

            foreach ($filieres as $filiere) {
                // Slightly adjust by filiere
                $filiereAdjustment = 0;
                if ($filiere->code === 'BD') {
                    $filiereAdjustment = 400.00;
                } elseif ($filiere->code === 'IA') {
                    $filiereAdjustment = 500.00;
                } elseif ($filiere->code === 'GL') {
                    $filiereAdjustment = 200.00;
                }

                $tuitionFeeConfigs[] = TuitionFee::firstOrCreate(
                    [
                        'academic_level_id' => $level->id,
                        'filiere_id' => $filiere->id,
                        'academic_year' => '2025-2026'
                    ],
                    [
                        'base_amount' => $baseAmount + $filiereAdjustment,
                        'registration_fee' => 300.00,
                        'administrative_fee' => 150.00,
                        'installments_count' => 3
                    ]
                );
            }
        }

        // 3. For each student, set up their finance record
        $students = Student::with('user', 'classe')->get();
        
        // Sibling detection by user last name
        $lastNames = $students->map(fn($s) => $s->user?->last_name)->filter()->toArray();
        $lastNameCounts = array_count_values($lastNames);

        foreach ($students as $idx => $student) {
            // Find appropriate tuition fee config
            $class = $student->classe;
            if (!$class) continue;

            $tuitionConfig = TuitionFee::where('academic_level_id', $class->academic_level_id)
                ->where('filiere_id', $class->filiere_id)
                ->first();

            // Fallback to any configuration if exact class levels not matched
            if (!$tuitionConfig) {
                $tuitionConfig = TuitionFee::first() ?? TuitionFee::create([
                    'academic_level_id' => $class->academic_level_id ?? AcademicLevel::first()->id,
                    'filiere_id' => $class->filiere_id ?? Filiere::first()->id,
                    'academic_year' => '2025-2026',
                    'base_amount' => 6500.00,
                    'registration_fee' => 300.00,
                    'administrative_fee' => 150.00,
                    'installments_count' => 3
                ]);
            }

            // Student properties
            $isRedoublant = ($idx % 5 === 0); // 20% redoublants
            $redoublantDiscount = $isRedoublant ? 30.00 : 0.00; // 30% off for redoublants

            $baseTuition = $tuitionConfig->base_amount;
            $regFee = $tuitionConfig->registration_fee;
            $adminFee = $tuitionConfig->administrative_fee;

            // Initialize calculations
            $totalDiscount = 0.00;
            $totalScholarship = 0.00;

            // Apply redoublant discount
            if ($isRedoublant) {
                $totalDiscount += round($baseTuition * ($redoublantDiscount / 100), 2);
            }

            // Apply sibling discount if applicable
            $hasSibling = ($lastNameCounts[$student->user?->last_name] ?? 0) > 1;
            $siblingApplied = false;
            if ($hasSibling && !$isRedoublant) {
                $siblingDiscount = $discountModels['DISC_FRATRIE'];
                $totalDiscount += round($baseTuition * ($siblingDiscount->value / 100), 2);
                $siblingApplied = true;
            }

            // Apply random excellence scholarship to index 2 and 7
            $hasScholarship = ($idx === 2 || $idx === 7);
            if ($hasScholarship) {
                $totalScholarship += round($baseTuition * 0.50, 2); // 50% bourse
            }

            $totalDue = ($baseTuition + $regFee + $adminFee) - ($totalDiscount + $totalScholarship);
            
            // Create the student finance account
            $finance = StudentFinance::firstOrCreate(
                [
                    'student_id' => $student->id,
                    'academic_year' => '2025-2026'
                ],
                [
                    'tuition_fee_id' => $tuitionConfig->id,
                    'base_tuition' => $baseTuition,
                    'registration_fee' => $regFee,
                    'administrative_fee' => $adminFee,
                    'total_discount' => $totalDiscount,
                    'total_scholarship' => $totalScholarship,
                    'total_due' => $totalDue,
                    'total_paid' => 0.00,
                    'is_redoublant' => $isRedoublant,
                    'redoublant_discount_percentage' => $redoublantDiscount,
                    'financial_status' => 'Unpaid'
                ]
            );

            // Record Applied Sibling Discount in pivot table
            if ($siblingApplied) {
                StudentDiscount::create([
                    'student_finance_id' => $finance->id,
                    'discount_id' => $discountModels['DISC_FRATRIE']->id,
                    'applied_amount' => round($baseTuition * (10.00 / 100), 2)
                ]);
            }

            // Record Applied Scholarship
            if ($hasScholarship) {
                Scholarship::create([
                    'student_finance_id' => $finance->id,
                    'amount' => round($baseTuition * 0.50, 2),
                    'provider' => 'Ministère de l\'Enseignement Supérieur',
                    'details' => 'Bourse d\'excellence nationale pour mérite universitaire.'
                ]);
            }

            // 4. Create 3 installments (échéances)
            $installmentAmount = round($totalDue / 3, 2);
            $dueDates = [
                Carbon::now()->addDays(-20), // Tranche 1 (déjà due)
                Carbon::now()->addMonths(2),  // Tranche 2
                Carbon::now()->addMonths(5)   // Tranche 3
            ];

            $installments = [];
            for ($i = 1; $i <= 3; $i++) {
                $installments[$i] = Installment::create([
                    'student_finance_id' => $finance->id,
                    'installment_number' => $i,
                    'amount' => $i === 3 ? ($totalDue - ($installmentAmount * 2)) : $installmentAmount,
                    'due_date' => $dueDates[$i - 1],
                    'amount_paid' => 0.00,
                    'status' => 'Unpaid',
                    'penalty_amount' => 0.00
                ]);
            }

            // 5. Seed some payments to make it look realistic
            // Let's check: did they pay the registration + tranche 1?
            if ($idx % 3 === 0) {
                // fully paid Tranche 1
                $payAmt = $installments[1]->amount;
                $installments[1]->update([
                    'amount_paid' => $payAmt,
                    'status' => 'Paid',
                    'paid_at' => Carbon::now()->addDays(-22)
                ]);
                $finance->update([
                    'total_paid' => $payAmt,
                    'financial_status' => 'Partially Paid'
                ]);

                Payment::create([
                    'student_id' => $student->id,
                    'amount' => $payAmt,
                    'amount_due' => $payAmt,
                    'amount_paid' => $payAmt,
                    'date' => Carbon::now()->addDays(-22)->toDateString(),
                    'status' => 'Paid',
                    'receipt_number' => 'RCPT-' . now()->format('Ymd') . '-' . rand(100000, 999999),
                    'paid_at' => Carbon::now()->addDays(-22),
                    'payment_method' => 'cash',
                    'is_validated' => true,
                    'installment_id' => $installments[1]->id
                ]);
            } elseif ($idx % 3 === 1) {
                // Partially Paid Tranche 1
                $payAmt = round($installments[1]->amount / 2, 2);
                $installments[1]->update([
                    'amount_paid' => $payAmt,
                    'status' => 'Partially Paid'
                ]);
                $finance->update([
                    'total_paid' => $payAmt,
                    'financial_status' => 'Partially Paid'
                ]);

                Payment::create([
                    'student_id' => $student->id,
                    'amount' => $payAmt,
                    'amount_due' => $installments[1]->amount,
                    'amount_paid' => $payAmt,
                    'date' => Carbon::now()->addDays(-15)->toDateString(),
                    'status' => 'Partially Paid',
                    'receipt_number' => 'RCPT-' . now()->format('Ymd') . '-' . rand(100000, 999999),
                    'paid_at' => Carbon::now()->addDays(-15),
                    'payment_method' => 'bank_transfer',
                    'transaction_reference' => 'TXN' . rand(10000000, 99999999),
                    'is_validated' => true,
                    'installment_id' => $installments[1]->id
                ]);
            } else {
                // Unpaid / Overdue
                // Check if date limits passed, apply overdue status
                if ($installments[1]->due_date->isPast()) {
                    $installments[1]->update([
                        'status' => 'Overdue',
                        'penalty_amount' => 50.00 // 50 TND penalty
                    ]);
                    $finance->update([
                        'total_due' => $finance->total_due + 50.00,
                        'financial_status' => 'Overdue'
                    ]);
                }
            }
        }
    }
}
