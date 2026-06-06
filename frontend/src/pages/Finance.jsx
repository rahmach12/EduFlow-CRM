import React, { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Download, 
  Plus, 
  Search, 
  Tag, 
  TriangleAlert, 
  FileText, 
  Award, 
  Calendar, 
  Percent, 
  ShieldAlert, 
  Check, 
  X, 
  CreditCard, 
  User, 
  Filter, 
  ArrowUpRight 
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import Modal from '../components/Modal';
import { useAuth } from '../hooks/useAuth';

const STATUS_META = {
  Paid: { label: 'Payé', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200/50', icon: CheckCircle },
  'Partially Paid': { label: 'Partiel', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200/50', icon: Clock },
  Unpaid: { label: 'Impayé', className: 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-400 border border-slate-200/30', icon: Clock },
  Overdue: { label: 'En retard', className: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200/50', icon: TriangleAlert },
  'Administrative Block': { label: 'Bloqué Admin', className: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border border-red-200/50', icon: ShieldAlert },
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

// ── Reusable Professional Tunisian PDF Document Generators ──────────────────

// 1. RECEIPT GENERATOR
const generateReceiptPDF = (receipt) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('EduFlow University', 14, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Services Administratifs & Financiers', 14, 23);
  doc.text('Tunis, Tunisie', 14, 27);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('République Tunisienne', 140, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Ministère de l\'Enseignement Supérieur', 140, 23);
  doc.text('et de la Recherche Scientifique', 140, 27);

  // Line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(14, 32, 196, 32);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(79, 70, 229); // Premium Violet
  doc.text('REÇU DE PAIEMENT', 105, 45, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Reçu N° : ${receipt.receipt_number}`, 14, 58);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date d'émission : ${receipt.date || '—'}`, 14, 64);
  
  // Student Box
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMATIONS DE L\'ÉTUDIANT :', 14, 76);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nom & Prénom : ${receipt.student?.user?.first_name || ''} ${receipt.student?.user?.last_name || ''}`, 14, 82);
  doc.text(`Matricule : ${receipt.student?.matricule || 'N/A'} | CIN : ${receipt.student?.user?.cin || 'N/A'}`, 14, 88);
  doc.text(`Classe : ${receipt.student?.classe?.name || 'Non affecté'}`, 14, 94);

  // Table
  doc.autoTable({
    startY: 104,
    head: [['Désignation', 'Montant Dû', 'Montant Payé', 'Promotion', 'Statut']],
    body: [[
      receipt.details || 'Frais d\'études universitaires',
      `${receipt.amount_due || 0} TND`,
      `${receipt.amount_paid || 0} TND`,
      receipt.promotion_percentage > 0 ? `${receipt.promotion_percentage}%` : 'Aucune',
      receipt.status === 'Paid' ? 'Payé' : receipt.status === 'Partially Paid' ? 'Partiellement Payé' : 'Impayé'
    ]],
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'center' },
      4: { halign: 'center' }
    }
  });

  const y = doc.lastAutoTable.finalY + 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Reste à payer : ${Math.max((receipt.amount_due || 0) - (receipt.amount_paid || 0), 0).toFixed(2)} TND`, 14, y);

  // Stamp and Signature
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Fait à Tunis, le ' + new Date().toLocaleDateString('fr-FR'), 130, y + 10);
  doc.text('Le Responsable Financier', 130, y + 16);
  
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.rect(130, y + 20, 55, 25);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('[Cachet & Signature]', 140, y + 33);

  // Footer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Ce document fait office de preuve comptable officielle pour l\'année universitaire en cours.', 14, 280);
  doc.text('Page 1', 196, 280, { align: 'right' });

  doc.save(`Recu_${receipt.receipt_number}.pdf`);
};

// 2. CONTRACT GENERATOR
const generateContractPDF = (finance) => {
  const doc = new jsPDF();
  const student = finance.student;
  
  // Headers
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('EduFlow University', 14, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Direction Administrative & Financière', 14, 23);
  doc.text('Année Académique 2025-2026', 14, 27);

  doc.setFont('helvetica', 'bold');
  doc.text('République Tunisienne', 140, 18);
  doc.setFont('helvetica', 'normal');
  doc.text('Enseignement Supérieur Privé', 140, 23);

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(14, 32, 196, 32);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(79, 70, 229);
  doc.text('CONTRAT DE SCOLARITÉ & ENGAGEMENT FINANCIER', 105, 45, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  // Section 1 : Parties
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ENTRE LES SOUSSIGNÉS :', 14, 60);
  doc.setFont('helvetica', 'normal');
  doc.text('1. L\'établissement d\'enseignement supérieur privé EduFlow University.', 14, 66);
  doc.text(`2. L'étudiant(e) : ${student?.user?.first_name || ''} ${student?.user?.last_name || ''}`, 14, 72);
  doc.text(`   Matricule : ${student?.matricule || 'N/A'} | CIN : ${student?.user?.cin || 'N/A'} | Né(e) le : ${student?.date_of_birth || '—'}`, 14, 78);
  doc.text(`   Classe : ${student?.classe?.name || 'Non affecté'} | Cycle/Filière : ${student?.classe?.filiere?.name || '—'}`, 14, 84);

  // Section 2 : Detail des Tarifs
  doc.setFont('helvetica', 'bold');
  doc.text('ARTICLE 1 : ENGAGEMENT FINANCIER ET FRAIS DE SCOLARITÉ', 14, 96);
  doc.setFont('helvetica', 'normal');
  doc.text('L\'étudiant s\'engage à régler l\'intégralité des frais d\'études détaillés ci-dessous :', 14, 102);

  const breakdown = [
    ['Frais de scolarité de base', `${finance.base_tuition || 0} TND`],
    ['Droits d\'inscription', `${finance.registration_fee || 0} TND`],
    ['Frais administratifs', `${finance.administrative_fee || 0} TND`],
    ['Total Remises Appliquées', `-${finance.total_discount || 0} TND`],
    ['Total Bourses d\'Études', `-${finance.total_scholarship || 0} TND`],
    ['Net Général Dû', `${finance.total_due || 0} TND`]
  ];

  doc.autoTable({
    startY: 106,
    head: [['Rubrique Financière', 'Montant']],
    body: breakdown,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { halign: 'right' }
    }
  });

  // Section 3 : Échéances
  let nextY = doc.lastAutoTable.finalY + 12;
  doc.setFont('helvetica', 'bold');
  doc.text('ARTICLE 2 : PLAN DE RÉGLEMENT (ÉCHÉANCIER DE PAIEMENT)', 14, nextY);
  doc.setFont('helvetica', 'normal');
  doc.text('Conformément au règlement universitaire, les tranches doivent être honorées selon le calendrier suivant :', 14, nextY + 6);

  const plan = (finance.installments || []).map(i => [
    `Tranche N° ${i.installment_number}`,
    `${i.amount} TND`,
    i.due_date || '—',
    i.status === 'Paid' ? 'Honorée (Payé)' : i.status === 'Partially Paid' ? 'Payé partiellement' : 'À régler'
  ]);

  doc.autoTable({
    startY: nextY + 10,
    head: [['Échéance', 'Montant à régler', 'Date Limite', 'État Actuel']],
    body: plan.length ? plan : [['Aucune tranche configurée', '—', '—', '—']],
    theme: 'striped',
    headStyles: { fillColor: [55, 65, 81] },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'center' }
    }
  });

  nextY = doc.lastAutoTable.finalY + 12;
  doc.setFont('helvetica', 'bold');
  doc.text('ARTICLE 3 : RETARDS ET PÉNALITÉS', 14, nextY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Tout retard de paiement au-delà de la date limite entraînera des pénalités administratives forfaitaires de 50 TND par tranche.', 14, nextY + 6);
  doc.text('De plus, l\'université se réserve le droit de bloquer temporairement l\'accès aux ressources numériques (portail, notes).', 14, nextY + 10);

  // Signatures
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Signature de l\'Étudiant', 14, nextY + 26);
  doc.text('Pour EduFlow University', 130, nextY + 26);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('(Précédé de la mention manuscrite "Lu et approuvé")', 14, nextY + 31);
  
  doc.setDrawColor(200, 200, 200);
  doc.line(14, nextY + 55, 70, nextY + 55);
  doc.line(130, nextY + 55, 186, nextY + 55);

  doc.save(`Contrat_Scolarite_${student?.matricule || 'STUD'}.pdf`);
};

// 3. INVOICE GENERATOR
const generateInvoicePDF = (finance) => {
  const doc = new jsPDF();
  const student = finance.student;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('EduFlow University', 14, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Service Facturation', 14, 23);
  doc.text('Tunis, Tunisie', 14, 27);

  doc.setFont('helvetica', 'bold');
  doc.text('FACTURÉ A :', 130, 18);
  doc.setFont('helvetica', 'normal');
  doc.text(`${student?.user?.first_name || ''} ${student?.user?.last_name || ''}`, 130, 23);
  doc.text(`Matricule : ${student?.matricule || 'N/A'}`, 130, 27);
  doc.text(`Classe : ${student?.classe?.name || 'N/A'}`, 130, 31);

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(14, 36, 196, 36);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(79, 70, 229);
  doc.text(`FACTURE N° FAC-${student?.matricule || 'STUD'}-2025`, 14, 48);
  doc.setTextColor(0, 0, 0);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date de Facturation : ${new Date().toLocaleDateString('fr-FR')}`, 14, 55);
  doc.text(`Année Académique : ${finance.academic_year || '2025-2026'}`, 14, 60);

  const items = [
    ['Frais de scolarité universitaire de base', `${finance.base_tuition || 0} TND`],
    ['Frais administratifs obligatoires', `${finance.administrative_fee || 0} TND`],
    ['Droits de dossier d\'inscription', `${finance.registration_fee || 0} TND`],
    ['Remises accordées', `-${finance.total_discount || 0} TND`],
    ['Bourses d\'études appliquées', `-${finance.total_scholarship || 0} TND`],
  ];

  doc.autoTable({
    startY: 68,
    head: [['Description des Prestations', 'Montant HT']],
    body: items,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { halign: 'right' }
    }
  });

  const nextY = doc.lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`TOTAL NET A PAYER : ${finance.total_due || 0} TND`, 110, nextY);
  doc.text(`Déjà Réglé : ${finance.total_paid || 0} TND`, 110, nextY + 6);
  doc.text(`Solde Restant : ${Math.max(finance.total_due - finance.total_paid, 0).toFixed(2)} TND`, 110, nextY + 12);

  doc.save(`Facture_${student?.matricule || 'STUD'}.pdf`);
};


// ── 1. FINANCE OFFICERS / ADMIN ERP DASHBOARD ────────────────────────────────

const FinanceOfficerView = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [studentFinances, setStudentFinances] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [tuitionFees, setTuitionFees] = useState([]);
  const [availableDiscounts, setAvailableDiscounts] = useState([]);
  
  const [academicLevels, setAcademicLevels] = useState([]);
  const [filieres, setFilieres] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  const [loading, setLoading] = useState(true);
  
  // Forms states
  const [paymentForm, setPaymentForm] = useState(EMPTY_FORM);
  const [tuitionForm, setTuitionForm] = useState({
    academic_level_id: '',
    filiere_id: '',
    academic_year: '2025-2026',
    base_amount: '',
    registration_fee: '300',
    administrative_fee: '150',
    installments_count: '3',
  });
  const [discountForm, setDiscountForm] = useState({
    name: '',
    code: '',
    type: 'Percentage',
    value: '',
    is_cumulative: true,
    is_automatic: false,
  });
  const [scholarshipForm, setScholarshipForm] = useState({
    amount: '',
    provider: '',
    details: '',
  });
  const [discountSelectId, setDiscountSelectId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchGlobalData = async () => {
    setLoading(true);
    try {
      const requests = [
        api.get('/finance/stats').catch(e => { throw new Error(`Stats: ${e.response?.data?.message || e.message}`); }),
        api.get('/finance/student-finances').catch(e => { throw new Error(`Dossiers: ${e.response?.data?.message || e.message}`); }),
        api.get('/finance/payments/pending').catch(e => { throw new Error(`Preuves: ${e.response?.data?.message || e.message}`); }),
        api.get('/finance/tuition-fees').catch(e => { throw new Error(`Tarifs: ${e.response?.data?.message || e.message}`); }),
        api.get('/finance/discounts').catch(e => { throw new Error(`Remises: ${e.response?.data?.message || e.message}`); }),
        api.get('/academic-levels').catch(e => { throw new Error(`Niveaux: ${e.response?.data?.message || e.message}`); }),
        api.get('/filieres').catch(e => { throw new Error(`Filières: ${e.response?.data?.message || e.message}`); }),
      ];

      const [
        statsRes,
        financesRes,
        pendingRes,
        tuitionsRes,
        discountsRes,
        levelsRes,
        filieresRes
      ] = await Promise.all(requests);

      setStats(statsRes.data);
      setStudentFinances(financesRes.data);
      setPendingPayments(pendingRes.data);
      setTuitionFees(tuitionsRes.data);
      setAvailableDiscounts(discountsRes.data);
      setAcademicLevels(levelsRes.data);
      setFilieres(filieresRes.data);
    } catch (err) {
      console.error('Erreur de chargement finance:', err);
      toast.error(`Erreur lors du chargement des modules financiers : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalData();
  }, []);

  const handleValidation = async (id, action) => {
    const t = toast.loading(`${action === 'validate' ? 'Validation' : 'Rejet'} en cours...`);
    try {
      if (action === 'validate') {
        await api.post(`/finance/payments/${id}/validate`);
        toast.success('Paiement validé avec succès !', { id: t });
      } else {
        await api.post(`/finance/payments/${id}/reject`);
        toast.success('Preuve rejetée et supprimée.', { id: t });
      }
      fetchGlobalData();
    } catch (err) {
      toast.error('Opération impossible.', { id: t });
    }
  };

  const handleStatusUpdate = async (ledgerId, payload) => {
    try {
      const res = await api.put(`/finance/student-finances/${ledgerId}/status`, payload);
      toast.success('Fiche financière mise à jour !');
      setSelectedLedger(res.data);
      fetchGlobalData();
    } catch (err) {
      toast.error('Mise à jour impossible.');
    }
  };

  const handleAddDiscount = async (ledgerId) => {
    if (!discountSelectId) return;
    try {
      const res = await api.post(`/finance/student-finances/${ledgerId}/discounts`, {
        discount_id: discountSelectId
      });
      toast.success('Remise appliquée !');
      setSelectedLedger(res.data);
      setDiscountSelectId('');
      fetchGlobalData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'ajout.');
    }
  };

  const handleRemoveDiscount = async (ledgerId, discountId) => {
    try {
      const res = await api.delete(`/finance/student-finances/${ledgerId}/discounts/${discountId}`);
      toast.success('Remise retirée !');
      setSelectedLedger(res.data);
      fetchGlobalData();
    } catch (err) {
      toast.error('Impossible de retirer.');
    }
  };

  const handleAddScholarship = async (ledgerId) => {
    if (!scholarshipForm.amount || !scholarshipForm.provider) return;
    try {
      const res = await api.post(`/finance/student-finances/${ledgerId}/scholarships`, scholarshipForm);
      toast.success('Bourse académique ajoutée !');
      setSelectedLedger(res.data);
      setScholarshipForm({ amount: '', provider: '', details: '' });
      fetchGlobalData();
    } catch (err) {
      toast.error('Erreur lors de l\'ajout de la bourse.');
    }
  };

  const handleRemoveScholarship = async (ledgerId, scholarshipId) => {
    try {
      const res = await api.delete(`/finance/student-finances/${ledgerId}/scholarships/${scholarshipId}`);
      toast.success('Bourse retirée !');
      setSelectedLedger(res.data);
      fetchGlobalData();
    } catch (err) {
      toast.error('Impossible de supprimer la bourse.');
    }
  };

  const handleCreateTuition = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/finance/tuition-fees', tuitionForm);
      toast.success('Configuration tarifaire enregistrée.');
      setTuitionForm({
        academic_level_id: '',
        filiere_id: '',
        academic_year: '2025-2026',
        base_amount: '',
        registration_fee: '300',
        administrative_fee: '150',
        installments_count: '3',
      });
      fetchGlobalData();
    } catch (err) {
      toast.error('Enregistrement impossible.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateDiscount = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/finance/discounts', discountForm);
      toast.success('Nouvelle remise ajoutée au catalogue.');
      setDiscountForm({
        name: '',
        code: '',
        type: 'Percentage',
        value: '',
        is_cumulative: true,
        is_automatic: false,
      });
      fetchGlobalData();
    } catch (err) {
      toast.error('Code existant ou valeurs invalides.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualPaymentSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/payments', {
        ...paymentForm,
        promotion_percentage: paymentForm.promotion_percentage || 0,
        amount_due: paymentForm.amount_due || paymentForm.amount,
        amount_paid: paymentForm.amount_paid || paymentForm.amount,
      });
      toast.success('Paiement enregistré et validé !');
      setIsPaymentModalOpen(false);
      setPaymentForm(EMPTY_FORM);
      fetchGlobalData();
    } catch (err) {
      toast.error('Erreur lors du versement manuel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredFinances = useMemo(() => {
    return studentFinances.filter(finance => {
      const student = finance.student;
      const matchSearch = [
        student?.matricule,
        student?.user?.cin,
        student?.user?.first_name,
        student?.user?.last_name
      ].filter(Boolean).join(' ').toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter ? finance.financial_status === statusFilter : true;
      return matchSearch && matchStatus;
    });
  }, [studentFinances, searchTerm, statusFilter]);

  const viewLedgerDetails = (ledger) => {
    setSelectedLedger(ledger);
    setIsLedgerModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Système Académique & Financier ERP
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Gestion budgétaire centralisée, tranches de scolarité, bourses d'excellence, remises fratrie et validation des virements.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsPaymentModalOpen(true)} 
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none"
          >
            <Plus className="h-4 w-4" />
            Enregistrer un paiement
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {[
          { id: 'dashboard', label: 'Tableau de Bord' },
          { id: 'ledgers', label: 'Dossiers Étudiants' },
          { id: 'validation', label: `Preuves de Virement (${pendingPayments.length})` },
          { id: 'configs', label: 'Configurations Tarifaires & Remises' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`border-b-2 px-6 py-3 text-sm font-semibold transition-colors focus:outline-none ${
              activeTab === tab.id 
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500 dark:text-slate-400">
          <Clock className="mx-auto h-8 w-8 animate-spin text-indigo-600 mb-2" />
          Chargement des données ERP...
        </div>
      ) : (
        <>
          {/* TAB 1: DASHBOARD STATS */}
          {activeTab === 'dashboard' && stats && (
            <div className="space-y-8 animate-fadeIn">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <div className="rounded-3xl border border-slate-200/60 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm dark:border-slate-700/60 dark:from-slate-800 dark:to-slate-800">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Revenus Encaissés</span>
                  <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{(stats.total_collected || 0).toLocaleString('fr-FR')} TND</p>
                  <span className="mt-2 block text-xs text-slate-400">Transactions validées</span>
                </div>

                <div className="rounded-3xl border border-slate-200/60 bg-gradient-to-br from-rose-50 to-white p-6 shadow-sm dark:border-slate-700/60 dark:from-slate-800 dark:to-slate-800">
                  <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">Dettes en Retard</span>
                  <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{(stats.total_overdue || 0).toLocaleString('fr-FR')} TND</p>
                  <span className="mt-2 block text-xs text-slate-400">Tranches échues impayées</span>
                </div>

                <div className="rounded-3xl border border-slate-200/60 bg-gradient-to-br from-violet-50 to-white p-6 shadow-sm dark:border-slate-700/60 dark:from-slate-800 dark:to-slate-800">
                  <span className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">Remises Accordées</span>
                  <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{(stats.total_discounts || 0).toLocaleString('fr-FR')} TND</p>
                  <span className="mt-2 block text-xs text-slate-400">Remises cumulées appliquées</span>
                </div>

                <div className="rounded-3xl border border-slate-200/60 bg-gradient-to-br from-sky-50 to-white p-6 shadow-sm dark:border-slate-700/60 dark:from-slate-800 dark:to-slate-800">
                  <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">Bourses octroyées</span>
                  <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{(stats.total_scholarships || 0).toLocaleString('fr-FR')} TND</p>
                  <span className="mt-2 block text-xs text-slate-400">Mérite et Excellence</span>
                </div>

                <div className="rounded-3xl border border-slate-200/60 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm dark:border-slate-700/60 dark:from-slate-800 dark:to-slate-800">
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Retards Actifs</span>
                  <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{stats.students_overdue_count}</p>
                  <span className="mt-2 block text-xs text-slate-400">Étudiants hors-délais</span>
                </div>

                <div className="rounded-3xl border border-slate-200/60 bg-gradient-to-br from-red-50 to-white p-6 shadow-sm dark:border-slate-700/60 dark:from-slate-800 dark:to-slate-800">
                  <span className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">Bloqués Admin</span>
                  <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{stats.students_blocked_count}</p>
                  <span className="mt-2 block text-xs text-slate-400">Portail suspendu</span>
                </div>
              </div>

              {/* Monthly stats chart placeholder styled beautifully */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <ArrowUpRight className="h-5 w-5 text-indigo-600" />
                  Courbe de Collecte Mensuelle (Derniers mois)
                </h3>
                <div className="mt-6 flex flex-wrap gap-4 items-end justify-between h-48 border-b border-slate-100 pb-2 dark:border-slate-700">
                  {(stats.monthly_collections || []).map((col, idx) => {
                    const maxVal = Math.max(...(stats.monthly_collections || []).map(m => m.total), 1);
                    const pct = (col.total / maxVal) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center">
                        <span className="text-xs font-bold text-indigo-600 mb-1">{Number(col.total).toLocaleString('fr-FR')} TND</span>
                        <div 
                          className="w-full bg-gradient-to-t from-indigo-500 to-indigo-600 rounded-t-xl transition-all duration-500 hover:from-indigo-600 hover:to-violet-600"
                          style={{ height: `${pct * 1.2}px`, minHeight: '10px' }}
                        ></div>
                        <span className="text-xs text-slate-400 mt-2 font-medium">{col.month}</span>
                      </div>
                    );
                  })}
                  {(!stats.monthly_collections || stats.monthly_collections.length === 0) && (
                    <p className="text-sm text-slate-400 mx-auto text-center">Aucune transaction enregistrée ces 6 derniers mois</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STUDENT FINANCIAL LEDGERS */}
          {activeTab === 'ledgers' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Filter bar */}
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-slate-50 p-4 rounded-2xl dark:bg-slate-900/40">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Filtrer par nom, prénom, matricule, CIN..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">Tous les statuts</option>
                    <option value="Paid">Payé</option>
                    <option value="Partially Paid">Partiellement payé</option>
                    <option value="Unpaid">Impayé</option>
                    <option value="Overdue">En retard</option>
                    <option value="Administrative Block">Bloqué Admin</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                      <tr>
                        {['Étudiant', 'Niveau / Classe', 'Tarif Net Dû', 'Payé', 'Reste à payer', 'Statut', 'Actions'].map(th => (
                          <th key={th} className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{th}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {filteredFinances.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-8 text-center text-sm text-slate-400">Aucun dossier financier trouvé</td>
                        </tr>
                      ) : (
                        filteredFinances.map(finance => {
                          const meta = STATUS_META[finance.financial_status] || STATUS_META.Unpaid;
                          const Icon = meta.icon;
                          const outstanding = Math.max(finance.total_due - finance.total_paid, 0);

                          return (
                            <tr key={finance.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                              <td className="px-6 py-4">
                                <p className="text-sm font-bold text-slate-800 dark:text-white">
                                  {finance.student?.user?.first_name} {finance.student?.user?.last_name}
                                </p>
                                <span className="text-xs text-slate-400 font-mono">MAT: {finance.student?.matricule || 'N/A'} | CIN: {finance.student?.user?.cin || 'N/A'}</span>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                <p>{finance.student?.classe?.name || 'Non affecté'}</p>
                                <span className="text-xs text-slate-400">{finance.student?.classe?.filiere?.name || 'Général'}</span>
                              </td>
                              <td className="px-6 py-4 text-sm font-semibold text-slate-950 dark:text-white">{(finance.total_due || 0).toLocaleString('fr-FR')} TND</td>
                              <td className="px-6 py-4 text-sm font-semibold text-emerald-600">{(finance.total_paid || 0).toLocaleString('fr-FR')} TND</td>
                              <td className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{(outstanding).toLocaleString('fr-FR')} TND</td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${meta.className}`}>
                                  <Icon className="h-3.5 w-3.5" />
                                  {meta.label}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <button
                                  onClick={() => viewLedgerDetails(finance)}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400"
                                >
                                  Fiche Financière
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PROOF VALIDATION */}
          {activeTab === 'validation' && (
            <div className="space-y-6 animate-fadeIn">
              {pendingPayments.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
                  <CheckCircle className="mx-auto h-12 w-12 text-slate-300 mb-2" />
                  Aucune preuve de paiement en attente d'approbation administrative.
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {pendingPayments.map(payment => (
                    <div key={payment.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-slate-800 dark:text-white">
                              {payment.student?.user?.first_name} {payment.student?.user?.last_name}
                            </h4>
                            <p className="text-xs text-slate-400">MAT: {payment.student?.matricule} | CIN: {payment.student?.user?.cin}</p>
                          </div>
                          <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                            {payment.payment_method === 'bank_transfer' ? 'Virement Bancaire' : 'Chèque'}
                          </span>
                        </div>

                        <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-700 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Montant Déclaré :</span>
                            <span className="font-bold text-slate-800 dark:text-white">{payment.amount} TND</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Date Versement :</span>
                            <span>{payment.date}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Référence transaction :</span>
                            <span className="font-mono">{payment.transaction_reference || 'Non spécifiée'}</span>
                          </div>
                          {payment.installment && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Tranche Cible :</span>
                              <span className="font-semibold text-indigo-500">Tranche N° {payment.installment.installment_number}</span>
                            </div>
                          )}
                        </div>

                        {payment.proof_file_path && (
                          <div className="mt-4">
                            <span className="text-xs font-semibold text-slate-400 block mb-2">Preuve de paiement (Document joint) :</span>
                            <a 
                              href={`/storage/${payment.proof_file_path}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 p-3 w-full hover:bg-slate-50 transition text-sm text-indigo-600 font-semibold"
                            >
                              <FileText className="h-5 w-5 text-slate-400" />
                              Visualiser le justificatif de transaction
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="mt-6 flex gap-3">
                        <button
                          onClick={() => handleValidation(payment.id, 'reject')}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/50 py-2.5 text-xs font-bold text-rose-600 transition hover:bg-rose-100 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400"
                        >
                          <X className="h-4 w-4" /> Rejeter
                        </button>
                        <button
                          onClick={() => handleValidation(payment.id, 'validate')}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                        >
                          <Check className="h-4 w-4" /> Valider l'Encaissé
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CONFIGURATIONS */}
          {activeTab === 'configs' && (
            <div className="grid gap-8 lg:grid-cols-2 animate-fadeIn">
              {/* Config Tuition Fees */}
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                    <CreditCard className="h-5 w-5 text-indigo-600" />
                    Nouveau Tarif de Scolarité
                  </h3>
                  <form onSubmit={handleCreateTuition} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Niveau Académique</label>
                      <select
                        value={tuitionForm.academic_level_id}
                        onChange={e => setTuitionForm({ ...tuitionForm, academic_level_id: e.target.value })}
                        required
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        <option value="">Sélectionner un niveau...</option>
                        {academicLevels.map(l => (
                          <option key={l.id} value={l.id}>{l.name} ({l.cycle})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Cycle / Filière (Optionnel)</label>
                      <select
                        value={tuitionForm.filiere_id}
                        onChange={e => setTuitionForm({ ...tuitionForm, filiere_id: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        <option value="">Toutes les filières</option>
                        {filieres.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Base Scolarité (TND)</label>
                        <input
                          type="number"
                          value={tuitionForm.base_amount}
                          onChange={e => setTuitionForm({ ...tuitionForm, base_amount: e.target.value })}
                          required
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Droit d'Inscription (TND)</label>
                        <input
                          type="number"
                          value={tuitionForm.registration_fee}
                          onChange={e => setTuitionForm({ ...tuitionForm, registration_fee: e.target.value })}
                          required
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Frais administratifs (TND)</label>
                        <input
                          type="number"
                          value={tuitionForm.administrative_fee}
                          onChange={e => setTuitionForm({ ...tuitionForm, administrative_fee: e.target.value })}
                          required
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Nombre d'Échéances</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={tuitionForm.installments_count}
                          onChange={e => setTuitionForm({ ...tuitionForm, installments_count: e.target.value })}
                          required
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Enregistrement...' : 'Enregistrer le tarif'}
                    </button>
                  </form>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Grille Tarifaire Active</h3>
                  <div className="space-y-3">
                    {tuitionFees.map(fee => (
                      <div key={fee.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl dark:border-slate-700">
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-white">{fee.academic_level?.name}</p>
                          <span className="text-xs text-slate-400">{fee.filiere?.name || 'Toutes les filières'}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-extrabold text-indigo-600">{fee.base_amount} TND</p>
                          <span className="text-[10px] text-slate-400">+{fee.registration_fee} TND Reg | +{fee.administrative_fee} TND Admin</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Discounts Config Catalog */}
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                    <Percent className="h-5 w-5 text-indigo-600" />
                    Créer un Type de Remise
                  </h3>
                  <form onSubmit={handleCreateDiscount} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Nom de la remise</label>
                      <input
                        type="text"
                        placeholder="Ex: Remise Partenaire Lycée"
                        value={discountForm.name}
                        onChange={e => setDiscountForm({ ...discountForm, name: e.target.value })}
                        required
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Code Remise (Unique)</label>
                        <input
                          type="text"
                          placeholder="DISC_PARTNER"
                          value={discountForm.code}
                          onChange={e => setDiscountForm({ ...discountForm, code: e.target.value.toUpperCase() })}
                          required
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Type de valeur</label>
                        <select
                          value={discountForm.type}
                          onChange={e => setDiscountForm({ ...discountForm, type: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        >
                          <option value="Percentage">Pourcentage (%)</option>
                          <option value="Fixed">Montant Fixe (TND)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Valeur</label>
                        <input
                          type="number"
                          step="0.01"
                          value={discountForm.value}
                          onChange={e => setDiscountForm({ ...discountForm, value: e.target.value })}
                          required
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                      <div className="flex flex-col justify-center">
                        <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Options cumulatives</span>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                            <input
                              type="checkbox"
                              checked={discountForm.is_cumulative}
                              onChange={e => setDiscountForm({ ...discountForm, is_cumulative: e.target.checked })}
                            /> Cumulable
                          </label>
                          <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                            <input
                              type="checkbox"
                              checked={discountForm.is_automatic}
                              onChange={e => setDiscountForm({ ...discountForm, is_automatic: e.target.checked })}
                            /> Automatique
                          </label>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Création...' : 'Créer la remise'}
                    </button>
                  </form>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Catalogue des Remises</h3>
                  <div className="space-y-3">
                    {availableDiscounts.map(d => (
                      <div key={d.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl dark:border-slate-700">
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-white">{d.name}</p>
                          <span className="text-[10px] text-slate-400 font-mono">{d.code} | {d.is_cumulative ? 'Cumulable' : 'Non cumulable'}</span>
                        </div>
                        <div className="text-right">
                          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-extrabold text-indigo-600">
                            {d.type === 'Percentage' ? `${d.value}%` : `${d.value} TND`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* DETAILED STUDENT LEDGER CARD MODAL */}
      {isLedgerModalOpen && selectedLedger && (
        <Modal 
          isOpen={isLedgerModalOpen} 
          onClose={() => setIsLedgerModalOpen(false)} 
          title="Fiche Financière Académique"
          maxWidth="max-w-4xl"
        >
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50 p-5 rounded-2xl dark:bg-slate-900/30">
              <div>
                <h4 className="text-lg font-extrabold text-slate-800 dark:text-white">
                  {selectedLedger.student?.user?.first_name} {selectedLedger.student?.user?.last_name}
                </h4>
                <p className="text-xs text-slate-400">
                  Matricule: {selectedLedger.student?.matricule} | CIN: {selectedLedger.student?.user?.cin} | Classe: {selectedLedger.student?.classe?.name}
                </p>
              </div>
              <div className="flex gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                  STATUS_META[selectedLedger.financial_status]?.className || STATUS_META.Unpaid.className
                }`}>
                  {STATUS_META[selectedLedger.financial_status]?.label}
                </span>
                
                {selectedLedger.is_redoublant && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-800 border border-orange-200/50 px-3 py-1 text-xs font-bold">
                    Redoublant
                  </span>
                )}
              </div>
            </div>

            {/* Block & Redoublant status controls */}
            <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-700 bg-slate-50/50 flex flex-wrap gap-6 items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Action administrative :</span>
                <button
                  onClick={() => handleStatusUpdate(selectedLedger.id, {
                    financial_status: selectedLedger.financial_status === 'Administrative Block' ? 'Unpaid' : 'Administrative Block'
                  })}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                    selectedLedger.financial_status === 'Administrative Block'
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                      : 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/10'
                  }`}
                >
                  {selectedLedger.financial_status === 'Administrative Block' ? 'Débloquer l\'accès' : 'Appliquer un Blocage Admin'}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={selectedLedger.is_redoublant}
                    onChange={e => handleStatusUpdate(selectedLedger.id, {
                      is_redoublant: e.target.checked,
                      redoublant_discount_percentage: e.target.checked ? 30.00 : 0.00,
                      financial_status: selectedLedger.financial_status
                    })}
                  /> Redoublant (Taux réduit)
                </label>
                {selectedLedger.is_redoublant && (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={selectedLedger.redoublant_discount_percentage}
                      onChange={e => handleStatusUpdate(selectedLedger.id, {
                        is_redoublant: true,
                        redoublant_discount_percentage: e.target.value,
                        financial_status: selectedLedger.financial_status
                      })}
                      className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none dark:border-slate-700 dark:bg-slate-800"
                    />
                    <span className="text-xs text-slate-400">%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Calculations and Breakdown */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
                <h5 className="font-bold text-slate-800 dark:text-white border-b border-slate-100 pb-2 mb-3 dark:border-slate-700">Calcul du Solde de Scolarité</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Base Scolarité :</span>
                    <span className="font-semibold">{selectedLedger.base_tuition} TND</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Droits d'Inscription :</span>
                    <span className="font-semibold">{selectedLedger.registration_fee} TND</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Frais administratifs :</span>
                    <span className="font-semibold">{selectedLedger.administrative_fee} TND</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span className="text-rose-600/70">Remises Appliquées :</span>
                    <span className="font-semibold">-{selectedLedger.total_discount} TND</span>
                  </div>
                  <div className="flex justify-between text-sky-600">
                    <span className="text-sky-600/70">Bourses académiques :</span>
                    <span className="font-semibold">-{selectedLedger.total_scholarship} TND</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-2 font-bold text-base text-slate-900 dark:text-white dark:border-slate-700">
                    <span>Total Net Dû :</span>
                    <span>{selectedLedger.total_due} TND</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Encaissé (Payé) :</span>
                    <span>{selectedLedger.total_paid} TND</span>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <button 
                    onClick={() => generateContractPDF(selectedLedger)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <Download className="h-3.5 w-3.5" /> Contrat
                  </button>
                  <button 
                    onClick={() => generateInvoicePDF(selectedLedger)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <FileText className="h-3.5 w-3.5" /> Facture
                  </button>
                </div>
              </div>

              {/* Adjustments (Discounts & Scholarships additions) */}
              <div className="space-y-4">
                {/* Remises */}
                <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
                  <h5 className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-3 text-sm">
                    <Percent className="h-4.5 w-4.5 text-indigo-600" />
                    Ajuster les Remises
                  </h5>
                  <div className="flex gap-2">
                    <select
                      value={discountSelectId}
                      onChange={e => setDiscountSelectId(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none dark:border-slate-700 dark:bg-slate-850 dark:text-white"
                    >
                      <option value="">Sélectionner une remise...</option>
                      {availableDiscounts.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.type === 'Percentage' ? `${d.value}%` : `${d.value} TND`})</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAddDiscount(selectedLedger.id)}
                      className="rounded-xl bg-indigo-600 px-3 text-xs font-bold text-white transition hover:bg-indigo-700"
                    >
                      Appliquer
                    </button>
                  </div>

                  <div className="mt-3 space-y-2">
                    {(selectedLedger.student_discounts || []).map(sd => (
                      <div key={sd.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl dark:bg-slate-900/20 text-xs">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-white">{sd.discount?.name}</span>
                          <span className="block text-[10px] text-rose-500 font-bold">-{sd.applied_amount} TND</span>
                        </div>
                        <button
                          onClick={() => handleRemoveDiscount(selectedLedger.id, sd.discount_id)}
                          className="text-slate-400 hover:text-rose-600 transition"
                        >
                          <X className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bourses */}
                <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
                  <h5 className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-3 text-sm">
                    <Award className="h-4.5 w-4.5 text-indigo-600" />
                    Ajuster les Bourses
                  </h5>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Montant (TND)"
                        value={scholarshipForm.amount}
                        onChange={e => setScholarshipForm({ ...scholarshipForm, amount: e.target.value })}
                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none dark:border-slate-700 dark:bg-slate-850"
                      />
                      <input
                        type="text"
                        placeholder="Organisme"
                        value={scholarshipForm.provider}
                        onChange={e => setScholarshipForm({ ...scholarshipForm, provider: e.target.value })}
                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none dark:border-slate-700 dark:bg-slate-850"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Détails additionnels"
                      value={scholarshipForm.details}
                      onChange={e => setScholarshipForm({ ...scholarshipForm, details: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none dark:border-slate-700 dark:bg-slate-850"
                    />
                    <button
                      onClick={() => handleAddScholarship(selectedLedger.id)}
                      className="w-full rounded-xl bg-indigo-600 py-1.5 text-xs font-bold text-white transition hover:bg-indigo-700"
                    >
                      Ajouter la Bourse
                    </button>
                  </div>

                  <div className="mt-3 space-y-2">
                    {(selectedLedger.scholarships || []).map(sc => (
                      <div key={sc.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl dark:bg-slate-900/20 text-xs">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-white">{sc.provider}</span>
                          <span className="block text-[10px] text-sky-500 font-bold">-{sc.amount} TND</span>
                        </div>
                        <button
                          onClick={() => handleRemoveScholarship(selectedLedger.id, sc.id)}
                          className="text-slate-400 hover:text-rose-600 transition"
                        >
                          <X className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Installments Timeline */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <h5 className="font-bold text-slate-800 dark:text-white mb-4">Échéancier des Tranches</h5>
              <div className="grid gap-4 sm:grid-cols-3">
                {(selectedLedger.installments || []).map(i => {
                  const subMeta = STATUS_META[i.status] || STATUS_META.Unpaid;
                  return (
                    <div key={i.id} className="p-4 border border-slate-100 rounded-2xl dark:border-slate-700 bg-slate-50/50">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-slate-400">Tranche {i.installment_number}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${subMeta.className}`}>
                          {subMeta.label}
                        </span>
                      </div>
                      <p className="text-lg font-black text-slate-900 dark:text-white mt-2">{i.amount} TND</p>
                      <div className="mt-3 space-y-1 text-xs text-slate-500">
                        <div className="flex justify-between">
                          <span>Payé :</span>
                          <span className="font-semibold text-emerald-600">{i.amount_paid} TND</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pénalité :</span>
                          <span className="font-semibold text-rose-500">+{i.penalty_amount} TND</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-200/50">
                          <span>Échéance :</span>
                          <span>{i.due_date}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* MANUAL PAYMENT REGISTER MODAL */}
      {isPaymentModalOpen && (
        <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Enregistrer un Règlement (Finance Office)">
          <form onSubmit={handleManualPaymentSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Étudiant Cible</label>
              <select
                value={paymentForm.student_id}
                onChange={e => setPaymentForm({ ...paymentForm, student_id: e.target.value })}
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="">Sélectionner un étudiant...</option>
                {studentFinances.map(f => (
                  <option key={f.id} value={f.student_id}>
                    {f.student?.user?.first_name} {f.student?.user?.last_name} ({f.student?.matricule})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Montant Versement (TND)</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value, amount_paid: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Méthode de Paiement</label>
                <select
                  value={paymentForm.payment_method}
                  onChange={e => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="cash">Espèces (Comptant)</option>
                  <option value="bank_transfer">Virement Bancaire</option>
                  <option value="check">Chèque</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Date Règlement</label>
                <input
                  type="date"
                  value={paymentForm.date}
                  onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Référence Transaction</label>
                <input
                  type="text"
                  placeholder="Numéro de chèque, ID virement..."
                  value={paymentForm.transaction_reference}
                  onChange={e => setPaymentForm({ ...paymentForm, transaction_reference: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Promotion Spéciale (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={paymentForm.promotion_percentage}
                  onChange={e => setPaymentForm({ ...paymentForm, promotion_percentage: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Libellé / Détails</label>
                <input
                  type="text"
                  placeholder="Règlement Tranche"
                  value={paymentForm.details}
                  onChange={e => setPaymentForm({ ...paymentForm, details: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer le versement'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};


// ── 2. STUDENT FINANCIAL PERSONAL SPACE ─────────────────────────────────────

const StudentFinanceView = () => {
  const { user } = useAuth();
  const [finance, setFinance] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [targetInstallment, setTargetInstallment] = useState(null);
  
  // Proof upload form state
  const [uploadForm, setUploadForm] = useState({
    amount: '',
    payment_method: 'bank_transfer',
    transaction_reference: '',
    proof_file: null,
    date: new Date().toISOString().split('T')[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const requests = [
        api.get('/finance/my-finance').catch(e => { throw new Error(`Dossier: ${e.response?.data?.message || e.message}`); }),
        api.get(`/payments?student_id=${user?.student?.id}`).catch(e => { throw new Error(`Versements: ${e.response?.data?.message || e.message}`); }),
      ];

      const [financeRes, paymentsRes] = await Promise.all(requests);
      setFinance(financeRes.data);
      setPayments(paymentsRes.data);
    } catch (err) {
      console.error('Erreur de chargement finance étudiant:', err);
      toast.error(`Erreur lors du chargement de l'espace financier : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.student?.id) {
      fetchStudentData();
    }
  }, [user]);

  const openUploadModal = (installment) => {
    setTargetInstallment(installment);
    setUploadForm({
      amount: (Number(installment.amount) - Number(installment.amount_paid)).toString(),
      payment_method: 'bank_transfer',
      transaction_reference: '',
      proof_file: null,
      date: new Date().toISOString().split('T')[0],
    });
    setIsUploadOpen(true);
  };

  const handleProofUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadForm.proof_file) {
      toast.error('Veuillez joindre votre document justificatif.');
      return;
    }

    setIsSubmitting(true);
    const fd = new FormData();
    fd.append('student_id', user.student.id);
    fd.append('amount', uploadForm.amount);
    fd.append('payment_method', uploadForm.payment_method);
    fd.append('transaction_reference', uploadForm.transaction_reference);
    fd.append('proof', uploadForm.proof_file);
    fd.append('installment_id', targetInstallment.id);
    fd.append('date', uploadForm.date);
    fd.append('details', `Justificatif Tranche N° ${targetInstallment.installment_number}`);

    try {
      await api.post('/payments', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Preuve de paiement soumise ! En attente de validation administrative.');
      setIsUploadOpen(false);
      fetchStudentData();
    } catch (err) {
      toast.error('Impossible d\'envoyer le document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadReceipt = async (payment) => {
    const t = toast.loading('Génération du reçu...');
    try {
      const receiptRes = await api.get(`/payments/${payment.id}/receipt`);
      generateReceiptPDF(receiptRes.data);
      toast.success('Reçu PDF téléchargé !', { id: t });
    } catch {
      toast.error('Impossible de générer le reçu.', { id: t });
    }
  };

  const [isKonnectLoading, setIsKonnectLoading] = useState(false);

  const initKonnectPayment = async (installment) => {
    setIsKonnectLoading(true);
    const toastId = toast.loading('Initialisation du paiement Konnect...');
    
    try {
      const unpaidAmount = Math.max(installment.amount - installment.amount_paid, 0);
      const res = await api.post('/konnect/init', {
        student_id: user.student.id,
        amount: unpaidAmount,
        installment_id: installment.id,
        details: `Tranche N° ${installment.installment_number}`
      });
      
      toast.success('Redirection vers Konnect sécurisée...', { id: toastId });
      // Redirect to Konnect Payment page
      window.location.href = res.data.payUrl;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur d\'initialisation Konnect.', { id: toastId });
    } finally {
      setIsKonnectLoading(false);
    }
  };

  useEffect(() => {
    // Check if coming back from Konnect payment success/failure
    const urlParams = new URLSearchParams(window.location.search);
    const paymentId = urlParams.get('payment_ref');
    if (paymentId) {
      toast.success('Synchronisation du paiement terminée !');
      // Remove query param to clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchStudentData();
    }
  }, []);

  if (loading) {
    return (
      <div className="py-12 text-center text-slate-500 dark:text-slate-400">
        <Clock className="mx-auto h-8 w-8 animate-spin text-indigo-600 mb-2" />
        Accès à votre compte financier...
      </div>
    );
  }

  if (!finance) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50/50 p-6 text-center text-rose-800 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400">
        <ShieldAlert className="mx-auto h-8 w-8 text-rose-500 mb-2" />
        Dossier académique introuvable pour l'année universitaire.
      </div>
    );
  }

  const outstandingBalance = Math.max(finance.total_due - finance.total_paid, 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Contract Header Card */}
      <div className="rounded-3xl bg-gradient-to-br from-primary to-violet-700 p-8 text-white shadow-xl shadow-primary/20">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
              Année Universitaire {finance.academic_year}
            </span>
            <h2 className="mt-4 text-3xl font-black">Mon Compte Scolarité</h2>
            <p className="mt-1 text-indigo-100 font-medium">
              Contrat d'études : {finance.student?.classe?.name || 'Filière générale'} ({finance.student?.classe?.academic_level?.name || 'Licence'})
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => generateContractPDF(finance)}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20 border border-white/10"
            >
              <Download className="h-4 w-4" /> Télécharger Contrat
            </button>
            <button
              onClick={() => generateInvoicePDF(finance)}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20 border border-white/10"
            >
              <FileText className="h-4 w-4" /> Facture Proforma
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 grid-cols-2 md:grid-cols-4 border-t border-white/20 pt-6">
          <div>
            <span className="text-xs text-indigo-200 block">Coût Initial</span>
            <span className="text-xl font-bold">{(Number(finance.base_tuition) + Number(finance.registration_fee) + Number(finance.administrative_fee)).toLocaleString('fr-FR')} TND</span>
          </div>
          <div>
            <span className="text-xs text-indigo-200 block">Remises & Bourses</span>
            <span className="text-xl font-bold">{(Number(finance.total_discount) + Number(finance.total_scholarship)).toLocaleString('fr-FR')} TND</span>
          </div>
          <div>
            <span className="text-xs text-indigo-200 block font-bold uppercase">Total Net Dû</span>
            <span className="text-xl font-bold">{(finance.total_due).toLocaleString('fr-FR')} TND</span>
          </div>
          <div>
            <span className="text-xs text-indigo-200 block font-bold uppercase">Reste à Payer (Solde)</span>
            <span className="text-2xl font-black text-amber-300">{(outstandingBalance).toLocaleString('fr-FR')} TND</span>
          </div>
        </div>
      </div>

      {finance.financial_status === 'Administrative Block' && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 flex gap-4 text-red-800 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400 shadow-sm">
          <ShieldAlert className="h-8 w-8 text-red-600 shrink-0 mt-1" />
          <div>
            <h4 className="font-bold text-lg">Accès Administratif Suspendu</h4>
            <p className="text-sm mt-1">
              Votre compte a été bloqué en raison d'un arriéré financier de <strong className="text-red-600">{outstandingBalance} TND</strong>. 
              Veuillez régulariser votre situation en payant via Konnect pour débloquer automatiquement vos modules (Notes, Emploi du temps, Documents).
            </p>
          </div>
        </div>
      )}

      {/* Installment Steps Timeline */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
          <Calendar className="h-5 w-5 text-primary" />
          Calendrier des Tranches & Paiement
        </h3>
        <div className="grid gap-6 md:grid-cols-3">
          {(finance.installments || []).map(i => {
            const isCompleted = i.status === 'Paid';
            const isOverdue = i.status === 'Overdue';
            const unpaidAmount = Math.max(i.amount - i.amount_paid, 0);

            return (
              <div 
                key={i.id} 
                className={`relative p-5 rounded-2xl border transition-all ${
                  isCompleted 
                    ? 'border-emerald-200 bg-emerald-50/20 dark:border-emerald-900/40 dark:bg-emerald-950/10'
                    : isOverdue
                      ? 'border-rose-200 bg-rose-50/10 dark:border-rose-900/40 dark:bg-rose-950/10'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/30'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-slate-400">Échéance N° {i.installment_number}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    STATUS_META[i.status]?.className || STATUS_META.Unpaid.className
                  }`}>
                    {STATUS_META[i.status]?.label || 'À payer'}
                  </span>
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{(i.amount).toLocaleString('fr-FR')} TND</p>
                
                <div className="mt-4 space-y-1.5 text-xs border-t border-slate-100 pt-3 dark:border-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Date limite :</span>
                    <span className="font-semibold">{i.due_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Montant payé :</span>
                    <span className="font-semibold text-emerald-600">{i.amount_paid} TND</span>
                  </div>
                  {Number(i.penalty_amount) > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Frais de retard :</span>
                      <span className="font-bold">+{i.penalty_amount} TND</span>
                    </div>
                  )}
                </div>

                {!isCompleted && (
                  <button
                    onClick={() => initKonnectPayment(i)}
                    disabled={isKonnectLoading}
                    className="w-full mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition dark:bg-primary dark:hover:bg-primary-light shadow-md shadow-slate-900/20"
                  >
                    <CreditCard className="h-4 w-4" />
                    Payer avec Konnect ({unpaidAmount} TND)
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment History */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-700">
          <h3 className="font-bold text-slate-800 dark:text-white">Historique de mes versements</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                {['Désignation', 'Méthode', 'Montant Versé', 'Date de valeur', 'État administrative', 'Reçu'].map(th => (
                  <th key={th} className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{th}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-sm text-slate-400">Aucune transaction enregistrée</td>
                </tr>
              ) : (
                payments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 text-sm">
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">
                      {p.invoices?.[0]?.details || 'Frais de scolarité'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 capitalize">
                      {p.payment_method === 'bank_transfer' ? 'Virement bancaire' : p.payment_method === 'check' ? 'Chèque' : 'Espèces'}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{p.amount} TND</td>
                    <td className="px-6 py-4 text-slate-500">{p.date}</td>
                    <td className="px-6 py-4">
                      {p.is_validated ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200/50 px-2.5 py-0.5 text-xs font-bold">
                          Versement Validé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200/50 px-2.5 py-0.5 text-xs font-bold">
                          En attente de validation
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {p.is_validated ? (
                        <button
                          onClick={() => downloadReceipt(p)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold transition"
                        >
                          <Download className="h-3.5 w-3.5" /> PDF
                        </button>
                      ) : (
                        <span className="text-slate-400 font-italic text-xs">Indisponible</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* UPLOAD PROOF MODAL */}
      {isUploadOpen && targetInstallment && (
        <Modal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} title={`Justificatif Tranche N° ${targetInstallment.installment_number}`}>
          <form onSubmit={handleProofUploadSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Montant Réglé (TND)</label>
              <input
                type="number"
                step="0.01"
                value={uploadForm.amount}
                onChange={e => setUploadForm({ ...uploadForm, amount: e.target.value })}
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Méthode Utilisée</label>
                <select
                  value={uploadForm.payment_method}
                  onChange={e => setUploadForm({ ...uploadForm, payment_method: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="bank_transfer">Virement Bancaire</option>
                  <option value="check">Dépôt de Chèque</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Date de valeur</label>
                <input
                  type="date"
                  value={uploadForm.date}
                  onChange={e => setUploadForm({ ...uploadForm, date: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">ID / Numéro de référence de transaction</label>
              <input
                type="text"
                placeholder="ID de virement bancaire, numéro de chèque..."
                value={uploadForm.transaction_reference}
                onChange={e => setUploadForm({ ...uploadForm, transaction_reference: e.target.value })}
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Attacher le fichier (Image / PDF)</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={e => setUploadForm({ ...uploadForm, proof_file: e.target.files[0] })}
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Transmission...' : 'Soumettre le justificatif'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};


// ── 3. MAIN COMPONENT EXPORTER ──────────────────────────────────────────────

export const Finance = () => {
  const { user } = useAuth();
  const roleName = user?.role?.name;

  if (roleName === 'Student') {
    return <StudentFinanceView />;
  }

  if (roleName === 'Admin' || roleName === 'Finance Officer') {
    return <FinanceOfficerView />;
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-rose-200 bg-rose-50/50 dark:border-rose-900/30 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400">
      <ShieldAlert className="h-12 w-12 text-rose-500 mb-4 animate-bounce" />
      <h3 className="text-lg font-bold">Accès Non Autorisé</h3>
      <p className="text-sm mt-2 max-w-md">
        Votre compte universitaire ({user?.first_name} {user?.last_name}, rôle : {roleName}) ne dispose pas des droits requis pour accéder à ce module de gestion financière.
      </p>
    </div>
  );
};

export default Finance;
