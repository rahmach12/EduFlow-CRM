import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Edit2, GraduationCap, Layers3, Plus, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import Modal from '../components/Modal';

const EMPTY_FORM = {
  name: '',
  code: '',
  academic_year: '2025-2026',
  faculty_id: '',
  filiere_id: '',
  academic_level_id: '',
};

export const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [levels, setLevels] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentClass, setCurrentClass] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const fetchData = async () => {
    try {
      const [classesRes, facultiesRes, filieresRes, levelsRes] = await Promise.all([
        api.get('/classes'),
        api.get('/faculties'),
        api.get('/filieres'),
        api.get('/academic-levels'),
      ]);
      setClasses(classesRes.data);
      setFaculties(facultiesRes.data);
      setFilieres(filieresRes.data);
      setLevels(levelsRes.data);
    } catch {
      toast.error('Chargement de la structure academique impossible');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (classe = null) => {
    setCurrentClass(classe);
    setFormData(classe ? {
      name: classe.name || '',
      code: classe.code || '',
      academic_year: classe.academic_year || '2025-2026',
      faculty_id: classe.faculty_id || classe.faculty?.id || '',
      filiere_id: classe.filiere_id || classe.filiere?.id || '',
      academic_level_id: classe.academic_level_id || classe.academic_level?.id || classe.academicLevel?.id || '',
    } : EMPTY_FORM);
    setIsModalOpen(true);
  };

  const filteredFilieres = useMemo(() => (
    formData.faculty_id
      ? filieres.filter((filiere) => `${filiere.faculty_id}` === `${formData.faculty_id}`)
      : filieres
  ), [filieres, formData.faculty_id]);

  const filteredClasses = useMemo(() => classes.filter((classe) => {
    const haystack = `${classe.name} ${classe.code || ''} ${classe.level || ''} ${classe.filiere?.name || ''} ${classe.academicLevel?.name || ''}`.toLowerCase();
    return haystack.includes(searchTerm.toLowerCase());
  }), [classes, searchTerm]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      if (currentClass) {
        await api.put(`/classes/${currentClass.id}`, formData);
        toast.success('Classe mise a jour');
      } else {
        await api.post('/classes', formData);
        toast.success('Classe creee');
      }
      setIsModalOpen(false);
      setCurrentClass(null);
      setFormData(EMPTY_FORM);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette classe ?')) {
      return;
    }
    try {
      await api.delete(`/classes/${id}`);
      toast.success('Classe supprimee');
      fetchData();
    } catch {
      toast.error('Suppression impossible');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Structure academique</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gestion reelle de la hierarchie Faculte → Filiere → Niveau → Classe.</p>
        </div>
        <button onClick={() => openModal()} className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Ajouter une classe
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard icon={Building2} title="Facultes" value={faculties.length} />
        <SummaryCard icon={Layers3} title="Filieres" value={filieres.length} />
        <SummaryCard icon={GraduationCap} title="Classes actives" value={classes.length} />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="border-b border-slate-100 p-4 dark:border-slate-700">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Rechercher classe, filiere ou niveau..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-primary dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                {['Classe', 'Faculte', 'Filiere', 'Niveau', 'Annee', 'Etudiants', 'Actions'].map((title) => (
                  <th key={title} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan="7" className="px-6 py-8 text-center text-sm text-slate-500">Chargement...</td></tr>
              ) : filteredClasses.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-8 text-center text-sm text-slate-500">Aucune classe trouvee</td></tr>
              ) : filteredClasses.map((classe) => (
                <tr key={classe.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40">
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{classe.name}</p>
                    <p className="text-xs text-slate-400">{classe.code || 'Sans code'}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{classe.faculty?.name || '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{classe.filiere?.name || '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{classe.academicLevel?.name || classe.level || '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{classe.academic_year || '—'}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{classe.students_count || 0}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openModal(classe)} className="rounded-xl p-2 text-primary transition hover:bg-primary/10"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(classe.id)} className="rounded-xl p-2 text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-900/20"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentClass ? 'Modifier la classe' : 'Nouvelle classe'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nom de la classe">
              <input required value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </Field>
            <Field label="Code">
              <input value={formData.code} onChange={(event) => setFormData({ ...formData, code: event.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Faculte">
              <select value={formData.faculty_id} onChange={(event) => setFormData({ ...formData, faculty_id: event.target.value, filiere_id: '' })} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                <option value="">Selectionner...</option>
                {faculties.map((faculty) => <option key={faculty.id} value={faculty.id}>{faculty.name}</option>)}
              </select>
            </Field>
            <Field label="Filiere">
              <select value={formData.filiere_id} onChange={(event) => setFormData({ ...formData, filiere_id: event.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                <option value="">Selectionner...</option>
                {filteredFilieres.map((filiere) => <option key={filiere.id} value={filiere.id}>{filiere.name}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Niveau">
              <select value={formData.academic_level_id} onChange={(event) => setFormData({ ...formData, academic_level_id: event.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                <option value="">Selectionner...</option>
                {levels.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}
              </select>
            </Field>
            <Field label="Annee academique">
              <input value={formData.academic_year} onChange={(event) => setFormData({ ...formData, academic_year: event.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </Field>
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

const SummaryCard = ({ icon: Icon, title, value }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
        <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
      </div>
      <div className="rounded-2xl bg-primary/10 p-3 text-primary">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
    {children}
  </div>
);
