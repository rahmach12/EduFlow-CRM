import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/axios';
import {
import {
  User, Mail, Phone, MapPin, Calendar, BookOpen, School,
  CalendarOff, TrendingUp, Shield, GraduationCap, QrCode
} from 'lucide-react';

const StudentProfile = ({ user, grades }) => {
  const avg = grades?.general_average;
  const absenceRate = grades?.absence_rate ?? 0;
  const eliminated = absenceRate > 30;

  return (
    <div className="space-y-8">
      {/* Carte Étudiant Numérique */}
      <div className="relative">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <span className="h-1 w-5 bg-primary rounded-full inline-block" />
          Carte d'Étudiant Numérique
        </h2>
        
        <div className="mx-auto max-w-md w-full bg-gradient-to-br from-primary via-purple-600 to-indigo-800 rounded-3xl p-1 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/20 rounded-full blur-2xl -ml-12 -mb-12 transition-transform group-hover:scale-110 duration-700" />
          
          <div className="bg-white/10 backdrop-blur-xl rounded-[22px] border border-white/20 p-6 relative z-10">
            {/* Header Carte */}
            <div className="flex justify-between items-start mb-6 border-b border-white/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-white p-1.5 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-black leading-tight">EduFlow CRM</h3>
                  <p className="text-white/70 text-[10px] uppercase tracking-widest font-bold">Carte Universitaire</p>
                </div>
              </div>
              <div className="bg-white/20 px-3 py-1 rounded-full border border-white/30 backdrop-blur-md">
                <span className="text-white font-bold text-xs">{user.student?.classe?.academic_year || '2025/2026'}</span>
              </div>
            </div>

            {/* Corps Carte */}
            <div className="flex gap-5 items-center">
              <Avatar name={`${user.first_name} ${user.last_name}`} size="md" gradient="from-slate-100 to-white text-primary" />
              <div className="flex-1 min-w-0 text-white">
                <p className="text-white/60 text-[10px] uppercase tracking-wider font-bold mb-0.5">Étudiant(e)</p>
                <h4 className="font-extrabold text-xl truncate tracking-tight">{user.first_name} {user.last_name}</h4>
                <p className="font-mono text-white/90 text-sm mt-1 bg-black/20 w-fit px-2 py-0.5 rounded border border-white/10">
                  {user.student?.matricule || 'N/A'}
                </p>
                <p className="text-sm font-medium mt-2 text-white/90 truncate flex items-center gap-1.5">
                  <School className="h-3.5 w-3.5" />
                  {user.student?.classe?.name || 'Classe non assignée'}
                </p>
              </div>
            </div>

            {/* Footer Carte */}
            <div className="mt-6 pt-5 border-t border-white/10 flex items-end justify-between">
              <div className="space-y-2 flex-1 pr-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/60 uppercase">CIN:</span>
                  <span className="text-white font-bold">{user.cin}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/60 uppercase">Né(e) le:</span>
                  <span className="text-white font-bold">{user.student?.date_of_birth}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/60 uppercase">Filière:</span>
                  <span className="text-white font-bold truncate max-w-[120px] text-right">{user.student?.classe?.filiere?.name || '—'}</span>
                </div>
              </div>
              <div className="bg-white p-2 rounded-lg ml-2 flex-shrink-0">
                <QrCode className="h-10 w-10 text-slate-900" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dossier Académique */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
            <span className="h-1 w-4 bg-primary rounded-full inline-block" />
            Statut Académique
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-2.5 rounded-xl text-purple-600 dark:text-purple-400"><TrendingUp className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Moyenne Générale</p>
                  <p className="text-xl font-black text-slate-800 dark:text-white mt-0.5">{avg ? `${avg}/20` : '—'}</p>
                </div>
              </div>
            </div>
            
            <div className={`flex items-center justify-between p-4 rounded-2xl border ${eliminated ? 'bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/30' : 'bg-slate-50 border-slate-100 dark:bg-slate-900/50 dark:border-slate-800'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${eliminated ? 'bg-rose-200 text-rose-700 dark:bg-rose-800/50 dark:text-rose-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
                  <CalendarOff className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Taux d'absences</p>
                  <p className={`text-xl font-black mt-0.5 ${eliminated ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-white'}`}>
                    {absenceRate}% {eliminated && <span className="text-xs ml-2 bg-rose-500 text-white px-2 py-0.5 rounded-md">Éliminé</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Informations Personnelles */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
            <span className="h-1 w-4 bg-primary rounded-full inline-block" />
            Coordonnées
          </h2>
          <div className="space-y-3">
            <InfoField icon={Mail}     label="Email"          value={user.email} />
            <InfoField icon={Phone}    label="Téléphone"      value={user.phone} />
            <InfoField icon={MapPin}   label="Adresse"        value={user.address} />
            <InfoField icon={User}     label="Genre"          value={user.student?.gender === 'M' ? 'Masculin' : user.student?.gender === 'F' ? 'Féminin' : 'Non spécifié'} />
          </div>
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
