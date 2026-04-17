import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/axios';
import {
  User, Mail, Phone, MapPin, Calendar, BookOpen, School,
  Award, CalendarOff, TrendingUp, Shield, Edit3, GraduationCap
} from 'lucide-react';
import { SkeletonProfile } from '../components/SkeletonLoader';
import toast from 'react-hot-toast';

// ─── Info Field ───────────────────────────────────────────────────────────────
const InfoField = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700">
    <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-slate-800 dark:text-white mt-0.5 break-words">
        {value || <span className="text-slate-400 font-normal">Not set</span>}
      </p>
    </div>
  </div>
);

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ name, size = 'xl', gradient = 'from-violet-500 to-purple-700' }) => {
  const sizes = { sm: 'h-12 w-12 text-lg', md: 'h-16 w-16 text-2xl', xl: 'h-24 w-24 text-3xl' };
  const initials = name?.split(' ').map(n => n[0]).slice(0, 2).join('') || '?';
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg`}>
      {initials}
    </div>
  );
};

// ─── Student Profile ──────────────────────────────────────────────────────────
const StudentProfile = ({ user, grades }) => {
  const avg = grades?.general_average;
  const absenceRate = grades?.absence_rate ?? 0;
  const eliminated = absenceRate > 30;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-8 text-white shadow-xl">
        <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <Avatar name={`${user.first_name} ${user.last_name}`} />
          <div className="flex-1">
            <p className="text-white/70 text-sm font-medium">Étudiant(e)</p>
            <h1 className="text-3xl font-extrabold mt-1">{user.first_name} {user.last_name}</h1>
            <p className="text-white/80 mt-1 flex items-center gap-2 text-sm">
              <School className="h-4 w-4" />
              {user.student?.classe?.name || 'Classe non assignée'}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 text-center border border-white/20">
              <p className="text-white/60 text-xs uppercase tracking-wider">Moyenne</p>
              <p className="text-2xl font-bold mt-1">{avg ?? '—'}<span className="text-sm opacity-70">/20</span></p>
            </div>
            <div className={`backdrop-blur-sm rounded-xl px-4 py-3 text-center border ${eliminated ? 'bg-red-500/30 border-red-400/40' : 'bg-white/15 border-white/20'}`}>
              <p className="text-white/60 text-xs uppercase tracking-wider">Absences</p>
              <p className="text-2xl font-bold mt-1">{absenceRate}<span className="text-sm opacity-70">%</span></p>
              {eliminated && <p className="text-xs text-red-200 mt-1">⚠️ Éliminé</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <span className="h-1 w-5 bg-primary rounded-full inline-block" />
          Informations Personnelles
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoField icon={Mail}     label="Email"          value={user.email} />
          <InfoField icon={Phone}    label="Téléphone"      value={user.phone} />
          <InfoField icon={MapPin}   label="Adresse"        value={user.address} />
          <InfoField icon={Calendar} label="Date de naissance" value={user.date_of_birth} />
          <InfoField icon={User}     label="Genre"          value={user.gender} />
          <InfoField icon={Shield}   label="CIN"            value={user.cin} />
        </div>
      </div>

      {/* Academic Info */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <span className="h-1 w-5 bg-primary rounded-full inline-block" />
          Parcours Académique
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <InfoField icon={School}    label="Classe"      value={user.student?.classe?.name} />
          <InfoField icon={TrendingUp} label="Moyenne"   value={avg ? `${avg}/20` : null} />
          <InfoField icon={CalendarOff} label="Taux d'absences" value={`${absenceRate}%`} />
        </div>
      </div>
    </div>
  );
};

// ─── Teacher Profile ──────────────────────────────────────────────────────────
const TeacherProfile = ({ user }) => (
  <div className="space-y-6">
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 p-8 text-white shadow-xl">
      <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <Avatar name={`${user.first_name} ${user.last_name}`} gradient="from-blue-500 to-indigo-700" />
        <div>
          <p className="text-white/70 text-sm font-medium">Enseignant(e)</p>
          <h1 className="text-3xl font-extrabold mt-1">{user.first_name} {user.last_name}</h1>
          <p className="text-white/80 mt-1 flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4" />
            {user.teacher?.subject?.name || 'Matière non assignée'}
          </p>
        </div>
      </div>
    </div>

    <div>
      <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
        <span className="h-1 w-5 bg-primary rounded-full inline-block" />
        Informations Professionnelles
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoField icon={Mail}     label="Email"      value={user.email} />
        <InfoField icon={Phone}    label="Téléphone"  value={user.phone} />
        <InfoField icon={BookOpen} label="Matière"    value={user.teacher?.subject?.name} />
        <InfoField icon={MapPin}   label="Adresse"    value={user.address} />
        <InfoField icon={Calendar} label="Date de naissance" value={user.date_of_birth} />
        <InfoField icon={Shield}   label="CIN"        value={user.cin} />
      </div>
    </div>
  </div>
);

// ─── Admin Profile ────────────────────────────────────────────────────────────
const AdminProfile = ({ user }) => (
  <div className="space-y-6">
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-8 text-white shadow-xl">
      <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <Avatar name={`${user.first_name} ${user.last_name}`} gradient="from-slate-500 to-slate-800" />
        <div>
          <p className="text-white/70 text-sm font-medium">Administrateur</p>
          <h1 className="text-3xl font-extrabold mt-1">{user.first_name} {user.last_name}</h1>
          <div className="mt-2 flex items-center gap-2">
            <span className="bg-primary/30 border border-primary/40 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <GraduationCap className="h-3 w-3" /> {user.role?.name}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div>
      <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
        <span className="h-1 w-5 bg-primary rounded-full inline-block" />
        Informations du Compte
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoField icon={Mail}   label="Email"    value={user.email} />
        <InfoField icon={User}   label="Prénom"   value={user.first_name} />
        <InfoField icon={User}   label="Nom"      value={user.last_name} />
        <InfoField icon={Shield} label="Rôle"     value={user.role?.name} />
      </div>
    </div>
  </div>
);

// ─── Main Profile Page ────────────────────────────────────────────────────────
const Profile = () => {
  const { user } = useAuth();
  const [grades, setGrades] = useState(null);
  const [loading, setLoading] = useState(true);
  const role = user?.role?.name;

  useEffect(() => {
    const loadData = async () => {
      try {
        if (role === 'Student' && user?.student?.id) {
          const res = await api.get(`/students/${user.student.id}/average`);
          setGrades(res.data);
        }
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user, role]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <SkeletonProfile />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Mon Profil</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Consultez et vérifiez vos informations personnelles</p>
        </div>
      </div>

      {role === 'Student'  && <StudentProfile user={user} grades={grades} />}
      {role === 'Teacher'  && <TeacherProfile user={user} />}
      {(role === 'Admin' || role === 'Administration') && <AdminProfile user={user} />}
    </div>
  );
};

export default Profile;
