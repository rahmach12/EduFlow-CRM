import React, { useState, useEffect } from 'react';
import api from '../lib/axios';
import {
  Users, AlertTriangle, XCircle, FileText,
  Search, CheckCircle, RotateCcw, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { SkeletonCardGrid, SkeletonTable } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';

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

const ScolariteDashboard = () => {
  const [stats, setStats]       = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all | at_risk | eliminated
  const [acting, setActing] = useState(null);

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

  useEffect(() => { fetchData(); }, []);

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

  const filtered = students.filter(s => {
    const matchName = `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === 'eliminated') return matchName && s.is_eliminated;
    if (filter === 'at_risk')    return matchName && !s.is_eliminated && s.absence_rate >= 25;
    return matchName;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Tableau de Bord — Scolarité</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Suivi des absences, des éliminations et des notes</p>
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

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                {['Étudiant', 'Classe', 'Absences', 'Taux', 'Statut', 'Actions'].map((h, i) => (
                  <th key={i} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {loading ? (
                <SkeletonTable rows={5} cols={6} />
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6">
                  <EmptyState icon={Users} title="Aucun étudiant trouvé" subtitle="Modifiez vos filtres pour afficher les résultats." />
                </td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${s.is_eliminated ? 'bg-rose-50/50 dark:bg-rose-900/5' : s.absence_rate >= 25 ? 'bg-amber-50/50 dark:bg-amber-900/5' : ''}`}>
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{s.first_name} {s.last_name}</p>
                    <p className="text-xs text-slate-400">{s.email}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">{s.classe || '—'}</td>
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
    </div>
  );
};

export default ScolariteDashboard;
