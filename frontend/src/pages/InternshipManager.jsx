import React, { useEffect, useMemo, useState } from 'react';
import { Briefcase, CheckCircle2, Clock3, Search, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import Modal from '../components/Modal';

const InternshipManager = () => {
  const [internships, setInternships] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [levels, setLevels] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ filiere_id: '', academic_level_id: '', class_id: '' });
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [statusModal, setStatusModal] = useState({ open: false, status: 'Approved', rejection_reason: '' });
  const [defenseModal, setDefenseModal] = useState({ open: false, defense_date: '', defense_jury: '', defense_room: '', defense_filiere_id: '' });

  const fetchData = async (activeFilters = filters) => {
    try {
      const query = new URLSearchParams(Object.entries(activeFilters).filter(([, value]) => value)).toString();
      const [internshipsRes, filieresRes, levelsRes, classesRes] = await Promise.all([
        api.get(`/internships${query ? `?${query}` : ''}`),
        api.get('/filieres'),
        api.get('/academic-levels'),
        api.get('/classes'),
      ]);
      setInternships(internshipsRes.data);
      setFilieres(filieresRes.data);
      setLevels(levelsRes.data);
      setClasses(classesRes.data);
    } catch {
      toast.error('Chargement des stages impossible');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const visibleClasses = useMemo(() => classes.filter((classe) => {
    if (filters.filiere_id && `${classe.filiere?.id || classe.filiere_id}` !== `${filters.filiere_id}`) {
      return false;
    }
    if (filters.academic_level_id && `${classe.academicLevel?.id || classe.academic_level_id}` !== `${filters.academic_level_id}`) {
      return false;
    }
    return true;
  }), [classes, filters]);

  const filteredInternships = useMemo(() => internships.filter((internship) => {
    const studentName = `${internship.student?.user?.first_name || ''} ${internship.student?.user?.last_name || ''}`.toLowerCase();
    const academicInfo = `${internship.student?.classe?.filiere?.name || ''} ${internship.student?.classe?.academicLevel?.name || ''} ${internship.student?.classe?.name || ''}`.toLowerCase();
    const company = (internship.company_name || '').toLowerCase();
    return `${studentName} ${academicInfo} ${company}`.includes(searchTerm.toLowerCase());
  }), [internships, searchTerm]);

  const submitStatus = async (event) => {
    event.preventDefault();
    try {
      await api.post(`/internships/${selectedInternship.id}/status`, {
        status: statusModal.status,
        rejection_reason: statusModal.rejection_reason,
      });
      toast.success(statusModal.status === 'Approved' ? 'Stage approuve' : 'Stage rejete');
      setStatusModal({ open: false, status: 'Approved', rejection_reason: '' });
      setSelectedInternship(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Mise a jour impossible');
    }
  };

  const submitDefense = async (event) => {
    event.preventDefault();
    try {
      await api.post(`/internships/${selectedInternship.id}/defense`, defenseModal);
      toast.success('Soutenance planifiee');
      setDefenseModal({ open: false, defense_date: '', defense_jury: '', defense_room: '', defense_filiere_id: '' });
      setSelectedInternship(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Planification impossible');
    }
  };

  const applyFilters = (nextFilters) => {
    setFilters(nextFilters);
    fetchData(nextFilters);
  };

  const openStatusModal = (internship, status) => {
    setSelectedInternship(internship);
    setStatusModal({ open: true, status, rejection_reason: '' });
  };

  const openDefenseModal = (internship) => {
    setSelectedInternship(internship);
    setDefenseModal({
      open: true,
      defense_date: internship.defense_date || '',
      defense_jury: internship.defense_jury || '',
      defense_room: internship.defense_room || '',
      defense_filiere_id: internship.defense_filiere_id || internship.student?.classe?.filiere?.id || '',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-800 dark:text-white">
          <Briefcase className="h-6 w-6 text-primary" />
          Responsable des stages
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Validation des stages, rejet motive et organisation des soutenances par filiere, niveau et classe.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Demandes" value={internships.length} />
        <StatCard title="En attente" value={internships.filter((item) => item.status === 'Pending').length} />
        <StatCard title="Approuvees" value={internships.filter((item) => item.status === 'Approved').length} />
        <StatCard title="Soutenances" value={internships.filter((item) => item.defense_date).length} />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Etudiant ou entreprise..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-primary dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
          </div>
          <select value={filters.filiere_id} onChange={(event) => applyFilters({ filiere_id: event.target.value, academic_level_id: '', class_id: '' })} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
            <option value="">Toutes les filieres</option>
            {filieres.map((filiere) => <option key={filiere.id} value={filiere.id}>{filiere.name}</option>)}
          </select>
          <select value={filters.academic_level_id} onChange={(event) => applyFilters({ ...filters, academic_level_id: event.target.value, class_id: '' })} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
            <option value="">Tous les niveaux</option>
            {levels.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}
          </select>
          <select value={filters.class_id} onChange={(event) => applyFilters({ ...filters, class_id: event.target.value })} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
            <option value="">Toutes les classes</option>
            {visibleClasses.map((classe) => <option key={classe.id} value={classe.id}>{classe.name}</option>)}
          </select>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                {['Etudiant', 'Structure academique', 'Stage', 'Statut', 'Soutenance', 'Actions'].map((title) => (
                  <th key={title} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-sm text-slate-500">Chargement...</td></tr>
              ) : filteredInternships.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-sm text-slate-500">Aucune demande trouvee</td></tr>
              ) : filteredInternships.map((internship) => (
                <tr key={internship.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40">
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{internship.student?.user?.first_name} {internship.student?.user?.last_name}</p>
                    <p className="text-xs text-slate-400">Matricule: {internship.student?.matricule || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                    <p>{internship.student?.classe?.filiere?.name || '—'}</p>
                    <p className="text-xs text-slate-400">{internship.student?.classe?.academicLevel?.name || '—'} · {internship.student?.classe?.name || '—'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{internship.type}</p>
                    <p className="text-xs text-slate-400">{internship.company_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={internship.status} />
                    {internship.rejection_reason && <p className="mt-2 max-w-xs text-xs text-rose-500">{internship.rejection_reason}</p>}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                    {internship.defense_date ? (
                      <div>
                        <p>{internship.defense_date}</p>
                        <p className="text-xs text-slate-400">{internship.defense_room || 'Salle a definir'} · {internship.defense_jury || 'Jury a definir'}</p>
                      </div>
                    ) : 'Non planifiee'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {internship.status === 'Pending' && (
                        <>
                          <button onClick={() => openStatusModal(internship, 'Approved')} className="rounded-xl bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-200">Approuver</button>
                          <button onClick={() => openStatusModal(internship, 'Rejected')} className="rounded-xl bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-200">Rejeter</button>
                        </>
                      )}
                      {internship.status === 'Approved' && (
                        <button onClick={() => openDefenseModal(internship)} className="rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20">Planifier soutenance</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={statusModal.open} onClose={() => setStatusModal({ open: false, status: 'Approved', rejection_reason: '' })} title={statusModal.status === 'Approved' ? 'Approuver le stage' : 'Rejeter le stage'}>
        <form onSubmit={submitStatus} className="space-y-4">
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-700/40 dark:text-slate-200">
            {selectedInternship?.student?.user?.first_name} {selectedInternship?.student?.user?.last_name} · {selectedInternship?.type}
          </div>
          {statusModal.status === 'Rejected' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Motif de rejet</label>
              <textarea value={statusModal.rejection_reason} onChange={(event) => setStatusModal({ ...statusModal, rejection_reason: event.target.value })} required rows="4" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setStatusModal({ open: false, status: 'Approved', rejection_reason: '' })} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300">Annuler</button>
            <button type="submit" className="rounded-xl bg-primary px-5 py-2 text-sm font-medium text-white">Confirmer</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={defenseModal.open} onClose={() => setDefenseModal({ open: false, defense_date: '', defense_jury: '', defense_room: '', defense_filiere_id: '' })} title="Planifier la soutenance">
        <form onSubmit={submitDefense} className="space-y-4">
          <Field label="Date de soutenance">
            <input type="date" value={defenseModal.defense_date} onChange={(event) => setDefenseModal({ ...defenseModal, defense_date: event.target.value })} required className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
          </Field>
          <Field label="Jury">
            <input value={defenseModal.defense_jury} onChange={(event) => setDefenseModal({ ...defenseModal, defense_jury: event.target.value })} placeholder="Pr. A, Pr. B, Encadrant C" required className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Salle">
              <input value={defenseModal.defense_room} onChange={(event) => setDefenseModal({ ...defenseModal, defense_room: event.target.value })} required className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </Field>
            <Field label="Filiere">
              <select value={defenseModal.defense_filiere_id} onChange={(event) => setDefenseModal({ ...defenseModal, defense_filiere_id: event.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                <option value="">Selectionner...</option>
                {filieres.map((filiere) => <option key={filiere.id} value={filiere.id}>{filiere.name}</option>)}
              </select>
            </Field>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setDefenseModal({ open: false, defense_date: '', defense_jury: '', defense_room: '', defense_filiere_id: '' })} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300">Annuler</button>
            <button type="submit" className="rounded-xl bg-primary px-5 py-2 text-sm font-medium text-white">Planifier</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const StatCard = ({ title, value }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
    <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
    <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
  </div>
);

const StatusBadge = ({ status }) => {
  if (status === 'Approved') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Approuve</span>;
  }
  if (status === 'Rejected') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700"><XCircle className="h-3 w-3" /> Rejete</span>;
  }
  return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700"><Clock3 className="h-3 w-3" /> En attente</span>;
};

const Field = ({ label, children }) => (
  <div>
    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
    {children}
  </div>
);

export default InternshipManager;
