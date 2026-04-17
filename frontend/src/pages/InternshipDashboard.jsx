import React, { useState, useEffect } from 'react';
import api from '../lib/axios';
import {
  Briefcase, CheckCircle, Clock, XCircle, FileText,
  Calendar, Search, Download, AlertTriangle, Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { SkeletonCardGrid, SkeletonTable } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';

// ── Stat Card ─────────────────────────────────────────────────────────────────
const Stat = ({ label, value, icon: Icon, color }) => (
  <div className={`rounded-2xl p-5 text-white shadow-lg bg-gradient-to-br ${color}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-white/70 text-xs uppercase tracking-wider font-medium">{label}</p>
        <p className="text-3xl font-extrabold mt-1">{value ?? '—'}</p>
      </div>
      <div className="bg-white/20 rounded-xl p-3">
        <Icon className="h-6 w-6" />
      </div>
    </div>
  </div>
);

const InternshipDashboard = () => {
  const [stats, setStats]             = useState(null);
  const [internships, setInternships] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [searchTerm, setSearchTerm]   = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Schedule defense modal
  const [modalOpen, setModalOpen]         = useState(false);
  const [selected, setSelected]           = useState(null);
  const [defenseDate, setDefenseDate]     = useState('');
  const [isSubmitting, setIsSubmitting]   = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, internRes] = await Promise.all([
        api.get('/dashboard/internships'),
        api.get('/internships'),
      ]);
      setStats(statsRes.data);
      setInternships(internRes.data);
    } catch {
      toast.error('Échec du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleStatus = async (id, status) => {
    try {
      await api.post(`/internships/${id}/status`, { status });
      toast.success(`Stage ${status === 'Approved' ? 'approuvé' : 'rejeté'}`);
      fetchData();
    } catch { toast.error('Erreur lors de la mise à jour'); }
  };

  const openDefenseModal = (intern) => {
    setSelected(intern);
    setDefenseDate(intern.defense_date || '');
    setModalOpen(true);
  };

  const scheduleDefense = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.put(`/internships/${selected.id}`, { defense_date: defenseDate });
      toast.success('Date de soutenance planifiée !');
      setModalOpen(false);
      fetchData();
    } catch { toast.error('Erreur lors de la planification'); }
    finally { setIsSubmitting(false); }
  };

  const getStudentName = (i) =>
    i.student?.user?.first_name
      ? `${i.student.user.first_name} ${i.student.user.last_name}`
      : i.student?.first_name
        ? `${i.student.first_name} ${i.student.last_name}`
        : 'Inconnu';

  const filtered = internships.filter(i => {
    const matchSearch = getStudentName(i).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.company_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || i.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Tableau de Bord — Stages</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Gérez les demandes de stages PFE, PFA et d'été</p>
      </div>

      {/* Stats */}
      {loading ? <SkeletonCardGrid count={4} /> : stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label="Total Demandes"   value={stats.total}       icon={Briefcase}     color="from-violet-500 to-purple-700" />
          <Stat label="En Attente"       value={stats.pending}     icon={Clock}         color="from-amber-500 to-orange-600" />
          <Stat label="Approuvés"        value={stats.approved}    icon={CheckCircle}   color="from-emerald-500 to-teal-600" />
          <Stat label="Rapports Soumis"  value={stats.with_report} icon={FileText}      color="from-blue-500 to-indigo-600" />
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              className="w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-primary"
              placeholder="Rechercher étudiant ou entreprise..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white"
          >
            <option value="all">Tous les statuts</option>
            <option value="Pending">En attente</option>
            <option value="Approved">Approuvés</option>
            <option value="Rejected">Rejetés</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                {['Étudiant', 'Entreprise / Type', 'Période', 'Rapport', 'Statut', 'Soutenance', 'Actions'].map((h, i) => (
                  <th key={i} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {loading ? (
                <SkeletonTable rows={5} cols={7} />
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7">
                  <EmptyState icon={Briefcase} title="Aucun stage trouvé" subtitle="Aucune demande ne correspond à votre recherche." />
                </td></tr>
              ) : filtered.map(intern => (
                <tr key={intern.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{getStudentName(intern)}</p>
                    <p className="text-xs text-slate-400">{intern.student?.classe?.name || '—'}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{intern.company_name}</p>
                    <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-lg">{intern.type}</span>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">
                    <p>{intern.start_date}</p>
                    <p>{intern.end_date}</p>
                  </td>
                  <td className="px-5 py-4">
                    {intern.report_file
                      ? <span className="text-xs text-emerald-600 font-bold flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Soumis</span>
                      : <span className="text-xs text-slate-400">Non soumis</span>
                    }
                  </td>
                  <td className="px-5 py-4">
                    {intern.status === 'Pending'  && <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">En attente</span>}
                    {intern.status === 'Approved' && <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">Approuvé</span>}
                    {intern.status === 'Rejected' && <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">Rejeté</span>}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                    {intern.defense_date || '—'}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      {intern.status === 'Pending' && <>
                        <button onClick={() => handleStatus(intern.id, 'Approved')} className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition" title="Approuver">
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleStatus(intern.id, 'Rejected')} className="p-1.5 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200 transition" title="Rejeter">
                          <XCircle className="h-4 w-4" />
                        </button>
                      </>}
                      {intern.status === 'Approved' && (
                        <button onClick={() => openDefenseModal(intern)} className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition" title="Planifier soutenance">
                          <Calendar className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Defense Date Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Planifier la Soutenance">
        <form onSubmit={scheduleDefense} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date de Soutenance *</label>
            <input required type="date" value={defenseDate} onChange={e => setDefenseDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-300">Annuler</button>
            <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-sm bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50">
              {isSubmitting ? 'Enregistrement...' : 'Confirmer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InternshipDashboard;
