import React, { useState, useEffect } from 'react';
import api from '../lib/axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, DollarSign, Download, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import classNames from 'classnames';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

const AdminFinanceView = () => {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Payé',
    details: ''
  });

  const fetchData = async () => {
    try {
      const [paymentsRes, studentsRes] = await Promise.all([
        api.get('/payments'),
        api.get('/students')
      ]);
      setPayments(paymentsRes.data);
      setStudents(studentsRes.data);
    } catch (error) {
      toast.error("Failed to load financial records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = () => {
    setFormData({ 
      student_id: '', amount: '', date: new Date().toISOString().split('T')[0], status: 'Payé', details: '' 
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/payments', formData);
      toast.success("Payment recorded successfully!");
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to record payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPayments = payments.filter(payment => 
    payment.student?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch(status) {
      case 'Payé': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'Impayé': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      case 'Partiellement payé': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      default: return 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300';
    }
  };

  const generateInvoicePDF = (payment) => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(108, 92, 231); // primary color
    doc.text("EduFlow CRM - Facture", 14, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Reçu N°: INV-${payment.id.toString().padStart(4, '0')}`, 14, 30);
    doc.text(`Date: ${payment.date}`, 14, 38);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text("Informations Étudiant:", 14, 50);
    doc.setFontSize(12);
    doc.text(`Nom: ${payment.student?.user?.first_name || ''} ${payment.student?.user?.last_name || ''}`, 14, 58);
    
    doc.autoTable({
      startY: 70,
      head: [['Détails', 'Statut', 'Montant (TND)']],
      body: [
        [payment.invoices?.[0]?.details || 'Frais de scolarité', payment.status, payment.amount]
      ],
      headStyles: { fillColor: [108, 92, 231] },
    });
    
    doc.save(`Facture_${payment.student?.user?.first_name || 'etudiant'}_${payment.id}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Financial Management</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Track student tuition fees, invoices, and payments.</p>
        </div>
        <button 
          onClick={openModal}
          className="flex items-center justify-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Record Payment
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 shadow rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="relative max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-primary focus:border-primary text-sm transition-colors"
              placeholder="Search by student or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Student
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-slate-500">Loading payments...</td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-slate-500">No payment records found</td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs">
                          {payment.student?.user?.name?.charAt(0) || '?'}
                        </div>
                        <div className="ml-3 text-sm font-medium text-slate-900 dark:text-white">
                          {payment.student?.user?.name || 'Unknown Student'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white font-medium flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-slate-400" />
                      {payment.amount} TND
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {payment.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={classNames('px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full', getStatusColor(payment.status))}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => generateInvoicePDF(payment)} className="text-primary hover:text-primary/80">
                        View Invoice
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Record New Payment"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Student *</label>
            <select 
              required name="student_id" value={formData.student_id} onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
            >
              <option value="">Select a student...</option>
              {students.map(std => (
                <option key={std.id} value={std.id}>{std.user?.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount (TND) *</label>
              <input 
                required type="number" step="0.01" name="amount" value={formData.amount} onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date *</label>
              <input 
                required type="date" name="date" value={formData.date} onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status *</label>
            <select 
              required name="status" value={formData.status} onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
            >
              <option value="Payé">Payé</option>
              <option value="Partiellement payé">Partiellement payé</option>
              <option value="Impayé">Impayé</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Details / Invoice Description</label>
            <textarea 
              name="details" value={formData.details} onChange={handleInputChange} rows="2"
              placeholder="e.g. Inscription 2023-2024"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
            ></textarea>
          </div>
          
          <div className="mt-5 flex justify-end space-x-3">
            <button 
              type="button" onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button 
              type="submit" disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const StudentFinanceView = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyFinance = async () => {
      try {
        const studentId = user?.student?.id;
        if (!studentId) return;
        const res = await api.get(`/payments?student_id=${studentId}`);
        setPayments(res.data);
      } catch (err) {
        toast.error("Échec du chargement des données financières.");
      } finally {
        setLoading(false);
      }
    };
    fetchMyFinance();
  }, [user]);

  const totalPaid = payments.filter(p => p.status === 'Payé').reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
  const totalPending = payments.filter(p => p.status !== 'Payé').reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

  const generateInvoicePDF = (payment) => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(108, 92, 231);
    doc.text("EduFlow CRM - Reçu", 14, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Reçu N°: INV-${payment.id.toString().padStart(4, '0')}`, 14, 30);
    doc.text(`Date: ${payment.date}`, 14, 38);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text("Mes Informations:", 14, 50);
    doc.setFontSize(12);
    doc.text(`Nom: ${user?.first_name || ''} ${user?.last_name || ''}`, 14, 58);
    
    doc.autoTable({
      startY: 70,
      head: [['Désignation', 'Statut', 'Montant (TND)']],
      body: [
        [payment.invoices?.[0]?.details || 'Paiement', payment.status, payment.amount]
      ],
      headStyles: { fillColor: [108, 92, 231] },
    });
    
    doc.save(`Recu_${payment.id}.pdf`);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Payé': return <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> {status}</span>;
      case 'Impayé': return <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {status}</span>;
      default: return <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3"/> {status}</span>;
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-primary" /> Mon Espace Financier
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Consultez vos paiements et factures.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl p-6 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
          <p className="text-white/70 text-xs uppercase tracking-wider font-medium">Total Payé</p>
          <p className="text-4xl font-extrabold mt-2">{totalPaid.toFixed(2)} <span className="text-xl font-normal opacity-70">TND</span></p>
        </div>
        <div className="rounded-2xl p-6 bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg">
           <p className="text-white/70 text-xs uppercase tracking-wider font-medium">Reste à payer</p>
           <p className="text-4xl font-extrabold mt-2">{totalPending.toFixed(2)} <span className="text-xl font-normal opacity-70">TND</span></p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1E1B4B] rounded-2xl border border-slate-100 dark:border-[#2e2a6b] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-[#2e2a6b]">
          <h3 className="font-bold text-slate-800 dark:text-white">Historique des Paiements</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-[#2e2a6b]">
            <thead className="bg-slate-50 dark:bg-[#0F172A]/50">
              <tr>
                {['Montant', 'Date', 'Statut', 'Détails', 'Reçu'].map((h, i) => (
                  <th key={i} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#2e2a6b]">
              {payments.length === 0 ? (
                 <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-400">Aucun paiement enregistré.</td></tr>
              ) : payments.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-[#2e2a6b]/50">
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{p.amount} TND</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{p.date}</td>
                  <td className="px-6 py-4">{getStatusBadge(p.status)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 italic">{p.invoices?.[0]?.details || 'Scolarité'}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => generateInvoicePDF(p)} className="inline-flex items-center text-primary text-sm font-medium hover:underline">
                      <Download className="h-4 w-4 mr-1"/> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const Finance = () => {
  const { user } = useAuth();
  if (user?.role?.name === 'Student') return <StudentFinanceView />;
  return <AdminFinanceView />;
};
