import React, { useState, useEffect } from 'react';
import api from '../lib/axios';
import { Briefcase, Plus, Upload, CheckCircle, Clock, AlertTriangle, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import InternshipManager from './InternshipManager';
import EmptyState from '../components/EmptyState';
import { SkeletonCard2 } from '../components/SkeletonLoader';

const StudentInternshipsView = () => {
  const { user } = useAuth();
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    type: 'PFE',
    company_name: '',
    supervisor_name: '',
    supervisor_email: '',
    start_date: '',
    end_date: '',
  });

  const [reportFile, setReportFile] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);

  const fetchInternships = async () => {
    try {
      const studentId = user?.student?.id;
      if (!studentId) return;
      const res = await api.get(`/internships?student_id=${studentId}`);
      setInternships(res.data);
    } catch {
      toast.error('Failed to load internships');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInternships();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/internships', {
        ...formData,
        student_id: user?.student?.id
      });
      toast.success('Internship request submitted!');
      setIsModalOpen(false);
      setFormData({ type: 'PFE', company_name: '', supervisor_name: '', supervisor_email: '', start_date: '', end_date: '' });
      fetchInternships();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadReport = async (internshipId) => {
    if (!reportFile) {
      toast.error('Please select a PDF file first.');
      return;
    }
    setUploadingId(internshipId);
    const fd = new FormData();
    fd.append('report', reportFile);
    try {
      await api.post(`/internships/${internshipId}/upload-report`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Report uploaded successfully!');
      setReportFile(null);
      fetchInternships();
    } catch (err) {
      toast.error('Upload failed. Must be a PDF < 10MB.');
    } finally {
      setUploadingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved': return <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> {status}</span>;
      case 'Rejected': return <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {status}</span>;
      default: return <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3"/> {status}</span>;
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" /> Mes Stages
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gérez vos demandes de stages PFE, PFA ou d'été.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition shadow-md shadow-primary/20"
        >
          <Plus className="h-4 w-4 mr-2" /> Nouvelle Demande
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard2 key={i} />)
        ) : internships.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              icon={Briefcase}
              title="Aucun stage enregistré"
              subtitle="Soumettez votre première demande de stage PFE, PFA ou d'été."
              action={<button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 shadow-md shadow-primary/20 transition"><Plus className="h-4 w-4" /> Nouvelle demande</button>}
            />
          </div>
        ) : (
          internships.map(intern => (
            <div key={intern.id} className="bg-white dark:bg-[#1E1B4B] rounded-2xl border border-slate-100 dark:border-[#2e2a6b] shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-2 py-1 bg-primary/10 text-primary font-bold text-xs rounded-lg uppercase tracking-wider">
                    {intern.type}
                  </span>
                  {getStatusBadge(intern.status)}
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{intern.company_name}</h3>
                
                <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <p><span className="font-medium text-slate-700 dark:text-slate-300">Période:</span> {intern.start_date} au {intern.end_date}</p>
                  <p><span className="font-medium text-slate-700 dark:text-slate-300">Encadrant:</span> {intern.supervisor_name || '—'}</p>
                  {intern.defense_date && (
                    <p className="text-primary font-bold">🎯 Soutenance le: {intern.defense_date}</p>
                  )}
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 dark:bg-[#0F172A]/50 border-t border-slate-100 dark:border-[#2e2a6b]">
                {intern.status === 'Approved' ? (
                  intern.report_file ? (
                     <div className="flex items-center text-sm text-emerald-600 font-medium">
                       <FileText className="h-4 w-4 mr-2" /> Rapport soumis
                     </div>
                  ) : (
                    <div className="flex items-center gap-2">
                       <input 
                         type="file" 
                         accept=".pdf"
                         onChange={e => setReportFile(e.target.files[0])}
                         className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                       />
                       <button 
                         onClick={() => handleUploadReport(intern.id)}
                         disabled={uploadingId === intern.id}
                         className="p-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                       >
                         <Upload className="h-4 w-4" />
                       </button>
                    </div>
                  )
                ) : (
                  <p className="text-xs text-slate-500 italic text-center">En attente de validation pour pouvoir soumettre le rapport.</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Demande de Stage">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type *</label>
               <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
                 className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                 <option value="PFE">PFE</option>
                 <option value="PFA">PFA</option>
                 <option value="Summer">Stage d'été</option>
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Entreprise *</label>
               <input required type="text" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})}
                 className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date début *</label>
               <input required type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})}
                 className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date fin *</label>
               <input required type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})}
                 className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nom Encadrant</label>
               <input type="text" value={formData.supervisor_name} onChange={e => setFormData({...formData, supervisor_name: e.target.value})}
                 className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Encadrant</label>
               <input type="email" value={formData.supervisor_email} onChange={e => setFormData({...formData, supervisor_email: e.target.value})}
                 className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
             </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-xl">Annuler</button>
            <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-sm text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50">
              {isSubmitting ? 'Envoi...' : 'Soumettre'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export const Internships = () => {
  const { user } = useAuth();
  if (user?.role?.name === 'Student') return <StudentInternshipsView />;
  return <InternshipManager />;
};

export default Internships;
