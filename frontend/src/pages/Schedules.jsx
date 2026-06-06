import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../lib/axios';
import { 
  Calendar, 
  Plus, 
  Sparkles, 
  Trash2, 
  Edit, 
  Download, 
  FileSpreadsheet, 
  Settings, 
  AlertTriangle,
  User, 
  BookOpen, 
  Home, 
  MapPin, 
  Check, 
  X, 
  ChevronRight,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { useAuth } from '../hooks/useAuth';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const DAYS = [
  { english: 'Monday', french: 'Lundi' },
  { english: 'Tuesday', french: 'Mardi' },
  { english: 'Wednesday', french: 'Mercredi' },
  { english: 'Thursday', french: 'Jeudi' },
  { english: 'Friday', french: 'Vendredi' },
  { english: 'Saturday', french: 'Samedi' }
];

export default function Schedules() {
  const { user } = useAuth();
  const { academicYear } = useOutletContext() || { academicYear: localStorage.getItem('academic_year') || '2025-2026' };
  const role = user?.role?.name;
  const isAdminOrScolarite = role === 'Admin' || role === 'Scolarite';
  const isTeacher = role === 'Teacher';
  const isStudent = role === 'Student';

  // API Data
  const [schedules, setSchedules] = useState([]);
  const [options, setOptions] = useState({
    classes: [],
    subjects: [],
    teachers: [],
    rooms: [],
    semesters: [],
    time_slots: []
  });
  
  // Filtering & View state
  const [viewPerspective, setViewPerspective] = useState('class'); // 'class', 'teacher', 'room'
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [loading, setLoading] = useState(true);
  const [optionsLoaded, setOptionsLoaded] = useState(false);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [isAvailModalOpen, setIsAvailModalOpen] = useState(false);
  
  // Form states
  const [currentSession, setCurrentSession] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [genSemesterId, setGenSemesterId] = useState('');
  const [genResults, setGenResults] = useState(null);
  const [genLoading, setGenLoading] = useState(false);
  
  // Availability Editor states
  const [availTeacherId, setAvailTeacherId] = useState('');
  const [availMatrix, setAvailMatrix] = useState({}); // key: "day_of_week:time_slot_id" => boolean
  const [availLoading, setAvailLoading] = useState(false);

  const [formData, setFormData] = useState({
    class_id: '',
    group_id: '',
    subject_id: '',
    teacher_id: '',
    room_id: '',
    semester_id: '',
    time_slot_id: '',
    day_of_week: 'Monday',
    type: 'Cours',
    frequency: 'weekly'
  });

  // Fetch initial data
  const fetchOptions = async (retries = 3) => {
    try {
      const res = await api.get('/schedules/options?_t=' + new Date().getTime());
      console.log('Schedule options loaded:', res.data);
      setOptions(res.data);
      
      // Auto-select active semester
      const activeSem = res.data.semesters.find(s => s.is_active) || res.data.semesters[0];
      if (activeSem) {
        setSelectedSemester(activeSem.id.toString());
        setGenSemesterId(activeSem.id.toString());
      }

      // Auto-select first option based on role
      const filteredCls = res.data.classes.filter(c => c.academic_year === academicYear);
      if (isStudent && user?.student?.class_id) {
        setSelectedClass(user.student.class_id.toString());
      } else if (isTeacher && user?.teacher?.id) {
        setSelectedTeacher(user.teacher.id.toString());
        setAvailTeacherId(user.teacher.id.toString());
      } else {
        if (filteredCls.length > 0) setSelectedClass(filteredCls[0].id.toString());
        if (res.data.teachers.length > 0) setSelectedTeacher(res.data.teachers[0].id.toString());
        if (res.data.rooms.length > 0) setSelectedRoom(res.data.rooms[0].id.toString());
      }
      setOptionsLoaded(true);
    } catch (err) {
      console.error('Failed to load schedule options:', err);
      if (retries > 1) {
        console.log(`Retrying fetchOptions... (${retries - 1} retries left)`);
        setTimeout(() => fetchOptions(retries - 1), 2000);
      } else {
        const errorDetail = err.response?.data?.message || err.message || '';
        toast.error(`Erreur lors du chargement des options : ${errorDetail}`);
        setOptionsLoaded(true);
      }
    }
  };


  const fetchSchedules = async () => {
    if (!selectedSemester) {
      setSchedules([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      let url = `/schedules?semester_id=${selectedSemester}`;
      
      // Apply filters depending on the chosen view perspective or user role
      if (isStudent) {
        url += `&class_id=${user?.student?.class_id || ''}`;
      } else if (isTeacher) {
        url += `&teacher_id=${user?.teacher?.id || ''}`;
      } else {
        if (viewPerspective === 'class' && selectedClass) {
          url += `&class_id=${selectedClass}`;
        } else if (viewPerspective === 'teacher' && selectedTeacher) {
          url += `&teacher_id=${selectedTeacher}`;
        } else if (viewPerspective === 'room' && selectedRoom) {
          url += `&room_id=${selectedRoom}`;
        }
      }

      const res = await api.get(url);
      setSchedules(res.data);
    } catch (err) {
      toast.error("Impossible de charger l'emploi du temps.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    if (optionsLoaded && options.classes.length > 0) {
      const filteredCls = options.classes.filter(c => c.academic_year === academicYear);
      if (!isStudent && !isTeacher) {
        const isCurrentClassInFiltered = filteredCls.some(c => c.id.toString() === selectedClass);
        if (!isCurrentClassInFiltered && filteredCls.length > 0) {
          setSelectedClass(filteredCls[0].id.toString());
        } else if (filteredCls.length === 0) {
          setSelectedClass('');
        }
      }
    }
  }, [academicYear, optionsLoaded, options.classes, isStudent, isTeacher, selectedClass]);

  useEffect(() => {
    if (optionsLoaded) {
      fetchSchedules();
    }
  }, [optionsLoaded, selectedSemester, viewPerspective, selectedClass, selectedTeacher, selectedRoom]);

  // Load Teacher Availabilities
  const loadAvailabilities = async (teacherId) => {
    if (!teacherId) return;
    setAvailLoading(true);
    try {
      const res = await api.get(`/schedules/teachers/${teacherId}/availabilities`);
      const matrix = {};
      
      // Seed default all available
      DAYS.forEach(day => {
        options.time_slots.forEach(slot => {
          matrix[`${day.english}:${slot.id}`] = true;
        });
      });

      // Override with DB entries
      res.data.forEach(item => {
        matrix[`${item.day_of_week}:${item.time_slot_id}`] = !!item.is_available;
      });

      setAvailMatrix(matrix);
    } catch (err) {
      toast.error("Erreur lors du chargement des disponibilités.");
    } finally {
      setAvailLoading(false);
    }
  };

  useEffect(() => {
    if (isAvailModalOpen) {
      loadAvailabilities(availTeacherId);
    }
  }, [availTeacherId, isAvailModalOpen]);

  // Handle Drag & Drop
  const handleDragStart = (e, sessionId) => {
    if (!isAdminOrScolarite) return;
    e.dataTransfer.setData('text/plain', sessionId);
  };

  const handleDrop = async (e, day, slotId) => {
    if (!isAdminOrScolarite) return;
    e.preventDefault();
    const sessionId = e.dataTransfer.getData('text/plain');
    if (!sessionId) return;

    const session = schedules.find(s => s.id === parseInt(sessionId, 10));
    if (!session) return;

    // Check if anything changed
    if (session.day_of_week === day && session.time_slot_id === slotId) return;

    // Call update API with updated day and slot
    const payload = {
      class_id: session.class_id,
      group_id: session.group_id,
      subject_id: session.subject_id,
      teacher_id: session.teacher_id,
      room_id: session.room_id,
      semester_id: session.semester_id,
      time_slot_id: slotId,
      day_of_week: day,
      type: session.type,
      frequency: session.frequency
    };

    const loadingToast = toast.loading("Déplacement de la séance...");
    try {
      await api.put(`/schedules/${session.id}`, payload);
      toast.success("Séance déplacée avec succès !", { id: loadingToast });
      fetchSchedules();
    } catch (err) {
      const errorMsg = err.response?.data?.errors?.join('\n') || err.response?.data?.message || "Erreur de conflit.";
      toast.error(
        <div className="space-y-1">
          <p className="font-bold text-red-400">Conflit détecté :</p>
          <p className="text-xs whitespace-pre-line">{errorMsg}</p>
        </div>, 
        { id: loadingToast, duration: 5000 }
      );
    }
  };

  // Open Edit/Add Modal
  const openEditModal = (session = null) => {
    if (session) {
      setCurrentSession(session);
      setFormData({
        class_id: session.class_id.toString(),
        group_id: session.group_id ? session.group_id.toString() : '',
        subject_id: session.subject_id.toString(),
        teacher_id: session.teacher_id.toString(),
        room_id: session.room_id.toString(),
        semester_id: session.semester_id.toString(),
        time_slot_id: session.time_slot_id.toString(),
        day_of_week: session.day_of_week,
        type: session.type,
        frequency: session.frequency
      });
    } else {
      const filteredCls = options.classes.filter(c => c.academic_year === academicYear);
      setCurrentSession(null);
      setFormData({
        class_id: selectedClass || (filteredCls[0]?.id || '').toString(),
        group_id: '',
        subject_id: (options.subjects[0]?.id || '').toString(),
        teacher_id: (options.teachers[0]?.id || '').toString(),
        room_id: selectedRoom || (options.rooms[0]?.id || '').toString(),
        semester_id: selectedSemester || (options.semesters[0]?.id || '').toString(),
        time_slot_id: (options.time_slots[0]?.id || '').toString(),
        day_of_week: 'Monday',
        type: 'Cours',
        frequency: 'weekly'
      });
    }
    setIsEditModalOpen(true);
  };

  // Submit manual session
  const handleSubmitSession = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { ...formData, group_id: formData.group_id || null };
      if (currentSession) {
        await api.put(`/schedules/${currentSession.id}`, payload);
        toast.success("Séance mise à jour avec succès !");
      } else {
        await api.post('/schedules', payload);
        toast.success("Séance ajoutée avec succès !");
      }
      setIsEditModalOpen(false);
      fetchSchedules();
    } catch (err) {
      const errorMsg = err.response?.data?.errors?.join(', ') || err.response?.data?.message || "Erreur de validation.";
      toast.error(`Impossible d'enregistrer : ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete session
  const handleDeleteSession = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette séance ?")) return;
    try {
      await api.delete(`/schedules/${id}`);
      toast.success("Séance supprimée avec succès !");
      fetchSchedules();
    } catch (err) {
      toast.error("Erreur lors de la suppression.");
    }
  };

  // Run automatic generation
  const handleAutoGenerate = async (e) => {
    e.preventDefault();
    console.log('handleAutoGenerate called, genSemesterId:', genSemesterId);
    if (!genSemesterId) {
      toast.error("Veuillez sélectionner un semestre cible.");
      return;
    }
    setGenLoading(true);
    setGenResults(null);
    try {
      const res = await api.post('/schedules/generate', { semester_id: genSemesterId });
      console.log('Generation results:', res.data);
      setGenResults(res.data);
      toast.success("Emploi du temps généré automatiquement !");
      fetchSchedules();
    } catch (err) {
      console.error('Generation error:', err);
      toast.error(err.response?.data?.message || "Erreur pendant la génération.");
    } finally {
      setGenLoading(false);
    }
  };

  // Save availabilities
  const handleSaveAvailabilities = async () => {
    setAvailLoading(true);
    try {
      const availArray = Object.keys(availMatrix).map(key => {
        const [day, slotId] = key.split(':');
        return {
          day_of_week: day,
          time_slot_id: parseInt(slotId, 10),
          is_available: availMatrix[key]
        };
      });

      await api.post(`/schedules/teachers/${availTeacherId}/availabilities`, { availabilities: availArray });
      toast.success("Disponibilités enregistrées avec succès !");
      setIsAvailModalOpen(false);
    } catch (err) {
      toast.error("Erreur lors de l'enregistrement des disponibilités.");
    } finally {
      setAvailLoading(false);
    }
  };

  // Helper to toggle single avail matrix element
  const toggleAvailCell = (day, slotId) => {
    const key = `${day}:${slotId}`;
    setAvailMatrix(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Client-side PDF export
  const exportPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(18);
    doc.setTextColor(124, 58, 237);
    
    let title = "EduFlow CRM — Emploi du Temps";
    const sem = options.semesters.find(s => s.id === parseInt(selectedSemester, 10))?.name || "";
    
    if (isStudent) {
      title += ` · Classe : ${filteredClasses.find(c => c.id === parseInt(selectedClass, 10))?.name || "Ma Classe"}`;
    } else if (isTeacher) {
      title += ` · Enseignant : Prof. ${options.teachers.find(t => t.id === parseInt(selectedTeacher, 10))?.user.last_name || "Moi"}`;
    } else {
      if (viewPerspective === 'class') {
        title += ` · Classe : ${filteredClasses.find(c => c.id === parseInt(selectedClass, 10))?.name || "Aucune"}`;
      } else if (viewPerspective === 'teacher') {
        title += ` · Enseignant : Prof. ${options.teachers.find(t => t.id === parseInt(selectedTeacher, 10))?.user.last_name || "Aucun"}`;
      } else {
        title += ` · Salle : ${options.rooms.find(r => r.id === parseInt(selectedRoom, 10))?.code || "Aucune"}`;
      }
    }
    
    doc.text(title, 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Semestre : ${sem} · Exporté le ${new Date().toLocaleDateString('fr-FR')}`, 14, 21);

    // Build table columns and rows
    const headers = [['Jour', ...options.time_slots.map(s => `${s.name}\n(${s.start_time.slice(0,5)} - ${s.end_time.slice(0,5)})`)]];
    
    const rows = DAYS.map(day => {
      const rowData = [day.french];
      options.time_slots.forEach(slot => {
        const cellSessions = filteredSchedules.filter(s => s.day_of_week === day.english && s.time_slot_id === slot.id);
        if (cellSessions.length === 0) {
          rowData.push('—');
        } else {
          rowData.push(cellSessions.map(s => {
            const groupStr = s.group ? ` [${s.group.name}]` : '';
            const roomStr = viewPerspective !== 'room' ? ` (${s.room?.code})` : '';
            const teacherStr = viewPerspective !== 'teacher' ? ` · Prof. ${s.teacher?.user?.last_name || ''}` : '';
            return `${s.subject?.name} (${s.type})${groupStr}${roomStr}${teacherStr}`;
          }).join('\n\n'));
        }
      });
      return rowData;
    });

    doc.autoTable({
      startY: 28,
      head: headers,
      body: rows,
      headStyles: { fillColor: [124, 58, 237], halign: 'center', valign: 'middle' },
      bodyStyles: { fontSize: 8, halign: 'center', valign: 'middle' },
      theme: 'grid',
      columnStyles: { 0: { fontStyle: 'bold', width: 25 } }
    });

    doc.save(`Emploi_du_temps_${sem.replace(' ', '_')}.pdf`);
    toast.success("PDF Exporté !");
  };

  // Client-side Excel export
  const exportExcel = () => {
    const semName = options.semesters.find(s => s.id === parseInt(selectedSemester, 10))?.name || "Semestre";
    const data = [];
    
    DAYS.forEach(day => {
      const row = { 'Jour': day.french };
      options.time_slots.forEach(slot => {
        const cellSessions = filteredSchedules.filter(s => s.day_of_week === day.english && s.time_slot_id === slot.id);
        row[`${slot.name} (${slot.start_time.slice(0,5)}-${slot.end_time.slice(0,5)})`] = cellSessions.map(s => {
          const groupStr = s.group ? ` [${s.group.name}]` : '';
          const roomStr = ` (${s.room?.code})`;
          const teacherStr = ` · Prof. ${s.teacher?.user?.last_name || ''}`;
          return `${s.subject?.name} (${s.type})${groupStr}${roomStr}${teacherStr}`;
        }).join(' | ');
      });
      data.push(row);
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Emploi du Temps');
    XLSX.writeFile(wb, `Emploi_du_temps_${semName.replace(' ', '_')}.xlsx`);
    toast.success("Excel Exporté !");
  };

  // Helper to extract background color opacity for subject cards
  const getSubjectColorStyles = (hexColor) => {
    const color = hexColor || '#6366f1';
    return {
      borderLeft: `4px solid ${color}`,
      backgroundColor: `${color}10`,
      color: color
    };
  };

  const filteredClasses = options.classes.filter(c => c.academic_year === academicYear);
  const filteredSchedules = schedules.filter(s => !s.classe || s.classe.academic_year === academicYear);

  return (
    <div className="space-y-6">
      {/* Title Bar & Main Actions */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Emploi du Temps Universitaire
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Génération automatique, modification manuelle et grille de détection des conflits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={exportExcel} className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition shadow-sm">
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium transition shadow-sm">
            <Download className="h-4 w-4" /> PDF
          </button>

          {isAdminOrScolarite && (
            <>
              <button onClick={() => setIsGenModalOpen(true)} className="btn-generate text-sm">
                <Sparkles className="h-4 w-4" /> Génération Auto
              </button>
              <button onClick={() => setIsAvailModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium transition border border-slate-200 dark:border-slate-700">
                <Settings className="h-4 w-4" /> Disponibilités
              </button>
              <button onClick={() => openEditModal()} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary/20 transition">
                <Plus className="h-4 w-4" /> Ajouter Séance
              </button>
            </>
          )}

          {isTeacher && (
            <button onClick={() => setIsAvailModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl text-sm font-semibold transition">
              <Settings className="h-4 w-4" /> Mes Disponibilités
            </button>
          )}
        </div>
      </div>

      {/* Filter and Perspective Selectors */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row flex-wrap items-center gap-4 justify-between">
        
        {/* Semester Selection */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Semestre:</span>
          <select 
            value={selectedSemester} 
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary w-full md:w-auto"
          >
            <option value="">Sélectionner</option>
            {options.semesters.map(sem => (
              <option key={sem.id} value={sem.id.toString()}>{sem.name} {sem.is_active ? '(Actif)' : ''}</option>
            ))}
          </select>
        </div>

        {/* Dynamic Filters depending on view perspective */}
        {!isStudent && !isTeacher && (
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            {/* View Perspective Selector */}
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
              <button 
                onClick={() => setViewPerspective('class')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${viewPerspective === 'class' ? 'bg-white dark:bg-slate-700 text-primary dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                Par Classe
              </button>
              <button 
                onClick={() => setViewPerspective('teacher')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${viewPerspective === 'teacher' ? 'bg-white dark:bg-slate-700 text-primary dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                Par Enseignant
              </button>
              <button 
                onClick={() => setViewPerspective('room')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${viewPerspective === 'room' ? 'bg-white dark:bg-slate-700 text-primary dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                Par Salle
              </button>
            </div>

            {/* Filter Dropdown */}
            {viewPerspective === 'class' && (
              <select 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                {filteredClasses.map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
              </select>
            )}

            {viewPerspective === 'teacher' && (
              <select 
                value={selectedTeacher} 
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                {options.teachers.map(t => <option key={t.id} value={t.id.toString()}>Prof. {t.user.first_name} {t.user.last_name}</option>)}
              </select>
            )}

            {viewPerspective === 'room' && (
              <select 
                value={selectedRoom} 
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                {options.rooms.map(r => <option key={r.id} value={r.id.toString()}>{r.name} ({r.code} - {r.type})</option>)}
              </select>
            )}
          </div>
        )}

        {/* Displaying Locked Context for Students or Teachers */}
        {(isStudent || isTeacher) && (
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {isStudent && `Emploi du temps de la classe : ${user?.student?.classe?.name || 'Inconnue'}`}
            {isTeacher && `Mes cours programmés (Prof. ${user?.last_name})`}
          </div>
        )}
      </div>

      {/* Grid Schedule Timetable */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Chargement de la grille d'emploi du temps...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 border-collapse table-fixed">
              {/* Header: Time Slots */}
              <thead className="bg-slate-50 dark:bg-slate-950">
                <tr>
                  <th scope="col" className="w-[10%] px-4 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-r border-slate-200 dark:border-slate-800">
                    Jours
                  </th>
                  {options.time_slots.map(slot => (
                    <th key={slot.id} scope="col" className="px-4 py-4 text-center border-r border-slate-200 dark:border-slate-800">
                      <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{slot.name}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5 flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3" />
                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Body: Days x Grid Slots */}
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                {DAYS.map(day => (
                  <tr key={day.english} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                    {/* Day label */}
                    <td className="px-4 py-6 text-center font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/20">
                      {day.french}
                    </td>

                    {/* Time slot cells */}
                    {options.time_slots.map(slot => {
                      const cellSessions = filteredSchedules.filter(
                        s => s.day_of_week === day.english && s.time_slot_id === slot.id
                      );

                      return (
                        <td 
                          key={slot.id} 
                          className="px-2 py-3 border-r border-slate-200 dark:border-slate-800 align-top min-h-[120px] transition-all"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => handleDrop(e, day.english, slot.id)}
                        >
                          <div className="space-y-2 min-h-[80px] flex flex-col justify-center">
                            {cellSessions.length === 0 ? (
                              <div className="text-center text-xs text-slate-300 dark:text-slate-600 italic">
                                Libre
                              </div>
                            ) : (
                              cellSessions.map(session => (
                                <div
                                  key={session.id}
                                  draggable={isAdminOrScolarite ? "true" : "false"}
                                  onDragStart={(e) => handleDragStart(e, session.id)}
                                  style={getSubjectColorStyles(session.subject?.color)}
                                  className={`relative p-3 rounded-2xl border text-left shadow-sm group transition-all duration-150 ${isAdminOrScolarite ? 'cursor-grab active:cursor-grabbing hover:shadow-md' : ''}`}
                                >
                                  {/* Title & Type badge */}
                                  <div className="flex justify-between items-start gap-1">
                                    <h4 className="text-xs font-bold truncate leading-tight w-4/5" title={session.subject?.name}>
                                      {session.subject?.name}
                                    </h4>
                                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-white/70 dark:bg-slate-800/80">
                                      {session.type}
                                    </span>
                                  </div>

                                  {/* Details */}
                                  <div className="text-[10px] font-medium opacity-90 mt-1.5 space-y-0.5">
                                    {/* Class name (hide if filtered by class) */}
                                    {viewPerspective !== 'class' && (
                                      <p className="flex items-center gap-1 truncate font-semibold">
                                        <Home className="h-3 w-3 flex-shrink-0" />
                                        {session.classe?.name}
                                        {session.group && <span className="text-primary font-bold text-[9px] ml-0.5">[{session.group.name}]</span>}
                                      </p>
                                    )}

                                    {/* Teacher (hide if filtered by teacher) */}
                                    {viewPerspective !== 'teacher' && (
                                      <p className="flex items-center gap-1 truncate">
                                        <User className="h-3 w-3 flex-shrink-0" />
                                        Prof. {session.teacher?.user?.last_name}
                                      </p>
                                    )}

                                    {/* Room (hide if filtered by room) */}
                                    {viewPerspective !== 'room' && (
                                      <p className="flex items-center gap-1 truncate">
                                        <MapPin className="h-3 w-3 flex-shrink-0" />
                                        Salle : {session.room?.code}
                                      </p>
                                    )}
                                  </div>

                                  {/* Admin Actions Overlay (visible on hover) */}
                                  {isAdminOrScolarite && (
                                    <div className="absolute right-2 bottom-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-white/90 dark:bg-slate-900/90 rounded-lg p-0.5 shadow">
                                      <button 
                                        onClick={() => openEditModal(session)}
                                        className="p-1 hover:text-primary transition"
                                        title="Modifier la séance"
                                      >
                                        <Edit className="h-3 w-3 text-slate-500 hover:text-indigo-600" />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteSession(session.id)}
                                        className="p-1 hover:text-rose-600 transition"
                                        title="Supprimer la séance"
                                      >
                                        <Trash2 className="h-3 w-3 text-slate-500 hover:text-rose-600" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Add / Edit Session */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)}
        title={currentSession ? "Modifier la Séance" : "Ajouter une Séance"}
      >
        <form onSubmit={handleSubmitSession} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Classe *</label>
              <select 
                required 
                value={formData.class_id} 
                onChange={(e) => {
                  const classId = e.target.value;
                  setFormData({ ...formData, class_id: classId, group_id: '' });
                }}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary text-sm"
              >
                <option value="">Sélectionner</option>
                {filteredClasses.map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Groupe (Optionnel)</label>
              <select 
                value={formData.group_id} 
                onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary text-sm"
              >
                <option value="">Tous la classe</option>
                {filteredClasses.find(c => c.id === parseInt(formData.class_id, 10))?.groups?.map(g => (
                  <option key={g.id} value={g.id.toString()}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Matière *</label>
              <select 
                required 
                value={formData.subject_id} 
                onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary text-sm"
              >
                <option value="">Sélectionner</option>
                {options.subjects.map(s => <option key={s.id} value={s.id.toString()}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Enseignant *</label>
              <select 
                required 
                value={formData.teacher_id} 
                onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary text-sm"
              >
                <option value="">Sélectionner</option>
                {options.teachers.map(t => (
                  <option key={t.id} value={t.id.toString()}>Prof. {t.user.first_name} {t.user.last_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Salle *</label>
              <select 
                required 
                value={formData.room_id} 
                onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary text-sm"
              >
                <option value="">Sélectionner</option>
                {options.rooms.map(r => (
                  <option key={r.id} value={r.id.toString()}>{r.name} ({r.code} - {r.type})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Semestre *</label>
              <select 
                required 
                value={formData.semester_id} 
                onChange={(e) => setFormData({ ...formData, semester_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary text-sm"
              >
                <option value="">Sélectionner</option>
                {options.semesters.map(sem => <option key={sem.id} value={sem.id.toString()}>{sem.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Jour *</label>
              <select 
                required 
                value={formData.day_of_week} 
                onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary text-sm"
              >
                {DAYS.map(day => <option key={day.english} value={day.english}>{day.french}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Créneau *</label>
              <select 
                required 
                value={formData.time_slot_id} 
                onChange={(e) => setFormData({ ...formData, time_slot_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary text-sm"
              >
                {options.time_slots.map(ts => (
                  <option key={ts.id} value={ts.id.toString()}>{ts.name} ({ts.start_time.slice(0,5)})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Type *</label>
              <select 
                required 
                value={formData.type} 
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary text-sm"
              >
                <option value="Cours">Cours</option>
                <option value="TD">TD</option>
                <option value="TP">TP</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Fréquence *</label>
            <select 
              required 
              value={formData.frequency} 
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary text-sm"
            >
              <option value="weekly">Chaque semaine</option>
              <option value="biweekly">Toutes les deux semaines (Quinzaine)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button 
              type="button" 
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-5 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Automatic Generation */}
      <Modal 
        isOpen={isGenModalOpen} 
        onClose={() => {
          setIsGenModalOpen(false);
          setGenResults(null);
        }}
        title="Générateur Automatique Intelligent"
      >
        <div className="space-y-4">
          {!genResults ? (
            <form onSubmit={handleAutoGenerate} className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 flex gap-3 text-amber-800 dark:text-amber-300 text-xs">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-bold mb-1">Attention : Régénération</p>
                  <p>Lancer la génération automatique effacera tout l'emploi du temps existant pour le semestre sélectionné et recalculera les affectations optimales.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Semestre cible *</label>
                <select 
                  required 
                  value={genSemesterId} 
                  onChange={(e) => setGenSemesterId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary text-sm"
                >
                  <option value="">Sélectionner</option>
                  {options.semesters.map(sem => <option key={sem.id} value={sem.id.toString()}>{sem.name}</option>)}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setIsGenModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Fermer
                </button>
                <button 
                  type="submit" 
                  disabled={genLoading}
                  className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
                >
                  {genLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Lancer la génération
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-4 text-emerald-800 dark:text-emerald-300 text-xs">
                <p className="font-bold text-sm mb-1">Génération terminée avec succès !</p>
                <p><strong>{genResults.generated_count}</strong> séances ont été placées de manière optimale.</p>
                <p><strong>{genResults.unassigned_count}</strong> séances n'ont pas pu être placées à cause de contraintes fortes de conflits de salles ou d'enseignants.</p>
              </div>

              {genResults.unassigned_count > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Séances non affectées (À gérer manuellement) :</h4>
                  <div className="max-h-40 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 bg-slate-50 dark:bg-slate-900">
                    {genResults.unassigned_sessions.map((session, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-white">{session.class}</span>
                          <span className="text-slate-400 mx-1">·</span>
                          <span>{session.subject} ({session.type})</span>
                          {session.group && <span className="text-indigo-600 font-bold ml-1">[{session.group}]</span>}
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-red-100 text-red-700 font-semibold" title={session.reason}>
                          Conflit
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                <button 
                  onClick={() => {
                    setIsGenModalOpen(false);
                    setGenResults(null);
                  }}
                  className="px-5 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl text-sm font-semibold"
                >
                  Super, Fermer
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal 3: Teacher Availabilities Editor */}
      <Modal 
        isOpen={isAvailModalOpen} 
        onClose={() => setIsAvailModalOpen(false)}
        title="Gestion des Disponibilités Hebdomadaires"
      >
        <div className="space-y-4">
          {/* Teacher Selector (visible to Admin only) */}
          {isAdminOrScolarite && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Sélectionner l'Enseignant</label>
              <select 
                value={availTeacherId} 
                onChange={(e) => setAvailTeacherId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary text-sm"
              >
                <option value="">Sélectionner</option>
                {options.teachers.map(t => (
                  <option key={t.id} value={t.id}>Prof. {t.user.first_name} {t.user.last_name}</option>
                ))}
              </select>
            </div>
          )}

          {availTeacherId ? (
            availLoading ? (
              <div className="py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-2" />
                <p className="text-xs text-slate-400">Chargement des disponibilités...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cliquez sur une case pour basculer la disponibilité de l'enseignant. Les cases vertes représentent les créneaux autorisés.
                </p>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 border-collapse text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-950">
                      <tr>
                        <th className="px-2 py-2 text-center font-bold border-r border-slate-200 dark:border-slate-800">Jour</th>
                        {options.time_slots.map(ts => (
                          <th key={ts.id} className="px-2 py-2 text-center font-semibold border-r border-slate-200 dark:border-slate-800">
                            {ts.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {DAYS.map(day => (
                        <tr key={day.english}>
                          <td className="px-2 py-2 text-center font-bold bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800">
                            {day.french}
                          </td>
                          {options.time_slots.map(slot => {
                            const isAvail = availMatrix[`${day.english}:${slot.id}`] !== false; // default true
                            return (
                              <td 
                                key={slot.id} 
                                onClick={() => toggleAvailCell(day.english, slot.id)}
                                className={`px-2 py-4 text-center cursor-pointer border-r border-slate-200 dark:border-slate-800 font-bold transition ${isAvail ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' : 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20'}`}
                              >
                                {isAvail ? <Check className="h-4 w-4 mx-auto" /> : <X className="h-4 w-4 mx-auto" />}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button 
                    onClick={() => setIsAvailModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Annuler
                  </button>
                  <button 
                    onClick={handleSaveAvailabilities}
                    className="px-5 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl text-sm font-semibold"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="py-8 text-center text-slate-400">
              Veuillez sélectionner un enseignant pour afficher sa grille de disponibilités.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
