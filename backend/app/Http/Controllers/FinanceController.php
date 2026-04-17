<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Payment;
use App\Models\Invoice;

class FinanceController extends Controller
{
    public function index(Request $request)
    {
        $query = Payment::with(['student.user', 'invoices']);
        
        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'amount' => 'required|numeric|min:0',
            'date' => 'required|date',
            'status' => 'required|in:Payé,Impayé,Partiellement payé',
            'details' => 'nullable|string'
        ]);

        $payment = Payment::create($request->only('student_id', 'amount', 'date', 'status'));

        if ($request->has('details')) {
            Invoice::create([
                'payment_id' => $payment->id,
                'details' => $request->details
            ]);
        }

        return response()->json($payment->load('student.user', 'invoices'), 201);
    }

    public function show(Payment $payment)
    {
        return response()->json($payment->load('student.user', 'invoices'));
    }

    public function update(Request $request, Payment $payment)
    {
        $request->validate([
            'amount' => 'sometimes|numeric|min:0',
            'date' => 'sometimes|date',
            'status' => 'sometimes|in:Payé,Impayé,Partiellement payé'
        ]);

        $payment->update($request->all());

        return response()->json($payment);
    }

    public function destroy(Payment $payment)
    {
        $payment->delete();
        return response()->json(['message' => 'Payment deleted successfully']);
    }
}
