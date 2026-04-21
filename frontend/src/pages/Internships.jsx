import React, { useEffect, useMemo, useState } from 'react';
import { Briefcase, CalendarDays, FileText, Plus, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import Modal from '../components/Modal';
import { useAuth } from '../hooks/useAuth';
import InternshipManager from './InternshipManager';

const StudentInternshipsView = () => {
  const { user } = useAuth();
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportFile, setReportFile] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    company_name: '',
    supervisor_name: '',
    supervisor_email: '',
    start_date: '',
    end_date: '',
  });

  const fetchInternships = async () => {
    try {
      const studentId = user?.student?.id;
      if (!studentId) {
        return;
      }
      const internshipsRes = await api.get(`/internships?student_id=${studentId}`);
      setInternships(internshipsRes.data);
    } catch {
      toast.error('Chargement des stages impossible');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInternships();
  }, [user]);

  const expectedType = useMemo(() => {
    const slug = user?.student?.classe?.academicLevel?.slug;
    if (['licence-1', 'cycle-1', 'master-1'].includes(slug)) {
      return 'Stage obligatoire';
    }
    if (['licence-2', 'cycle-2'].includes(slug)) {
      return 'PFA';
    }
    if (['licence-3', 'cycle-3', 'master-2'].includes(slug)) {
      return 'PFE';
    }
    return 'Stage d\'ete';
  }, [user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/internships', {
        ...formData,
        student_id: user?.student?.id,
        type: expectedType,
      });
      toast.success('Demande de stage soumise');
      setIsModalOpen(false);
      setFormData({ title: '', company_name: '', supervisor_name: '', supervisor_email: '', start_date: '', end_date: '' });
      fetchInternships();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Soumission impossible');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadReport = async (internshipId) => {
    if (!reportFile) {
      toast.error('Selectionnez un PDF');
      return;
    }

    setUploadingId(internshipId);
    const form = new FormData();
    form.append('report', reportFile);

    try {
      await api.post(`/internships/${internshipId}/upload-report`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Rapport depose');
      setReportFile(null);
      fetchInternships();
    } catch {
      toast.error('Depot du rapport impossible');
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-800 dark:text-white">
            <Briefcase className="h-6 w-6 text-primary" />
            Mes stages
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Filiere: {user?.student?.classe?.filiere?.name || 'N/A'} · Niveau: {user?.student?.classe?.academicLevel?.name || 'N/A'} · Type attendu: {expectedType}
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Nouvelle demande
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StudentStat title="Demandes" value={internships.length} />
        <StudentStat title="Approuvees" value={internships.filter((internship) => internship.status === 'Approved').length} />
        <StudentStat title="Rapports deposés" value={internships.filter((internship) => internship.report_file).length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800">Chargement...</div>
        ) : internships.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-600 dark:bg-slate-800">
            <p className="text-lg font-semibold text-slate-800 dark:text-white">Aucune demande de stage</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Soumettez votre premiere demande pour lancer la validation.</p>
          </div>
        ) : internships.map((internship) => (
          <div key={internship.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{internship.type}</p>
                <h3 className="mt-3 text-lg font-bold text-slate-800 dark:text-white">{internship.company_name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{internship.title || 'Sujet non precise'}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${internship.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : internship.status === 'Rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                {internship.status}
              </span>
            </div>

            <div className="mt-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" /> {internship.start_date} → {internship.end_date}</p>
              <p>Encadrant: {internship.supervisor_name || 'Non renseigne'}</p>
              {internship.rejection_reason && <p className="text-rose-500">Motif de rejet: {internship.rejection_reason}</p>}
              {internship.defense_date && <p className="text-primary">Soutenance: {internship.defense_date} · {internship.defense_room || 'Salle a venir'}</p>}
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-700/30">
              {internship.status === 'Approved' ? (
                internship.report_file ? (
                  <p className="flex items-center gap-2 text-sm font-medium text-emerald-600"><FileText className="h-4 w-4" /> Rapport deja depose</p>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input type="file" accept=".pdf" onChange={(event) => setReportFile(event.target.files?.[0] || null)} className="text-xs text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:font-medium file:text-primary" />
                    <button onClick={() => handleUploadReport(internship.id)} disabled={uploadingId === internship.id} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                      <Upload className="h-4 w-4" />
                      {uploadingId === internship.id ? 'Envoi...' : 'Deposer le rapport'}
                    </button>
                  </div>
                )
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Le depot du rapport sera disponible apres approbation du stage.</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouvelle demande de stage">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
            Type automatiquement applique selon votre niveau: <strong>{expectedType}</strong>
          </div>
          <Field label="Sujet / titre">
            <input value={formData.title} onChange={(event) => setFormData({ ...formData, title: event.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
          </Field>
          <Field label="Entreprise">
            <input value={formData.company_name} onChange={(event) => setFormData({ ...formData, company_name: event.target.value })} required className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Date debut">
              <input type="date" value={formData.start_date} onChange={(event) => setFormData({ ...formData, start_date: event.target.value })} required className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </Field>
            <Field label="Date fin">
              <input type="date" value={formData.end_date} onChange={(event) => setFormData({ ...formData, end_date: event.target.value })} required className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Encadrant">
              <input value={formData.supervisor_name} onChange={(event) => setFormData({ ...formData, supervisor_name: event.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </Field>
            <Field label="Email encadrant">
              <input type="email" value={formData.supervisor_email} onChange={(event) => setFormData({ ...formData, supervisor_email: event.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </Field>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300">Annuler</button>
            <button type="submit" disabled={isSubmitting} className="rounded-xl bg-primary px-5 py-2 text-sm font-medium text-white disabled:opacity-50">
              {isSubmitting ? 'Envoi...' : 'Soumettre'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const StudentStat = ({ title, value }) => (
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

export const Internships = () => {
  const { user } = useAuth();
  if (user?.role?.name === 'Student') {
    return <StudentInternshipsView />;
  }
  return <InternshipManager />;
};

export default Internships;
