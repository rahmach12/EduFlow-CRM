<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Models\StudentFinance;
use App\Models\Payment;
use Illuminate\Support\Str;

class KonnectController extends Controller
{
    private $walletKey;
    private $apiKey;
    private $baseUrl;

    public function __construct()
    {
        // For development, we use the sandbox environment
        $this->baseUrl = env('KONNECT_BASE_URL', 'https://api.preprod.konnect.network/api/v2');
        $this->walletKey = env('KONNECT_WALLET_KEY', 'sandbox_wallet_key');
        $this->apiKey = env('KONNECT_API_KEY', 'sandbox_api_key');
    }

    public function initPayment(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'student_id' => 'required|exists:students,id',
            'finance_id' => 'required|exists:student_finances,id',
        ]);

        $amount = $request->amount;
        // Konnect expects amount in millimes for TND (amount * 1000)
        $amountInMillimes = $amount * 1000;
        
        $orderId = (string) Str::uuid();

        // 1. Create a Pending Payment record in database
        $payment = Payment::create([
            'student_id' => $request->student_id,
            'amount' => $amount,
            'payment_date' => now(),
            'method' => 'Konnect',
            'status' => 'Pending',
            'transaction_id' => $orderId,
            'recorded_by' => auth()->id() ?? 1,
        ]);

        // 2. Call Konnect API to initialize payment
        try {
            $response = Http::withHeaders([
                'x-api-key' => $this->apiKey
            ])->post($this->baseUrl . '/payments/init-payment', [
                'receiverWalletId' => $this->walletKey,
                'token' => 'TND',
                'amount' => $amountInMillimes,
                'type' => 'immediate',
                'description' => 'Frais de scolarité',
                'acceptedPaymentMethods' => ['wallet', 'bank_card', 'e-dinar'],
                'lifespan' => 30, // 30 minutes
                'checkoutForm' => true,
                'addPaymentFeesToAmount' => true,
                'orderId' => $payment->id,
                'webhook' => url('/api/konnect/webhook'),
                'silentWebhook' => true,
                'successUrl' => url('/api/konnect/success?payment_id=' . $payment->id),
                'failUrl' => url('/api/konnect/fail?payment_id=' . $payment->id),
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return response()->json([
                    'payUrl' => $data['payUrl'],
                    'paymentRef' => $data['paymentRef']
                ]);
            }

            return response()->json(['error' => 'Failed to initialize payment with Konnect', 'details' => $response->json()], 500);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Exception occurred', 'message' => $e->getMessage()], 500);
        }
    }

    public function handleWebhook(Request $request)
    {
        $paymentRef = $request->input('paymentRef');
        
        if (!$paymentRef) {
            return response()->json(['error' => 'Missing paymentRef'], 400);
        }

        // Verify payment status with Konnect
        $response = Http::withHeaders([
            'x-api-key' => $this->apiKey
        ])->get($this->baseUrl . '/payments/' . $paymentRef);

        if ($response->successful()) {
            $data = $response->json();
            $status = $data['payment']['status'];
            $orderId = $data['payment']['orderId'];

            $payment = Payment::find($orderId);
            
            if ($payment) {
                if ($status === 'completed') {
                    $payment->status = 'Completed';
                    $payment->save();

                    // Automatically update Student Finance status and calculate
                    $finance = StudentFinance::where('student_id', $payment->student_id)
                        ->where('is_active', true)
                        ->first();
                    
                    if ($finance) {
                        $finance->paid_amount += $payment->amount;
                        $finance->remaining_balance = max(0, $finance->net_tuition - $finance->paid_amount);
                        
                        if ($finance->remaining_balance == 0) {
                            $finance->financial_status = 'Paid';
                        } else {
                            $finance->financial_status = 'Partial';
                        }
                        
                        $finance->save();
                    }
                } else if ($status === 'failed') {
                    $payment->status = 'Failed';
                    $payment->save();
                }
            }
        }

        return response()->json(['status' => 'success']);
    }
}
