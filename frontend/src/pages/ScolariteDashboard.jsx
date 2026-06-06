import React, { useState, useEffect } from 'react';
import api from '../lib/axios';
import {
  Users, AlertTriangle, XCircle, FileText,
  Search, CheckCircle, RotateCcw, ChevronDown, Check, X, FileQuestion
} from 'lucide-react';
import toast from 'react-hot-toast';
import { SkeletonCardGrid, SkeletonTable } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';

// ── Stat Card ─────────────────────────────────────────────────────────────────
const Stat = ({ label, value, icon, color }) => (
  <div className={`rounded-2xl p-5 text-white shadow-lg bg-gradient-to-br ${color}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-white/70 text-xs uppercase tracking-wider font-medium">{label}</p>
        <p className="text-3xl font-extrabold mt-1">{value ?? '—'}</p>
      </div>
      <div className="bg-white/20 rounded-xl p-3">
        {React.createElement(icon, { className: 'h-6 w-6' })}
      </div>
    </div>
  </div>
);

// ── Absence Rate Badge ────────────────────────────────────────────────────────
const AbsenceBadge = ({ rate, eliminated }) => {
  if (eliminated) return <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold flex items-center gap-1"><XCircle className="h-3 w-3" /> Éliminé</span>;
  if (rate >= 25)  return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Risque ({rate}%)</span>;
  return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">{rate}%</span>;
};

const DOC_TYPE_LABELS = {
  attestation_presence: 'Attestation de présence',
  attestation_inscription: 'Attestation d\'inscription',
  releve_notes: 'Relevé de notes / Bulletin',
  convention_stage: 'Convention de stage',
  stage_papers: 'Papiers de stage'
};

const DOC_STATUS_META = {
  pending: { label: 'En attente', className: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approuvé', className: 'bg-blue-100 text-blue-700' },
  rejected: { label: 'Rejeté', className: 'bg-rose-100 text-rose-700' },
  ready: { label: 'Prêt', className: 'bg-emerald-100 text-emerald-700' },
};

const ScolariteDashboard = () => {
  const [stats, setStats]       = useState(null);
  const [students, setStudents] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [docSearchTerm, setDocSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all | at_risk | eliminated
  const [docFilter, setDocFilter] = useState('all'); // all | pending | approved | rejected | ready
  const [acting, setActing] = useState(null);
  const [activeTab, setActiveTab] = useState('absences'); // absences | documents
  
  // Document status modal state
  const [docModal, setDocModal] = useState({ open: false, request: null, status: '', rejection_reason: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, studentsRes] = await Promise.all([
        api.get('/dashboard/scolarite'),
        api.get('/scolarite/students'),
      ]);
      setStats(statsRes.data);
      setStudents(studentsRes.data);
    } catch {
      toast.error('Échec du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    setLoadingDocs(true);
    try {
      const res = await api.get('/document-requests');
      setRequests(res.data);
    } catch {
      toast.error('Échec du chargement des demandes de documents');
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  useEffect(() => {
    if (activeTab === 'documents') {
      fetchRequests();
    }
  }, [activeTab]);

  const handleEliminate = async (studentId) => {
    if (!window.confirm('Confirmer l\'élimination de cet étudiant ?')) return;
    setActing(studentId);
    try {
      await api.post(`/scolarite/eliminate/${studentId}`, { reason: 'Taux d\'absences > 30%' });
      toast.success('Étudiant marqué comme éliminé');
      fetchData();
    } catch { toast.error('Erreur lors de l\'élimination'); }
    finally { setActing(null); }
  };

  const handleReinstate = async (studentId) => {
    setActing(studentId);
    try {
      await api.post(`/scolarite/reinstate/${studentId}`);
      toast.success('Étudiant réintégré');
      fetchData();
    } catch { toast.error('Erreur lors de la réintégration'); }
    finally { setActing(null); }
  };

  const openDocStatusModal = (request, status) => {
    setDocModal({
      open: true,
      request,
      status,
      rejection_reason: request.rejection_reason || ''
    });
  };

  const handleUpdateDocStatus = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/document-requests/${docModal.request.id}/status`, {
        status: docModal.status,
        rejection_reason: docModal.status === 'rejected' ? docModal.rejection_reason : null
      });
      toast.success('Statut de la demande mis à jour');
      setDocModal({ open: false, request: null, status: '', rejection_reason: '' });
      fetchRequests();
    } catch (err) {
      toast.error('Impossible de mettre à jour le statut');
    }
  };

  // Filters for absences
  const filteredStudents = students.filter(s => {
    const matchName = `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === 'eliminated') return matchName && s.is_eliminated;
    if (filter === 'at_risk')    return matchName && !s.is_eliminated && s.absence_rate >= 25;
    return matchName;
  });

  const groupedStudents = filteredStudents.reduce((acc, student) => {
    const className = student.classe || 'Non affecté';
    if (!acc[className]) {
      acc[className] = [];
    }
    acc[className].push(student);
    return acc;
  }, {});

  // Filters for documents
  const filteredRequests = requests.filter(req => {
    const student = req.student?.user;
    const matchName = `${student?.first_name || ''} ${student?.last_name || ''}`.toLowerCase().includes(docSearchTerm.toLowerCase()) ||
      (req.student?.classe?.name || '').toLowerCase().includes(docSearchTerm.toLowerCase()) ||
      (req.student?.matricule || '').toLowerCase().includes(docSearchTerm.toLowerCase());
    
    if (docFilter !== 'all') {
      return matchName && req.status === docFilter;
    }
    return matchName;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Tableau de Bord — Scolarité</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Suivi des absences, éliminations et demandes de documents administratifs</p>
      </div>

      {/* Stats */}
      {loading ? <SkeletonCardGrid count={4} /> : stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label="Total Étudiants"    value={stats.total_students}      icon={Users}          color="from-violet-500 to-purple-700" />
          <Stat label="Étudiants à Risque" value={stats.at_risk_students}    icon={AlertTriangle}  color="from-amber-500 to-orange-600" />
          <Stat label="Éliminations"       value={stats.eliminated_students} icon={XCircle}        color="from-rose-500 to-red-600" />
          <Stat label="Notes Saisies"      value={stats.total_notes}         icon={FileText}       color="from-blue-500 to-indigo-600" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('absences')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'absences'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          Suivi des Absences
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'documents'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          Demandes de Documents
          {requests.filter(r => r.status === 'pending').length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {requests.filter(r => r.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'absences' ? (
        <>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-800">
              <CheckCircle className="h-3 w-3" /> Normal (&lt;25% absences)
            </span>
            <span className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-full border border-amber-100 dark:border-amber-800">
              <AlertTriangle className="h-3 w-3" /> À risque (25–30%)
            </span>
            <span className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 px-3 py-1.5 rounded-full border border-rose-100 dark:border-rose-800">
              <XCircle className="h-3 w-3" /> Éliminé (&gt;30%)
            </span>
          </div>

          {/* Students Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  className="w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-primary"
                  placeholder="Rechercher étudiant..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white"
              >
                <option value="all">Tous les étudiants</option>
                <option value="at_risk">À risque</option>
                <option value="eliminated">Éliminés</option>
              </select>
            </div>

            <div className="p-4 sm:p-6 space-y-8">
              {loading ? (
                <SkeletonTable rows={5} cols={5} fullTable={true} />
              ) : filteredStudents.length === 0 ? (
                <EmptyState icon={Users} title="Aucun étudiant trouvé" subtitle="Modifiez vos filtres pour afficher les résultats." />
              ) : (
                Object.keys(groupedStudents).sort().map(className => (
                  <div key={className} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg">{className}</span>
                      </h3>
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                        {groupedStudents[className].length} étudiant(s)
                      </span>
                    </div>
                    
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                      <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                          <tr>
                            {['Étudiant', 'Absences', 'Taux', 'Statut', 'Actions'].map((h, i) => (
                              <th key={i} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                          {groupedStudents[className].map(s => (
                            <tr key={s.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${s.is_eliminated ? 'bg-rose-50/50 dark:bg-rose-900/5' : s.absence_rate >= 25 ? 'bg-amber-50/50 dark:bg-amber-900/5' : ''}`}>
                              <td className="px-5 py-4">
                                <p className="text-sm font-semibold text-slate-800 dark:text-white">{s.first_name} {s.last_name}</p>
                                <p className="text-xs text-slate-400">{s.email}</p>
                              </td>
                              <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">{s.absences} / {s.total_sessions}</td>
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 max-w-20">
                                    <div
                                      className={`h-1.5 rounded-full ${s.absence_rate >= 30 ? 'bg-rose-500' : s.absence_rate >= 25 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                      style={{ width: `${Math.min(s.absence_rate, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{s.absence_rate}%</span>
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <AbsenceBadge rate={s.absence_rate} eliminated={s.is_eliminated} />
                              </td>
                              <td className="px-5 py-4">
                                {s.is_eliminated ? (
                                  <button
                                    onClick={() => handleReinstate(s.id)}
                                    disabled={acting === s.id}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-600 rounded-xl text-xs font-medium hover:bg-blue-200 transition disabled:opacity-50"
                                  >
                                    <RotateCcw className="h-3 w-3" /> Réintégrer
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleEliminate(s.id)}
                                    disabled={acting === s.id}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 text-rose-600 rounded-xl text-xs font-medium hover:bg-rose-200 transition disabled:opacity-50"
                                  >
                                    <XCircle className="h-3 w-3" /> Éliminer
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      ) : (
        /* Document Requests Panel */
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                className="w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-primary"
                placeholder="Rechercher par étudiant, classe ou matricule..."
                value={docSearchTerm}
                onChange={e => setDocSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={docFilter}
              onChange={e => setDocFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvé</option>
              <option value="ready">Prêt</option>
              <option value="rejected">Rejeté</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            {loadingDocs ? (
              <div className="p-6"><SkeletonTable rows={5} cols={5} fullTable={true} /></div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-8 text-center">
                <EmptyState icon={FileQuestion} title="Aucune demande trouvée" subtitle="Les demandes de documents administratifs s'afficheront ici." />
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    {['Étudiant & Classe', 'Type de Document', 'Date de demande', 'Statut', 'Actions'].map((h, i) => (
                      <th key={i} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                  {filteredRequests.map(req => {
                    const meta = DOC_STATUS_META[req.status] || { label: req.status, className: 'bg-slate-100 text-slate-700' };
                    return (
                      <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-slate-800 dark:text-white">
                            {req.student?.user?.first_name} {req.student?.user?.last_name}
                          </p>
                          <p className="text-xs text-slate-400">
                            Matricule: {req.student?.matricule} | Classe: <span className="font-semibold text-primary">{req.student?.classe?.name || '—'}</span>
                          </p>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-200">
                          {DOC_TYPE_LABELS[req.document_type] || req.document_type}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                          {new Date(req.created_at).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${meta.className}`}>
                            {meta.label}
                          </span>
                          {req.status === 'rejected' && req.rejection_reason && (
                            <p className="text-[10px] text-rose-500 mt-1 max-w-xs truncate" title={req.rejection_reason}>
                              Motif: {req.rejection_reason}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {req.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => openDocStatusModal(req, 'approved')}
                                  className="p-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-xl transition text-xs font-semibold flex items-center gap-1"
                                  title="Approuver"
                                >
                                  <Check className="h-3.5 w-3.5" /> Approuver
                                </button>
                                <button
                                  onClick={() => openDocStatusModal(req, 'rejected')}
                                  className="p-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-xl transition text-xs font-semibold flex items-center gap-1"
                                  title="Rejeter"
                                >
                                  <X className="h-3.5 w-3.5" /> Rejeter
                                </button>
                              </>
                            )}

                            {req.status === 'approved' && (
                              <button
                                onClick={() => openDocStatusModal(req, 'ready')}
                                className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition text-xs font-semibold flex items-center gap-1"
                              >
                                <CheckCircle className="h-3.5 w-3.5" /> Prêt pour téléchargement
                              </button>
                            )}

                            {(req.status === 'ready' || req.status === 'rejected') && (
                              <span className="text-xs text-slate-400">Traité</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Document Status Update Modal */}
      <Modal
        isOpen={docModal.open}
        onClose={() => setDocModal({ open: false, request: null, status: '', rejection_reason: '' })}
        title={
          docModal.status === 'approved' 
            ? 'Approuver la demande' 
            : docModal.status === 'rejected' 
            ? 'Rejeter la demande' 
            : 'Marquer le document comme prêt'
        }
      >
        <form onSubmit={handleUpdateDocStatus} className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl text-sm space-y-1">
            <p><strong>Étudiant:</strong> {docModal.request?.student?.user?.first_name} {docModal.request?.student?.user?.last_name}</p>
            <p><strong>Document:</strong> {DOC_TYPE_LABELS[docModal.request?.document_type]}</p>
            <p><strong>Date:</strong> {docModal.request && new Date(docModal.request.created_at).toLocaleDateString('fr-FR')}</p>
          </div>

          {docModal.status === 'rejected' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Motif du rejet
              </label>
              <textarea
                value={docModal.rejection_reason}
                onChange={e => setDocModal({ ...docModal, rejection_reason: e.target.value })}
                required
                className="w-full border border-slate-350 dark:border-slate-650 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                rows="3"
                placeholder="Veuillez saisir la raison du rejet..."
              />
            </div>
          )}

          {docModal.status === 'ready' && (
            <p className="text-xs text-slate-500">
              En confirmant que le document est prêt, l'étudiant recevra une notification et pourra directement le télécharger au format PDF officiel depuis son portail.
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDocModal({ open: false, request: null, status: '', rejection_reason: '' })}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-600 dark:text-slate-300"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/95"
            >
              Confirmer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ScolariteDashboard;
