import React, { useState, useEffect } from 'react';
import api from '../lib/axios';
import { Plus, Search, Download, BookOpen, TrendingUp, TrendingDown, Award, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { useAuth } from '../hooks/useAuth';
import { SkeletonTable } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import * as XLSX from 'xlsx';

// ── PDF HEADERS & FOOTERS (Tunisian Standard Formatting) ────────────────────
const drawTunisianHeader = (doc, title) => {
  // Left: University Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('EduFlow University', 14, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Etablissement Privé d\'Enseignement Supérieur', 14, 23);
  doc.text('Tunis, Tunisie', 14, 27);

  // Right: Ministry details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('République Tunisienne', 140, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Ministère de l\'Enseignement Supérieur', 140, 23);
  doc.text('et de la Recherche Scientifique', 140, 27);

  // Divider Line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(14, 32, 196, 32);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 27, 75); // Dark Indigo
  doc.text(title, 105, 45, { align: 'center' });
  doc.setTextColor(0, 0, 0); // reset
};

const drawFooter = (doc, pageNum) => {
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Ce bulletin de notes officiel est généré électroniquement par le portail EduFlow CRM.', 14, 280);
  doc.text(`Page ${pageNum}`, 196, 280, { align: 'right' });
};

const drawSignatureBlock = (doc, y, label = "Le Directeur de l'Établissement") => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Fait à Tunis, le ' + new Date().toLocaleDateString('fr-FR'), 130, y);
  doc.text(label, 130, y + 6);
  
  // Signature rectangle box
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.rect(130, y + 10, 55, 25);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('[Cachet & Signature]', 140, y + 24);
};

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
      } catch {
        toast.error('Failed to load grades.');
      } finally {
        setLoading(false);
      }
    };
    fetchMyGrades();
  }, [user]);

  const downloadMyBulletin = async () => {
    const loadingToast = toast.loading('Génération du bulletin...');
    try {
      const studentId = user?.student?.id;
      const res = await api.get(`/students/${studentId}/average`);
      const d = res.data;

      const doc = new jsPDF();
      drawTunisianHeader(doc, 'BULLETIN DE NOTES');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Étudiant(e) : ${d.student}`, 14, 54);
      doc.text(`Matricule : ${user?.student?.matricule || 'N/A'} | CIN : ${user?.cin || 'N/A'}`, 14, 60);
      doc.text(`Classe : ${user?.student?.classe?.name || '—'}`, 14, 66);
      doc.text(`Date de génération : ${new Date().toLocaleDateString('fr-FR')}`, 14, 72);

      const tableData = d.subjects.map(s => [
        s.subject,
        s.coefficient.toString(),
        s.cc !== '-' ? s.cc.toString() : '—',
        s.ds !== '-' ? s.ds.toString() : '—',
        s.tp !== '-' ? s.tp.toString() : '—',
        s.exam !== '-' ? s.exam.toString() : '—',
        s.average !== '-' ? s.average.toString() : '—'
      ]);

      doc.autoTable({
        startY: 78,
        head: [['Matière / Module', 'Coef', 'CC', 'DS', 'TP', 'Exam', 'Moyenne']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [30, 27, 75] },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'center' },
          5: { halign: 'center' },
          6: { halign: 'center', fontStyle: 'bold' }
        }
      });

      const y = doc.lastAutoTable.finalY + 12;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`Moyenne Générale : ${d.general_average} / 20`, 14, y);

      doc.setFont('helvetica', 'normal');
      doc.text(`Mention Académique : ${d.mention || '—'}`, 14, y + 6);
      doc.text(`Taux d'absence cumulé : ${d.absence_rate}%`, 14, y + 12);

      if (d.is_eliminated) {
        doc.setTextColor(220, 38, 38);
        doc.text('Statut : ÉLIMINÉ(E) POUR ABSENCES', 14, y + 18);
        doc.setTextColor(0, 0, 0);
      } else {
        doc.text(`Résultat : ${d.general_average >= 10 ? 'Admis(e)' : 'Ajourné(e)'}`, 14, y + 18);
      }

      drawSignatureBlock(doc, y + 28);
      drawFooter(doc, 1);

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
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ student_id: '', subject_id: '', type: 'CC', value: '' });

  const fetchData = async () => {
    try {
      const [studentsRes, subjectsRes, classesRes] = await Promise.all([
        api.get('/students'), 
        api.get('/subjects'),
        api.get('/classes').catch(() => ({ data: [] }))
      ]);
      setStudents(studentsRes.data);
      setSubjects(subjectsRes.data);
      if (classesRes.data && classesRes.data.length > 0) {
        setClasses(classesRes.data);
      } else {
        const uniqueClasses = [...new Set(studentsRes.data.map(s => s.classe?.name).filter(Boolean))];
        setClasses(uniqueClasses.map((name, i) => ({ id: i, name })));
      }
    } catch { toast.error('Failed to load data.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSelectStudent = async (student) => {
    setSelectedStudent(student);
    setDetailsLoading(true);
    try {
      const res = await api.get(`/students/${student.id}/average`);
      setStudentDetails(res.data);
    } catch {
      toast.error('Failed to load student details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/notes', formData);
      toast.success('Grade added successfully!');
      setIsModalOpen(false);
      setFormData({ student_id: '', subject_id: '', type: 'CC', value: '' });
      if (selectedStudent) {
        handleSelectStudent(selectedStudent);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add grade.');
    } finally { setIsSubmitting(false); }
  };

  const generatePDF = async (studentId) => {
    const t = toast.loading('Génération du bulletin...');
    try {
      const res = await api.get(`/students/${studentId}/average`);
      const d = res.data;
      const doc = new jsPDF();
      drawTunisianHeader(doc, 'BULLETIN DE NOTES');

      const currentStudent = students.find(s => s.id === studentId);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Étudiant(e) : ${d.student}`, 14, 54);
      doc.text(`Matricule : ${currentStudent?.matricule || 'N/A'} | CIN : ${currentStudent?.user?.cin || 'N/A'}`, 14, 60);
      doc.text(`Classe : ${currentStudent?.classe?.name || '—'}`, 14, 66);
      doc.text(`Date de génération : ${new Date().toLocaleDateString('fr-FR')}`, 14, 72);

      const tableData = d.subjects.map(s => [
        s.subject,
        s.coefficient.toString(),
        s.cc !== '-' ? s.cc.toString() : '—',
        s.ds !== '-' ? s.ds.toString() : '—',
        s.tp !== '-' ? s.tp.toString() : '—',
        s.exam !== '-' ? s.exam.toString() : '—',
        s.average !== '-' ? s.average.toString() : '—'
      ]);

      doc.autoTable({
        startY: 78,
        head: [['Matière / Module', 'Coef', 'CC', 'DS', 'TP', 'Exam', 'Moyenne']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [30, 27, 75] },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'center' },
          5: { halign: 'center' },
          6: { halign: 'center', fontStyle: 'bold' }
        }
      });

      const y = doc.lastAutoTable.finalY + 12;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`Moyenne Générale : ${d.general_average} / 20`, 14, y);

      doc.setFont('helvetica', 'normal');
      doc.text(`Mention Académique : ${d.mention || '—'}`, 14, y + 6);
      doc.text(`Taux d'absence cumulé : ${d.absence_rate}%`, 14, y + 12);

      if (d.is_eliminated) {
        doc.setTextColor(220, 38, 38);
        doc.text('Statut : ÉLIMINÉ(E) POUR ABSENCES', 14, y + 18);
        doc.setTextColor(0, 0, 0);
      } else {
        doc.text(`Résultat : ${d.general_average >= 10 ? 'Admis(e)' : 'Ajourné(e)'}`, 14, y + 18);
      }

      drawSignatureBlock(doc, y + 28);
      drawFooter(doc, 1);

      doc.save(`Bulletin_${d.student.replace(/\s+/g, '_')}.pdf`);
      toast.success('Bulletin téléchargé !', { id: t });
    } catch {
      toast.error('Erreur lors de la génération du PDF.', { id: t });
    }
  };

  const filteredStudents = students.filter(s =>
    (`${s.first_name} ${s.last_name}`).toLowerCase().includes(searchTerm.toLowerCase()) &&
    (!selectedClass || s.classe?.name === selectedClass.name)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Gestion des Notes</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {selectedStudent ? `Notes de l'étudiant: ${selectedStudent.first_name} ${selectedStudent.last_name}` :
             selectedClass ? `Classe: ${selectedClass.name}` :
             'Sélectionnez une classe pour voir les étudiants.'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(selectedClass || selectedStudent) && (
            <button 
              onClick={() => {
                if (selectedStudent) {
                  setSelectedStudent(null);
                  setStudentDetails(null);
                } else {
                  setSelectedClass(null);
                }
              }} 
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition"
            >
              Retour
            </button>
          )}
          <button onClick={() => setIsModalOpen(true)} className="flex items-center px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition shadow-md shadow-primary/20">
            <Plus className="h-4 w-4 mr-2" /> Ajouter Note
          </button>
        </div>
      </div>

      {/* View 1: List of Classes */}
      {!selectedClass && !selectedStudent && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {loading ? (
            Array(6).fill(0).map((_, i) => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl"></div>)
          ) : classes.length === 0 ? (
             <div className="col-span-full"><EmptyState icon={BookOpen} title="Aucune classe" subtitle="Il n'y a aucune classe disponible." /></div>
          ) : classes.map(cls => (
            <div 
              key={cls.id} 
              onClick={() => setSelectedClass(cls)}
              className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md cursor-pointer transition-all hover:border-primary/50 group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors">{cls.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {students.filter(s => s.classe?.name === cls.name).length} étudiant(s)
                  </p>
                </div>
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View 2: List of Students in selected Class */}
      {selectedClass && !selectedStudent && (
        <div className="bg-white dark:bg-slate-800 shadow rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input type="text" className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-primary focus:border-primary" placeholder="Rechercher un étudiant..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Étudiant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {filteredStudents.length === 0 ? (
                  <tr><td colSpan="3"><EmptyState icon={BookOpen} title="Aucun étudiant" subtitle="Aucun étudiant trouvé dans cette classe." /></td></tr>
                ) : filteredStudents.map(student => (
                  <tr key={student.id} onClick={() => handleSelectStudent(student)} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                          {student.first_name?.charAt(0)}
                        </div>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{student.first_name} {student.last_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{student.email}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={(e) => { e.stopPropagation(); generatePDF(student.id); }} className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition">
                        <Download className="h-3.5 w-3.5 mr-1" /> Bulletin
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 3: Student Details */}
      {selectedStudent && (
        <div className="space-y-6">
          {detailsLoading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div></div>
          ) : !studentDetails ? (
            <EmptyState icon={BookOpen} title="Détails indisponibles" subtitle="Impossible de charger les notes." />
          ) : (
            <div className="space-y-6">
              {/* Subjects and individual notes table */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 dark:text-white">Détail des notes par matière</h3>
                  <button onClick={() => generatePDF(selectedStudent.id)} className="text-primary hover:underline text-sm font-medium flex items-center gap-1">
                    <Download className="h-4 w-4" /> Bulletin PDF
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Matière</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Notes Détaillées</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Moy. Matière</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {studentDetails.subjects?.map((sub, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-900 dark:text-white">{sub.subject}</p>
                            <p className="text-xs text-slate-500">Coefficient: {sub.coefficient}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              {sub.notes && sub.notes.length > 0 ? sub.notes.map((n, idx) => (
                                <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                                  {n.type}: <strong className="ml-1 text-primary">{n.value}</strong>
                                </span>
                              )) : <span className="text-xs text-slate-400 italic">Aucune note</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${sub.average >= 10 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                              {sub.average ?? '—'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Averages Section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-2 uppercase tracking-wider">Semestre 1</p>
                  <p className="text-4xl font-extrabold text-slate-800 dark:text-white">
                    {studentDetails.sem1_average ?? 'N/A'}<span className="text-lg font-normal text-slate-400">/20</span>
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-2 uppercase tracking-wider">Semestre 2</p>
                  <p className="text-4xl font-extrabold text-slate-800 dark:text-white">
                    {studentDetails.sem2_average ?? 'N/A'}<span className="text-lg font-normal text-slate-400">/20</span>
                  </p>
                </div>
                <div className={`p-6 rounded-2xl shadow-lg text-center text-white bg-gradient-to-br ${studentDetails.general_average >= 10 ? 'from-emerald-500 to-teal-600' : 'from-red-500 to-rose-600'}`}>
                  <p className="text-white/80 text-sm font-medium mb-2 uppercase tracking-wider">Moyenne Générale</p>
                  <p className="text-4xl font-extrabold">
                    {studentDetails.general_average ?? 'N/A'}<span className="text-lg font-normal text-white/70">/20</span>
                  </p>
                  <p className="text-sm font-medium bg-white/20 inline-block px-3 py-1 rounded-full mt-3">
                    {studentDetails.status || (studentDetails.general_average >= 10 ? 'Admis' : 'Refusé')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Ajouter une Note">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Étudiant *</label>
            <select required name="student_id" value={formData.student_id} onChange={e => setFormData({ ...formData, student_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-primary focus:border-primary">
              <option value="">Sélectionner un étudiant...</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} {s.classe ? `(${s.classe.name})` : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Matière *</label>
            <select required name="subject_id" value={formData.subject_id} onChange={e => setFormData({ ...formData, subject_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-primary focus:border-primary">
              <option value="">Sélectionner une matière...</option>
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Note (/20) *</label>
              <input required type="number" step="0.25" min="0" max="20" value={formData.value} onChange={e => setFormData({ ...formData, value: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-primary focus:border-primary" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-5">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">Annuler</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50">
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
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
