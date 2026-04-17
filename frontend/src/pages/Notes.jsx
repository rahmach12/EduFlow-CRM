import React, { useState, useEffect } from 'react';
import api from '../lib/axios';
import { Plus, Search, Download, BookOpen, TrendingUp, TrendingDown, Award, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import { SkeletonTable } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import * as XLSX from 'xlsx';

// ─── Student Personal Notes View ───────────────────────────────────────────
const StudentNotesView = ({ user }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyGrades = async () => {
      try {
        const studentId = user?.student?.id;
        if (!studentId) return;
        const res = await api.get(`/students/${studentId}/average`);
        setData(res.data);
      } catch (e) {
        toast.error('Failed to load grades.');
      } finally {
        setLoading(false);
      }
    };
    fetchMyGrades();
  }, [user]);

  const downloadMyBulletin = async () => {
    const loadingToast = toast.loading('Generating PDF...');
    try {
      const studentId = user?.student?.id;
      const res = await api.get(`/students/${studentId}/average`);
      const d = res.data;

      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(124, 58, 237);
      doc.text('EduFlow — Bulletin de Notes', 14, 20);

      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Étudiant(e): ${d.student}`, 14, 35);
      doc.text(`Classe: ${user?.student?.classe?.name || '—'}`, 14, 42);
      doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 14, 49);

      const tableData = d.subjects.map(s => [s.subject, s.coefficient.toString(), s.average?.toString() ?? 'N/A']);
      doc.autoTable({
        startY: 58,
        head: [['Matière', 'Coefficient', 'Moyenne']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [124, 58, 237] },
      });

      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Moyenne Générale: ${d.general_average} / 20`, 14, finalY);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const statusColor = d.status === 'Excellent' ? [22, 163, 74] : d.status === 'Weak' ? [220, 38, 38] : [0, 0, 0];
      doc.setTextColor(...statusColor);
      doc.text(`Appréciation: ${d.status}`, 14, finalY + 8);

      doc.setTextColor(0, 0, 0);
      if (d.suggestions?.length > 0) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Recommandations (IA):', 14, finalY + 18);
        doc.setFont('helvetica', 'normal');
        d.suggestions.forEach((s, i) => doc.text(`• ${s}`, 16, finalY + 26 + i * 7));
      }

      doc.save(`Bulletin_${d.student.replace(/\s+/g, '_')}.pdf`);
      toast.success('Bulletin téléchargé !', { id: loadingToast });
    } catch {
      toast.error('Erreur lors de la génération du PDF.', { id: loadingToast });
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
    </div>
  );

  if (!data) return (
    <div className="text-center py-16 text-slate-400">
      <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-20" />
      <p>Aucune note disponible pour le moment.</p>
    </div>
  );

  const avgColor = data.general_average >= 15 ? 'text-emerald-600' : data.general_average >= 10 ? 'text-amber-500' : 'text-red-500';
  const avgBg = data.general_average >= 15 ? 'from-emerald-500 to-teal-600' : data.general_average >= 10 ? 'from-amber-500 to-orange-600' : 'from-red-500 to-rose-600';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Mes Notes & Résultats</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Consultez vos notes et téléchargez votre bulletin.</p>
        </div>
        <button
          onClick={downloadMyBulletin}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition shadow-md shadow-primary/20"
        >
          <Download className="h-4 w-4 mr-2" />
          Télécharger Bulletin PDF
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`rounded-2xl p-6 bg-gradient-to-br ${avgBg} text-white shadow-lg`}>
          <p className="text-white/70 text-xs uppercase tracking-wider font-medium">Moyenne Générale</p>
          <p className="text-4xl font-extrabold mt-2">{data.general_average}<span className="text-xl font-normal opacity-70">/20</span></p>
          <p className="mt-2 text-white/80 font-medium">{data.status}</p>
        </div>
        <div className="bg-white dark:bg-[#1E1B4B] rounded-2xl p-6 border border-slate-100 dark:border-[#2e2a6b] shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-medium">Taux d'Absences</p>
          <p className={`text-4xl font-extrabold mt-2 ${data.absence_rate > 30 ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>
            {data.absence_rate}<span className="text-xl font-normal opacity-60">%</span>
          </p>
          {data.absence_rate > 30 && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Seuil dépassé</p>}
        </div>
        <div className="bg-white dark:bg-[#1E1B4B] rounded-2xl p-6 border border-slate-100 dark:border-[#2e2a6b] shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-medium">Matières Évaluées</p>
          <p className="text-4xl font-extrabold mt-2 text-slate-800 dark:text-white">{data.subjects?.length}</p>
        </div>
      </div>

      {/* Subjects Table */}
      <div className="bg-white dark:bg-[#1E1B4B] rounded-2xl border border-slate-100 dark:border-[#2e2a6b] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-[#2e2a6b]">
          <h3 className="font-bold text-slate-800 dark:text-white">Détail par Matière</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-[#2e2a6b]">
            <thead className="bg-slate-50 dark:bg-[#0F172A]/50">
              <tr>
                {['Matière', 'Coefficient', 'Note /20', 'Appréciation'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#1E1B4B] divide-y divide-slate-100 dark:divide-[#2e2a6b]">
              {data.subjects?.map((sub, i) => {
                const avg = sub.average;
                const badge = avg >= 15 ? 'bg-emerald-100 text-emerald-700' : avg >= 10 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
                const appreciation = avg >= 15 ? 'Excellent' : avg >= 13 ? 'Bien' : avg >= 10 ? 'Passable' : 'Insuffisant';
                return (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-[#2e2a6b]/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-white">{sub.subject}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{sub.coefficient}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${badge}`}>
                        {avg ?? 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      {avg >= 10 ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
                      {appreciation}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Suggestions */}
      {data.suggestions?.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-5">
          <h4 className="font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2 mb-3">
            <Award className="h-5 w-5" /> Recommandations IA
          </h4>
          <ul className="space-y-1">
            {data.suggestions.map((s, i) => <li key={i} className="text-sm text-amber-700 dark:text-amber-300">• {s}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};

// ─── Admin / Teacher Notes Management View ─────────────────────────────────
const AdminNotesView = () => {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ student_id: '', subject_id: '', type: 'CC', value: '' });

  const fetchData = async () => {
    try {
      const [studentsRes, subjectsRes] = await Promise.all([api.get('/students'), api.get('/subjects')]);
      setStudents(studentsRes.data);
      setSubjects(subjectsRes.data);
    } catch { toast.error('Failed to load data.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/notes', formData);
      toast.success('Grade added successfully!');
      setIsModalOpen(false);
      setFormData({ student_id: '', subject_id: '', type: 'CC', value: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add grade.');
    } finally { setIsSubmitting(false); }
  };

  const generatePDF = async (studentId) => {
    const t = toast.loading('Generating PDF...');
    try {
      const res = await api.get(`/students/${studentId}/average`);
      const d = res.data;
      const doc = new jsPDF();
      doc.setFontSize(22); doc.setTextColor(124, 58, 237);
      doc.text('EduFlow — Bulletin de Notes', 14, 20);
      doc.setFontSize(12); doc.setTextColor(0, 0, 0);
      doc.text(`Étudiant(e): ${d.student}`, 14, 35);
      const tableData = d.subjects.map(s => [s.subject, s.coefficient.toString(), s.average?.toString() ?? 'N/A']);
      doc.autoTable({ startY: 45, head: [['Matière', 'Coefficient', 'Moyenne']], body: tableData, theme: 'grid', headStyles: { fillColor: [124, 58, 237] } });
      const y = doc.lastAutoTable.finalY + 10;
      doc.setFont('helvetica', 'bold');
      doc.text(`Moyenne Générale: ${d.general_average} / 20`, 14, y);
      doc.save(`Bulletin_${d.student.replace(/\s+/g, '_')}.pdf`);
      toast.success('PDF generated!', { id: t });
    } catch { toast.error('Failed to generate PDF.', { id: t }); }
  };

  const filteredStudents = students.filter(s =>
    (`${s.first_name} ${s.last_name}`).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Grades & Notes</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage student grades and generate report cards.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition shadow-md shadow-primary/20">
          <Plus className="h-4 w-4 mr-2" /> Add Grade
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 shadow rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="text" className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-primary focus:border-primary" placeholder="Search students..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                {['Student', 'Class', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <SkeletonTable rows={5} cols={3} />
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan="3">
                  <EmptyState
                    icon={BookOpen}
                    title={searchTerm ? 'Aucun résultat' : 'Aucune note enregistrée'}
                    subtitle={searchTerm ? `Aucun étudiant ne correspond à "${searchTerm}"` : 'Ajoutez une note pour commencer.'}
                    action={!searchTerm && <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-primary text-white rounded-xl text-sm hover:bg-primary/90">Ajouter une note</button>}
                  />
                </td></tr>
              ) : filteredStudents.map(student => (
                <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {student.first_name?.charAt(0)}
                      </div>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{student.first_name} {student.last_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{student.classe?.name || '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => generatePDF(student.id)} className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition">
                      <Download className="h-3.5 w-3.5 mr-1" /> Bulletin PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Grade">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Student *</label>
            <select required name="student_id" value={formData.student_id} onChange={e => setFormData({ ...formData, student_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-primary focus:border-primary">
              <option value="">Select student...</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject *</label>
            <select required name="subject_id" value={formData.subject_id} onChange={e => setFormData({ ...formData, subject_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-primary focus:border-primary">
              <option value="">Select subject...</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type *</label>
              <select name="type" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-primary focus:border-primary">
                <option value="CC">CC</option>
                <option value="DS">DS</option>
                <option value="TP">TP</option>
                <option value="Exam">Exam</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Grade (/20) *</label>
              <input required type="number" step="0.25" min="0" max="20" value={formData.value} onChange={e => setFormData({ ...formData, value: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-primary focus:border-primary" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50">
              {isSubmitting ? 'Saving...' : 'Save Grade'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ─── Main Exported Component ────────────────────────────────────────────────
export const Notes = () => {
  const { user } = useAuth();
  const role = user?.role?.name;

  if (role === 'Student') return <StudentNotesView user={user} />;
  return <AdminNotesView />;
};
