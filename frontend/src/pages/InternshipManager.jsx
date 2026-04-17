import React, { useState, useEffect } from 'react';
import api from '../lib/axios';
import { Briefcase, Search, CheckCircle, XCircle, Clock, Calendar, Download, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

export const InternshipManager = () => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [defenseDate, setDefenseDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInternships = async () => {
    try {
      const res = await api.get('/internships');
      setInternships(res.data);
    } catch {
      toast.error('Failed to load internships');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInternships();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.post(`/internships/${id}/status`, { status: newStatus });
      toast.success(`Internship marked as ${newStatus}`);
      fetchInternships();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const scheduleDefense = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.put(`/internships/${selectedInternship.id}`, { defense_date: defenseDate });
      toast.success('Defense scheduled successfully!');
      setIsModalOpen(false);
      fetchInternships();
    } catch {
      toast.error('Failed to schedule defense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openScheduleModal = (internship) => {
    setSelectedInternship(internship);
    setDefenseDate(internship.defense_date || '');
    setIsModalOpen(true);
  };

  const filteredInternships = internships.filter(i => {
    const sName = `${i.student?.first_name || ''} ${i.student?.last_name || ''}`.toLowerCase();
    const uName = `${i.student?.user?.first_name || ''} ${i.student?.user?.last_name || ''}`.toLowerCase();
    const comp = (i.company_name || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return sName.includes(search) || uName.includes(search) || comp.includes(search);
  });

  const getStudentName = (i) => {
    if (i.student?.first_name) return `${i.student.first_name} ${i.student.last_name}`;
    if (i.student?.user?.first_name) return `${i.student.user.first_name} ${i.student.user.last_name}`;
    return 'Unknown';
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-primary" /> Gestion des Stages
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Validez les demandes, planifiez les soutenances et examinez les rapports.</p>
      </div>

      <div className="bg-white dark:bg-[#1E1B4B] rounded-2xl border border-slate-100 dark:border-[#2e2a6b] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-[#2e2a6b]">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="text" className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-[#2e2a6b] rounded-xl bg-slate-50 dark:bg-[#0F172A] text-sm focus:ring-primary focus:border-primary"
                   placeholder="Rechercher étudiant ou entreprise..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-[#2e2a6b]">
            <thead className="bg-slate-50 dark:bg-[#0F172A]/50">
              <tr>
                {['Étudiant', 'Détails', 'Période', 'Statut', 'Soutenance', 'Actions'].map((h, i) => (
                  <th key={i} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#2e2a6b]">
              {filteredInternships.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-400">Aucun stage trouvé</td></tr>
              ) : filteredInternships.map(intern => (
                <tr key={intern.id} className="hover:bg-slate-50 dark:hover:bg-[#2e2a6b]/50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{getStudentName(intern)}</p>
                    <p className="text-xs text-slate-500">{intern.type}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{intern.company_name}</p>
                    <p className="text-xs text-slate-500">{intern.supervisor_name || 'Pas d\'encadrant'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-500 flex items-center gap-1"><Calendar className="h-3 w-3"/> {intern.start_date}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1"><Calendar className="h-3 w-3"/> {intern.end_date}</p>
                  </td>
                  <td className="px-6 py-4">
                    {intern.status === 'Pending' && <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">En attente</span>}
                    {intern.status === 'Approved' && <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">Approuvé</span>}
                    {intern.status === 'Rejected' && <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">Rejeté</span>}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                    {intern.defense_date ? intern.defense_date : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       {intern.status === 'Pending' && (
                         <>
                           <button onClick={() => handleUpdateStatus(intern.id, 'Approved')} className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200" title="Approuver"><CheckCircle className="h-4 w-4"/></button>
                           <button onClick={() => handleUpdateStatus(intern.id, 'Rejected')} className="p-1.5 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200" title="Rejeter"><XCircle className="h-4 w-4"/></button>
                         </>
                       )}
                       {intern.status === 'Approved' && (
                         <button onClick={() => openScheduleModal(intern)} className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20" title="Planifier Soutenance"><Clock className="h-4 w-4"/></button>
                       )}
                       {intern.report_file && (
                         <a href={`http://localhost:8000/storage/${intern.report_file}`} target="_blank" rel="noreferrer" className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200" title="Télécharger Rapport">
                           <Download className="h-4 w-4"/>
                         </a>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Planifier la Soutenance">
        <form onSubmit={scheduleDefense} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date de Soutenance *</label>
            <input required type="date" value={defenseDate} onChange={e => setDefenseDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-xl">Annuler</button>
            <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-sm text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50">
              {isSubmitting ? 'Enregistrement...' : 'Planifier'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InternshipManager;
