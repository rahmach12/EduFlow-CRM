import React, { useState, useEffect } from 'react';
import api from '../lib/axios';
import { Plus, Check, Search, CalendarOff, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import classNames from 'classnames';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Attendance Operations</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Log class sessions and mark student presences.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition shadow-md shadow-primary/20">
          <Plus className="h-4 w-4 mr-2" /> Start Session
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard2 key={i} />)
        ) : sessions.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              icon={CalendarOff}
              title="Aucune séance enregistrée"
              subtitle="Commencez l'appel pour enregistrer la première séance de présence."
              action={<button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition"><Plus className="h-4 w-4" /> Démarrer une séance</button>}
            />
          </div>
        ) : sessions.map(session => (
            <div key={session.id} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
                 <div className="flex justify-between items-start mb-3">
                     <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded">{session.classe?.name}</span>
                     <span className="text-xs text-slate-400 flex items-center"><CalendarOff className="w-3 h-3 mr-1"/> {session.date}</span>
                 </div>
                 <h4 className="font-bold text-lg text-slate-800 dark:text-white">{session.subject?.name}</h4>
                 <p className="text-sm text-slate-500 mb-4"><Clock className="w-4 h-4 inline mr-1"/>{session.start_time.slice(0,5)} - {session.end_time.slice(0,5)}</p>
                 
                 <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg flex justify-between items-center">
                     <div className="text-xs text-slate-500"><strong className="text-emerald-500">{session.records.filter(r=>r.status==='present').length}</strong> Presents</div>
                     <div className="text-xs text-slate-500"><strong className="text-amber-500">{session.records.filter(r=>r.status==='late').length}</strong> Retards</div>
                     <div className="text-xs text-slate-500"><strong className="text-red-500">{session.records.filter(r=>r.status==='absent').length}</strong> Absents</div>
                 </div>
            </div>
        ))}
      </div>

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
                 <label className="block text-sm mb-1">Date</label>
                 <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full border rounded p-2" />
             </div>
             <div className="flex gap-2">
                 <div className="w-1/2">
                    <label className="block text-sm mb-1">Start</label>
                    <input type="time" required value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })} className="w-full border rounded p-2 text-sm" />
                 </div>
                 <div className="w-1/2">
                    <label className="block text-sm mb-1">End</label>
                    <input type="time" required value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })} className="w-full border rounded p-2 text-sm" />
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
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50">Save Session</button>
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
