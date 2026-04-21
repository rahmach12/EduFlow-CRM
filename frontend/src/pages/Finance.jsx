import React, { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { CheckCircle, Clock, DollarSign, Download, Plus, Search, Tag, TriangleAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import Modal from '../components/Modal';
import { useAuth } from '../hooks/useAuth';

const STATUS_META = {
  Paid: { label: 'Paye', className: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  'Partially Paid': { label: 'Partiellement paye', className: 'bg-amber-100 text-amber-700', icon: Clock },
  Unpaid: { label: 'Impaye', className: 'bg-rose-100 text-rose-700', icon: TriangleAlert },
};

const EMPTY_FORM = {
  student_id: '',
  amount: '',
  amount_due: '',
  amount_paid: '',
  date: new Date().toISOString().split('T')[0],
  due_date: '',
  status: 'Paid',
  promotion_percentage: '',
  details: '',
};

const FinanceOfficerView = () => {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const fetchData = async () => {
    try {
      const [paymentsRes, studentsRes] = await Promise.all([
        api.get('/payments'),
        api.get('/students'),
      ]);
      setPayments(paymentsRes.data);
      setStudents(studentsRes.data);
    } catch {
      toast.error('Chargement des donnees financieres impossible');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredPayments = useMemo(() => payments.filter((payment) => {
    const student = payment.student;
    const haystack = [
      student?.matricule,
      student?.user?.cin,
      student?.user?.first_name,
      student?.user?.last_name,
      payment.status,
      payment.receipt_number,
    ].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(searchTerm.toLowerCase());
  }), [payments, searchTerm]);

  const buildReceipt = async (payment) => {
    const receiptRes = await api.get(`/payments/${payment.id}/receipt`);
    const receipt = receiptRes.data;
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(97, 61, 193);
    doc.text('University CRM - Recu', 14, 18);
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(`Recu: ${receipt.receipt_number}`, 14, 28);
    doc.text(`Date: ${receipt.date}`, 14, 35);
    doc.text(`Etudiant: ${receipt.student?.user?.first_name || ''} ${receipt.student?.user?.last_name || ''}`, 14, 42);
    doc.text(`Matricule: ${receipt.student?.matricule || 'N/A'}`, 14, 49);

    doc.autoTable({
      startY: 58,
      head: [['Designation', 'Montant du', 'Montant paye', 'Promotion', 'Statut']],
      body: [[
        receipt.details || 'Frais universitaires',
        `${receipt.amount_due || 0} TND`,
        `${receipt.amount_paid || 0} TND`,
        `${receipt.promotion_percentage || 0}%`,
        STATUS_META[receipt.status]?.label || receipt.status,
      ]],
      headStyles: { fillColor: [97, 61, 193] },
    });

    return { doc, receipt };
  };

  const downloadReceipt = async (payment) => {
    try {
      const { doc, receipt } = await buildReceipt(payment);
      doc.save(`${receipt.receipt_number}.pdf`);
    } catch {
      toast.error('Generation du recu impossible');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/payments', {
        ...formData,
        promotion_percentage: formData.promotion_percentage || 0,
        amount_due: formData.amount_due || formData.amount,
        amount_paid: formData.amount_paid || formData.amount,
      });
      toast.success('Paiement enregistre');
      setIsModalOpen(false);
      setFormData(EMPTY_FORM);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Enregistrement impossible');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Finance universitaire</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Recherche par matricule, CIN, nom ou prenom. Gestion des promotions et des recus PDF.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Enregistrer un paiement
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <FinanceStat title="Paiements payes" value={payments.filter((payment) => payment.status === 'Paid').length} />
        <FinanceStat title="Paiements partiels" value={payments.filter((payment) => payment.status === 'Partially Paid').length} />
        <FinanceStat title="Promotions appliquees" value={payments.filter((payment) => Number(payment.promotion_percentage) > 0).length} />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="border-b border-slate-100 p-4 dark:border-slate-700">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Rechercher matricule, CIN, nom, prenom..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-primary dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                {['Etudiant', 'Classe', 'Montant', 'Promotion', 'Statut', 'Recu'].map((title) => (
                  <th key={title} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-sm text-slate-500">Chargement...</td></tr>
              ) : filteredPayments.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-sm text-slate-500">Aucun paiement trouve</td></tr>
              ) : filteredPayments.map((payment) => {
                const meta = STATUS_META[payment.status] || STATUS_META.Unpaid;
                const Icon = meta.icon;
                return (
                  <tr key={payment.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">
                        {payment.student?.user?.first_name} {payment.student?.user?.last_name}
                      </p>
                      <p className="text-xs text-slate-400">Matricule: {payment.student?.matricule || 'N/A'} | CIN: {payment.student?.user?.cin || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{payment.student?.classe?.name || '—'}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800 dark:text-white">
                      {payment.amount_paid || payment.amount} / {payment.amount_due || payment.amount} TND
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {Number(payment.promotion_percentage) > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-semibold text-fuchsia-700">
                          <Tag className="h-3 w-3" />
                          {payment.promotion_percentage}%
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${meta.className}`}>
                        <Icon className="h-3 w-3" />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => downloadReceipt(payment)} className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary/20">
                        <Download className="h-4 w-4" />
                        PDF
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Enregistrer un paiement">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Etudiant">
            <select value={formData.student_id} onChange={(event) => setFormData({ ...formData, student_id: event.target.value })} required className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
              <option value="">Selectionner...</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.first_name} {student.last_name} - {student.matricule || 'N/A'}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Montant total">
              <input type="number" step="0.01" value={formData.amount_due} onChange={(event) => setFormData({ ...formData, amount_due: event.target.value, amount: event.target.value })} required className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </Field>
            <Field label="Montant paye">
              <input type="number" step="0.01" value={formData.amount_paid} onChange={(event) => setFormData({ ...formData, amount_paid: event.target.value, amount: event.target.value })} required className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Date paiement">
              <input type="date" value={formData.date} onChange={(event) => setFormData({ ...formData, date: event.target.value })} required className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </Field>
            <Field label="Date limite">
              <input type="date" value={formData.due_date} onChange={(event) => setFormData({ ...formData, due_date: event.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </Field>
            <Field label="Statut">
              <select value={formData.status} onChange={(event) => setFormData({ ...formData, status: event.target.value })} required className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                <option value="Paid">Paye</option>
                <option value="Partially Paid">Partiellement paye</option>
                <option value="Unpaid">Impaye</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Promotion %">
              <input type="number" step="0.01" min="0" max="100" value={formData.promotion_percentage} onChange={(event) => setFormData({ ...formData, promotion_percentage: event.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </Field>
            <Field label="Description">
              <input value={formData.details} onChange={(event) => setFormData({ ...formData, details: event.target.value })} placeholder="Inscription 2025-2026" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </Field>
          </div>

          <div className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-4 text-sm text-fuchsia-800">
            Si une promotion est appliquee, le systeme enverra automatiquement une notification a l&apos;etudiant.
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300">Annuler</button>
            <button type="submit" disabled={isSubmitting} className="rounded-xl bg-primary px-5 py-2 text-sm font-medium text-white disabled:opacity-50">
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
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
    const fetchMyPayments = async () => {
      try {
        const studentId = user?.student?.id;
        if (!studentId) {
          return;
        }
        const paymentsRes = await api.get(`/payments?student_id=${studentId}`);
        setPayments(paymentsRes.data);
      } catch {
        toast.error('Chargement de votre espace financier impossible');
      } finally {
        setLoading(false);
      }
    };

    fetchMyPayments();
  }, [user]);

  const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount_paid || 0), 0);
  const totalDue = payments.reduce((sum, payment) => sum + Number(payment.amount_due || payment.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-800 dark:text-white">
          <DollarSign className="h-6 w-6 text-primary" />
          Mon espace financier
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Suivi de vos paiements, promotions et recus.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FinanceStat title="Total paye" value={`${totalPaid.toFixed(2)} TND`} />
        <FinanceStat title="Reste a payer" value={`${Math.max(totalDue - totalPaid, 0).toFixed(2)} TND`} />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-700">
          <h3 className="font-semibold text-slate-800 dark:text-white">Historique</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                {['Montant', 'Statut', 'Promotion', 'Date', 'Recu'].map((title) => (
                  <th key={title} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-sm text-slate-500">Chargement...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-sm text-slate-500">Aucun paiement enregistre</td></tr>
              ) : payments.map((payment) => {
                const meta = STATUS_META[payment.status] || STATUS_META.Unpaid;
                return (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800 dark:text-white">{payment.amount_paid || 0} / {payment.amount_due || payment.amount} TND</td>
                    <td className="px-6 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.className}`}>{meta.label}</span></td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{payment.promotion_percentage ? `${payment.promotion_percentage}%` : '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{payment.date}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{payment.receipt_number || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const FinanceStat = ({ title, value }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
    <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
    <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
    {children}
  </div>
);

export const Finance = () => {
  const { user } = useAuth();
  if (user?.role?.name === 'Student') {
    return <StudentFinanceView />;
  }
  return <FinanceOfficerView />;
};
