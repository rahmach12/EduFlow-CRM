import React, { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Building2, Edit2, GraduationCap, Layers3, Plus, Search, Trash2, Users, Mail, Phone, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import Modal from '../components/Modal';
import { useAuth } from '../hooks/useAuth';

const EMPTY_FORM = {
  name: '',
  code: '',
  academic_year: '2025-2026',
  filiere_id: '',
  academic_level_id: '',
};

export const Classes = () => {
  const { user } = useAuth();
  const { academicYear } = useOutletContext() || { academicYear: '2025-2026' };
  const role = user?.role?.name;

  const [classes, setClasses] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [levels, setLevels] = useState([]);
  const [classmates, setClassmates] = useState([]);
  const [selectedClassStudents, setSelectedClassStudents] = useState([]);
  const [viewingClassStudents, setViewingClassStudents] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentClass, setCurrentClass] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const isStudent = role === 'Student';
  const isTeacher = role === 'Teacher';
  const isAdminOrScolarite = role === 'Admin' || role === 'Scolarite';

  const fetchData = async () => {
    try {
      setLoading(true);
      if (isStudent) {
        const classId = user?.student?.class_id;
        if (classId) {
          const res = await api.get(`/students?class_id=${classId}`);
          setClassmates(res.data);
        }
      } else {
        const [classesRes, filieresRes, levelsRes] = await Promise.all([
          api.get('/classes'),
          api.get('/filieres'),
          api.get('/academic-levels'),
        ]);
        setClasses(classesRes.data);
        setFilieres(filieresRes.data);
        setLevels(levelsRes.data);
      }
    } catch (err) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const viewClassmateList = async (classe) => {
    try {
      setViewingClassStudents(classe);
      const res = await api.get(`/students?class_id=${classe.id}`);
      setSelectedClassStudents(res.data);
    } catch {
      toast.error('Impossible de charger les étudiants de cette classe');
    }
  };

  const openModal = (classe = null) => {
    setCurrentClass(classe);
    setFormData(classe ? {
      name: classe.name || '',
      code: classe.code || '',
      academic_year: classe.academic_year || academicYear,
      filiere_id: classe.filiere_id || classe.filiere?.id || '',
      academic_level_id: classe.academic_level_id || classe.academic_level?.id || classe.academicLevel?.id || '',
    } : { ...EMPTY_FORM, academic_year: academicYear });
    setIsModalOpen(true);
  };

  const filteredClasses = useMemo(() => {
    return classes
      .filter((classe) => classe.academic_year === academicYear)
      .filter((classe) => {
        const haystack = `${classe.name} ${classe.code || ''} ${classe.level || ''} ${classe.filiere?.name || ''} ${classe.academicLevel?.name || ''}`.toLowerCase();
        return haystack.includes(searchTerm.toLowerCase());
      });
  }, [classes, searchTerm, academicYear]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      if (currentClass) {
        await api.put(`/classes/${currentClass.id}`, formData);
        toast.success('Classe mise à jour');
      } else {
        await api.post('/classes', formData);
        toast.success('Classe créée');
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
      toast.success('Classe supprimée');
      fetchData();
    } catch {
      toast.error('Suppression impossible');
    }
  };

  // Student "Mon Groupe" view
  if (isStudent) {
    const studentClass = user?.student?.classe;
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Mon Groupe</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Détails de votre classe et liste de vos camarades.
          </p>
        </div>

        {studentClass ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Class info card */}
            <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 to-purple-500/10 p-6 shadow-sm backdrop-blur-md dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
              <div className="flex items-center justify-between border-b border-primary/10 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">{studentClass.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Code: {studentClass.code || 'N/A'}</p>
                </div>
                <div className="rounded-2xl bg-primary/20 p-3 text-primary">
                  <GraduationCap className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Filière:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{studentClass.filiere?.name || 'Général'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Niveau:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{studentClass.level || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Année Académique:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{studentClass.academic_year || '2025-2026'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Nombre de camarades:</span>
                  <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">{classmates.length}</span>
                </div>
              </div>
            </div>

            {/* Classmates list */}
            <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="border-b border-slate-100 p-5 dark:border-slate-700">
                <h4 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Liste des camarades de classe
                </h4>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      {['Nom & Prénom', 'Email', 'Genre', 'Téléphone'].map((title) => (
                        <th key={title} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                    {loading ? (
                      <tr><td colSpan="4" className="px-6 py-8 text-center text-sm text-slate-500">Chargement...</td></tr>
                    ) : classmates.length === 0 ? (
                      <tr><td colSpan="4" className="px-6 py-8 text-center text-sm text-slate-500">Aucun camarade trouvé</td></tr>
                    ) : classmates.map((mate) => {
                      const isMe = mate.user_id === user.id;
                      return (
                        <tr key={mate.id} className={`${isMe ? 'bg-primary/5' : ''} hover:bg-slate-50/80 dark:hover:bg-slate-700/40`}>
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-slate-800 dark:text-white">
                              {mate.first_name} {mate.last_name}
                            </span>
                            {isMe && <span className="ml-2 rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary font-medium">Moi</span>}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                              {mate.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{mate.gender || '—'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                            {mate.phone ? (
                              <div className="flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5 text-slate-400" />
                                {mate.phone}
                              </div>
                            ) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-600">
            <GraduationCap className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 text-lg font-bold text-slate-800 dark:text-white">Non affecté</h3>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Vous n'êtes affecté à aucun groupe pour le moment. Veuillez contacter la Scolarité.</p>
          </div>
        )}
      </div>
    );
  }

  // Teacher / Admin / Scolarite views
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Classes & Groupes</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isAdminOrScolarite 
              ? "Gestion réelle de la structure académique : Filières et Classes." 
              : "Consultez les classes de l'établissement et les étudiants inscrits."}
          </p>
        </div>
        {isAdminOrScolarite && (
          <button onClick={() => openModal()} className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Ajouter une classe
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SummaryCard icon={Layers3} title="Filières" value={filieres.length || classes.reduce((acc, c) => c.filiere ? acc.add(c.filiere.name) : acc, new Set()).size} />
        <SummaryCard icon={GraduationCap} title="Classes actives" value={classes.length} />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="border-b border-slate-100 p-4 dark:border-slate-700">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Rechercher classe, filière ou niveau..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-primary dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                {['Classe', 'Filière', 'Niveau', 'Année', 'Étudiants', 'Actions'].map((title) => {
                  if (title === 'Actions' && !isAdminOrScolarite) return null;
                  return (
                    <th key={title} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {title}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-sm text-slate-500">Chargement...</td></tr>
              ) : filteredClasses.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-sm text-slate-500">Aucune classe trouvée</td></tr>
              ) : filteredClasses.map((classe) => (
                <tr key={classe.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40">
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => viewClassmateList(classe)} 
                      className="text-left group"
                    >
                      <p className="text-sm font-semibold text-slate-800 dark:text-white group-hover:text-primary transition">{classe.name}</p>
                      <p className="text-xs text-slate-400 group-hover:text-primary/75 transition">{classe.code || 'Sans code'}</p>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{classe.filiere?.name || '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{classe.academicLevel?.name || classe.level || '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{classe.academic_year || '—'}</td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => viewClassmateList(classe)} 
                      className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition flex items-center gap-1"
                    >
                      <Users className="h-3 w-3" />
                      {classe.students_count ?? 0}
                    </button>
                  </td>
                  {isAdminOrScolarite && (
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openModal(classe)} className="rounded-xl p-2 text-primary transition hover:bg-primary/10"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(classe.id)} className="rounded-xl p-2 text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-900/20"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Class Students Viewer Modal */}
      <Modal 
        isOpen={!!viewingClassStudents} 
        onClose={() => setViewingClassStudents(null)} 
        title={`Étudiants de la classe - ${viewingClassStudents?.name || ''}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  {['Matricule', 'Nom & Prénom', 'Email', 'Téléphone'].map((title) => (
                    <th key={title} className="px-6 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {selectedClassStudents.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-8 text-center text-sm text-slate-500">Aucun étudiant inscrit dans cette classe.</td></tr>
                ) : selectedClassStudents.map((stud) => (
                  <tr key={stud.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                    <td className="px-6 py-3 text-sm font-mono text-slate-500 dark:text-slate-400">{stud.matricule}</td>
                    <td className="px-6 py-3 text-sm font-semibold text-slate-800 dark:text-white">{stud.first_name} {stud.last_name}</td>
                    <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-300">{stud.email}</td>
                    <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-300">{stud.phone || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={() => setViewingClassStudents(null)} className="rounded-xl bg-slate-150 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600">
              Fermer
            </button>
          </div>
        </div>
      </Modal>

      {/* Class Create/Edit Modal */}
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
            <Field label="Filière">
              <select value={formData.filiere_id} onChange={(event) => setFormData({ ...formData, filiere_id: event.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                <option value="">Sélectionner...</option>
                {filieres.map((filiere) => <option key={filiere.id} value={filiere.id}>{filiere.name}</option>)}
              </select>
            </Field>
            <Field label="Année académique">
              <input value={formData.academic_year} onChange={(event) => setFormData({ ...formData, academic_year: event.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Field label="Niveau Académique (Statique)">
              <select value={formData.academic_level_id} onChange={(event) => setFormData({ ...formData, academic_level_id: event.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                <option value="">Sélectionner...</option>
                {levels.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}
              </select>
            </Field>
          </div>

          <div className="flex justify-end gap-3 pt-2">
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
