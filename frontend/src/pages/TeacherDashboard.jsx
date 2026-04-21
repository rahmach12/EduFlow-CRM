import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CalendarOff, School, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

function StatCard({ title, value, icon, href }) {
  const IconComponent = icon;

  return (
    <Link
      to={href}
      className="group block cursor-pointer rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-primary dark:border-slate-700 dark:bg-slate-800"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 transition-colors group-hover:text-primary dark:text-slate-400">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 transition-colors group-hover:text-primary dark:text-white">{value}</p>
        </div>
        <div className="rounded-lg bg-primary/10 p-3 transition-colors group-hover:bg-primary">
          <IconComponent className="h-6 w-6 text-primary group-hover:text-white" />
        </div>
      </div>
    </Link>
  );
}

const TeacherDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-6 shadow-lg">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10">
          <h2 className="mb-2 text-3xl font-bold text-white">Bonjour, Professeur {user?.last_name || ''}</h2>
          <p className="max-w-xl text-blue-100">
            Bienvenue sur votre espace enseignant. Vous pouvez gerer vos classes, etudiants, notes et absences depuis ce tableau de bord.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Mes Classes" value="Gerer" icon={School} href="/classes" />
        <StatCard title="Saisie de Notes" value="Saisir" icon={BookOpen} href="/notes" />
        <StatCard title="Gestion Absences" value="Faire l'appel" icon={CalendarOff} href="/attendance" />
        <StatCard title="Mes Etudiants" value="Consulter" icon={Users} href="/students" />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <School className="mx-auto mb-4 h-16 w-16 text-slate-200 dark:text-slate-600" />
        <h3 className="mb-2 text-xl font-semibold text-slate-800 dark:text-white">Actions Rapides</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Utilisez le menu lateral pour naviguer vers les modules specifiques a votre enseignement.
        </p>
      </div>
    </div>
  );
};

export default TeacherDashboard;
