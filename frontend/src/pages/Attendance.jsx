import React, { useState, useEffect } from 'react';
import api from '../lib/axios';
import { Plus, Check, Search, CalendarOff, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import classNames from 'classnames';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { useAuth } from '../hooks/useAuth';
import { SkeletonCard2 } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';

// ─── Student Personal Attendance View ─────────────────────────────────────────
const StudentAttendanceView = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/attendance')
      .then(res => setSessions(res.data))
      .catch(() => toast.error("Failed to load attendance records."))
      .finally(() => setLoading(false));
  }, []);

  let absenceCount = 0;
  let retardCount = 0;
  
  const recordsFlat = sessions.map(s => {
      const rec = s.records[0]; // because backend specifically filtered to this student's record
      if (rec?.status === 'absent') absenceCount++;
      if (rec?.status === 'late') retardCount++;
      return { ...s, myRecord: rec };
  });

  const absenceRate = Math.round((absenceCount / 50) * 100);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Présence et Assiduité</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Consultez votre historique de présence par séance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={classNames(
          'rounded-2xl p-6 text-white shadow-lg',
          absenceRate > 30 ? 'bg-gradient-to-br from-red-500 to-rose-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'
        )}>
          <p className="text-white/70 text-xs uppercase tracking-wider font-medium">Taux d'Absences</p>
          <p className="text-4xl font-extrabold mt-2">{absenceRate}<span className="text-xl font-normal opacity-70">%</span></p>
          {absenceRate > 30
            ? <p className="mt-2 text-white/90 text-sm flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Seuil dépassé (30%)</p>
            : <p className="mt-2 text-white/90 text-sm flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Taux acceptable</p>
          }
        </div>

        <div className="bg-white dark:bg-[#1E1B4B] rounded-2xl p-6 border border-slate-100 dark:border-[#2e2a6b] shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-medium">Absences</p>
          <p className="text-4xl font-extrabold mt-2 text-red-500">{absenceCount}</p>
          <p className="text-sm text-slate-400 mt-1">Séances manquées</p>
        </div>

        <div className="bg-white dark:bg-[#1E1B4B] rounded-2xl p-6 border border-slate-100 dark:border-[#2e2a6b] shadow-sm">
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-medium">Retards</p>
          <p className="text-4xl font-extrabold mt-2 text-amber-500">{retardCount}</p>
          <p className="text-sm text-slate-400 mt-1">Arrivées tardives</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1E1B4B] rounded-2xl border border-slate-100 dark:border-[#2e2a6b] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-[#2e2a6b]">
          <h3 className="font-bold text-slate-800 dark:text-white">Historique des Séances</h3>
        </div>
        {recordsFlat.length === 0 ? (
          <div className="p-12 text-center text-slate-400">Aucune donnée trouvée.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-[#2e2a6b]">
              <thead className="bg-slate-50 dark:bg-[#0F172A]/50">
                <tr>
                  {['Date', 'Matière', 'Professeur', 'Statut', 'Raison'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2e2a6b]">
                {recordsFlat.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-[#2e2a6b]/50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-800 dark:text-white">
                      {row.date} <span className="text-xs text-slate-400 ml-2">{row.start_time.slice(0,5)}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{row.subject?.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{row.teacher?.user?.last_name}</td>
                    <td className="px-6 py-4">
                      {row.myRecord?.status === 'present' && <span className="text-emerald-600 bg-emerald-100 px-2 py-1 rounded text-xs">Présent</span>}
                      {row.myRecord?.status === 'absent' && <span className="text-red-600 bg-red-100 px-2 py-1 rounded text-xs">Absent</span>}
                      {row.myRecord?.status === 'late' && <span className="text-amber-600 bg-amber-100 px-2 py-1 rounded text-xs">En retard</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{row.myRecord?.reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Admin / Teacher Management View ─────────────────────────────────────────
const AdminAttendanceView = () => {
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Create Session Form State
  const [formData, setFormData] = useState({
    class_id: '', subject_id: '', date: new Date().toISOString().split('T')[0], start_time: '08:30', end_time: '10:00'
  });
  
  // Attendance Roster
  const [attendanceRoster, setAttendanceRoster] = useState({});

  const fetchData = async () => {
    try {
      const [sessRes, classRes, subRes, stdRes] = await Promise.all([
        api.get('/attendance'), api.get('/classes'), api.get('/subjects'), api.get('/students')
      ]);
      setSessions(sessRes.data);
      setClasses(classRes.data);
      setSubjects(subRes.data);
      setStudents(stdRes.data);
    } catch { toast.error("Failed to load attendance data."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // Update roster specifically for selected class
  useEffect(() => {
    if (formData.class_id) {
      const classStudents = students.filter(s => s.class_id === parseInt(formData.class_id));
      const roster = {};
      classStudents.forEach(s => {
        roster[s.id] = { status: 'present', reason: '' };
      });
      setAttendanceRoster(roster);
    }
  }, [formData.class_id, students]);

  const handleRosterChange = (studentId, field, value) => {
    setAttendanceRoster(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        records: Object.keys(attendanceRoster).map(studentId => ({
            student_id: parseInt(studentId),
            status: attendanceRoster[studentId].status,
            reason: attendanceRoster[studentId].reason
        }))
      };
      await api.post('/attendance', payload);
      toast.success("Attendance Session mapped!");
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save session.");
    } finally { setIsSubmitting(false); }
  };

  const filteredStudents = students.filter(s =>
    (`${s.first_name} ${s.last_name}`).toLowerCase().includes(searchTerm.toLowerCase()) &&
    (!selectedClass || s.class_id === selectedClass.id || s.classe?.name === selectedClass.name)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Gestion des Absences</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {selectedStudent ? `Absences de l'étudiant: ${selectedStudent.first_name} ${selectedStudent.last_name}` :
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
            <Plus className="h-4 w-4 mr-2" /> Démarrer Séance
          </button>
        </div>
      </div>

      {/* View 1: List of Classes */}
      {!selectedClass && !selectedStudent && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {loading ? (
            Array(6).fill(0).map((_, i) => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl"></div>)
          ) : classes.length === 0 ? (
             <div className="col-span-full"><EmptyState icon={Check} title="Aucune classe" subtitle="Il n'y a aucune classe disponible." /></div>
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
                    {students.filter(s => s.class_id === cls.id || s.classe?.name === cls.name).length} étudiant(s)
                  </p>
                </div>
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <Check className="h-5 w-5" />
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Taux d'Absences</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {filteredStudents.length === 0 ? (
                  <tr><td colSpan="3"><EmptyState icon={Check} title="Aucun étudiant" subtitle="Aucun étudiant trouvé dans cette classe." /></td></tr>
                ) : filteredStudents.map(student => {
                  const stAbsCount = sessions.reduce((acc, sess) => {
                     const r = sess.records?.find(rec => rec.student_id === student.id);
                     if (r?.status === 'absent') return acc + 1;
                     return acc;
                  }, 0);
                  const stRate = Math.round((stAbsCount / 50) * 100);

                  return (
                  <tr key={student.id} onClick={() => setSelectedStudent(student)} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
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
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${stRate >= 30 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                        {stRate}%
                      </span>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 3: Student Details */}
      {selectedStudent && (() => {
        let absenceCount = 0;
        let retardCount = 0;
        
        const studentSessions = sessions.filter(s => s.records?.some(r => r.student_id === selectedStudent.id));
        
        const recordsFlat = studentSessions.map(s => {
            const rec = s.records.find(r => r.student_id === selectedStudent.id);
            if (rec?.status === 'absent') absenceCount++;
            if (rec?.status === 'late') retardCount++;
            return { ...s, myRecord: rec };
        });

        const absenceRate = Math.round((absenceCount / 50) * 100);

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={classNames(
                'rounded-2xl p-6 text-white shadow-lg',
                absenceRate > 30 ? 'bg-gradient-to-br from-red-500 to-rose-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'
              )}>
                <p className="text-white/70 text-xs uppercase tracking-wider font-medium">Taux d'Absences</p>
                <p className="text-4xl font-extrabold mt-2">{absenceRate}<span className="text-xl font-normal opacity-70">%</span></p>
                {absenceRate > 30
                  ? <p className="mt-2 text-white/90 text-sm flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Seuil dépassé (30%)</p>
                  : <p className="mt-2 text-white/90 text-sm flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Taux acceptable</p>
                }
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-medium">Absences</p>
                <p className="text-4xl font-extrabold mt-2 text-red-500">{absenceCount}</p>
                <p className="text-sm text-slate-400 mt-1">Séances manquées</p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-medium">Retards</p>
                <p className="text-4xl font-extrabold mt-2 text-amber-500">{retardCount}</p>
                <p className="text-sm text-slate-400 mt-1">Arrivées tardives</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-white">Historique des Séances</h3>
              </div>
              {recordsFlat.length === 0 ? (
                <div className="p-12 text-center text-slate-400">Aucune donnée trouvée.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                      <tr>
                        {['Date', 'Matière', 'Professeur', 'Statut', 'Raison'].map(h => (
                          <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {recordsFlat.map(row => (
                        <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                          <td className="px-6 py-4 text-sm font-medium text-slate-800 dark:text-white">
                            {row.date} <span className="text-xs text-slate-400 ml-2">{row.start_time.slice(0,5)}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{row.subject?.name}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{row.teacher?.user?.last_name}</td>
                          <td className="px-6 py-4">
                            {row.myRecord?.status === 'present' && <span className="text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded text-xs font-semibold">Présent</span>}
                            {row.myRecord?.status === 'absent' && <span className="text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded text-xs font-semibold">Absent</span>}
                            {row.myRecord?.status === 'late' && <span className="text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded text-xs font-semibold">En retard</span>}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{row.myRecord?.reason || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Attendance Session">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Class *</label>
               <select required value={formData.class_id} onChange={e => setFormData({ ...formData, class_id: e.target.value })}
                 className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                 <option value="">Select...</option>
                 {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject *</label>
               <select required value={formData.subject_id} onChange={e => setFormData({ ...formData, subject_id: e.target.value })}
                 className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                 <option value="">Select...</option>
                 {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
               </select>
             </div>
             <div>
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                 <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
             </div>
             <div className="flex gap-2">
                 <div className="w-1/2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start</label>
                    <input type="time" required value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" />
                 </div>
                 <div className="w-1/2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End</label>
                    <input type="time" required value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" />
                 </div>
             </div>
          </div>

          {formData.class_id && Object.keys(attendanceRoster).length > 0 && (
              <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-3 pr-2">
                  {Object.keys(attendanceRoster).map(sid => {
                      const st = students.find(s=>s.id === parseInt(sid));
                      const status = attendanceRoster[sid].status;
                      return (
                      <div key={sid} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                          <div className="font-medium text-slate-800 dark:text-white mb-3 sm:mb-0">
                            {st?.user?.first_name} {st?.user?.last_name}
                          </div>
                          <div className="flex bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 overflow-hidden divide-x divide-slate-200 dark:divide-slate-600">
                              <button 
                                type="button" 
                                onClick={() => handleRosterChange(sid, 'status', 'present')}
                                className={classNames("flex-1 px-4 py-2 text-sm font-medium transition-colors", status === 'present' ? "bg-emerald-500 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700")}
                              >Présent</button>
                              <button 
                                type="button" 
                                onClick={() => handleRosterChange(sid, 'status', 'late')}
                                className={classNames("flex-1 px-4 py-2 text-sm font-medium transition-colors", status === 'late' ? "bg-amber-500 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700")}
                              >Retard</button>
                              <button 
                                type="button" 
                                onClick={() => handleRosterChange(sid, 'status', 'absent')}
                                className={classNames("flex-1 px-4 py-2 text-sm font-medium transition-colors", status === 'absent' ? "bg-red-500 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700")}
                              >Absent</button>
                          </div>
                      </div>
                  )})}
              </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">Annuler</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm bg-primary text-white rounded-lg disabled:opacity-50 hover:bg-primary/90">Enregistrer</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export const Attendance = () => {
  const { user } = useAuth();
  if (user?.role?.name === 'Student') return <StudentAttendanceView />;
  return <AdminAttendanceView />;
};
