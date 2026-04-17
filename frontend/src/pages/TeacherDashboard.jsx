import React from 'react';
import { Link } from 'react-router-dom';
import { School, BookOpen, CalendarOff, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const TeacherDashboard = () => {
  const { user } = useAuth();
  
  const StatCard = ({ title, value, icon: Icon, href }) => (
    <Link to={href} className="group bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-primary transition-colors cursor-pointer block">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors">{title}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2 group-hover:text-primary transition-colors">
            {value}
          </p>
        </div>
        <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
          <Icon className="w-6 h-6 text-primary group-hover:text-white" />
        </div>
      </div>
    </Link>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-lg relative overflow-hidden">
        {/* Background Decorative Pattern */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-2xl"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-2">
            Bonjour, Professeur {user?.last_name || ''} 👋
          </h2>
          <p className="text-blue-100 max-w-xl">
            Bienvenue sur votre espace enseignant. Vous pouvez gérer vos classes, étudiants, saisir les notes et suivre les absences depuis ce tableau de bord.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        <StatCard title="Mes Classes" value="Gérer" icon={School} href="/classes" />
        <StatCard title="Saisie de Notes" value="Saisir" icon={BookOpen} href="/notes" />
        <StatCard title="Gestion Absences" value="Faire l'appel" icon={CalendarOff} href="/attendance" />
        <StatCard title="Mes Étudiants" value="Consulter" icon={Users} href="/students" />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 mt-6 text-center">
        <School className="w-16 h-16 text-slate-200 dark:text-slate-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Actions Rapides</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Utilisez le menu latéral pour naviguer vers les modules spécifiques à votre enseignement.
        </p>
      </div>
    </div>
  );
};

export default TeacherDashboard;
