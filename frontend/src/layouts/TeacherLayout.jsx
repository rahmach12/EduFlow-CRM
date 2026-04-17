import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GraduationCap, LogOut, Sun, Moon, Globe, Home, FileText, CalendarOff, School, Users, LayoutDashboard } from 'lucide-react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import StudentNotifications from '../components/StudentNotifications';

const TeacherLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { i18n } = useTranslation();
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      if (!prev) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      return !prev;
    });
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'fr' : 'en');
  };

  const navItems = [
    { name: 'Tableau de Bord', href: '/', icon: LayoutDashboard },
    { name: 'Mes Classes', href: '/classes', icon: School },
    { name: 'Étudiants', href: '/students', icon: Users },
    { name: 'Saisir Notes', href: '/notes', icon: FileText },
    { name: 'Absences', href: '/attendance', icon: CalendarOff },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] flex flex-col md:flex-row transition-colors duration-300">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-sm z-20">
        <div className="flex items-center justify-center h-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white space-x-3">
          <GraduationCap className="h-8 w-8" />
          <div>
            <span className="text-xl font-bold tracking-wider block">EduFlow</span>
            <span className="text-xs text-blue-100">Espace Enseignant</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto px-4 py-8">
          <nav className="flex-1 space-y-1">
            {navItems.map(item => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.href} to={item.href}
                  className={classNames(
                    isActive ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white',
                    'group flex items-center px-4 py-3 rounded-xl text-sm transition-all duration-200'
                  )}>
                  <Icon className={classNames('mr-4 h-5 w-5', isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-500')} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.first_name?.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">Prof. {user?.last_name}</p>
              <p className="text-xs text-slate-400">Enseignant</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
            <LogOut className="mr-2 h-4 w-4" /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-72 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-10 flex h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6">
          <div className="flex-1 flex justify-between items-center">
            <div className="md:hidden flex items-center">
              <GraduationCap className="h-7 w-7 text-blue-600 mr-2" />
              <span className="font-bold text-slate-800 dark:text-white">EduFlow</span>
            </div>
            <div className="hidden md:block">
              <p className="text-slate-700 dark:text-slate-200 font-semibold">
                Bonjour, Prof. {user?.last_name} 👋
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Espace Enseignant</p>
            </div>
            <div className="flex items-center space-x-3">
              <button onClick={toggleLanguage} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-blue-600 bg-slate-100 dark:bg-slate-800 transition-colors text-xs font-bold font-mono flex items-center gap-1">
                <Globe className="h-4 w-4" />{i18n.language.toUpperCase()}
              </button>
              <button onClick={toggleTheme} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-blue-600 bg-slate-100 dark:bg-slate-800 transition-colors">
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <StudentNotifications />
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                {user?.first_name?.charAt(0)}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe z-50">
        <div className="flex justify-around items-center h-16">
          {[
            { href: '/', icon: Home, label: 'Accueil' },
            { href: '/notes', icon: FileText, label: 'Notes' },
            { href: '/attendance', icon: CalendarOff, label: 'Absences' },
            { href: '/classes', icon: School, label: 'Classes' },
            { href: '/students', icon: Users, label: 'Étudiants' },
          ].map(item => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} to={item.href}
                className={classNames('flex flex-col items-center justify-center w-full h-full space-y-1',
                  isActive ? 'text-blue-600' : 'text-slate-500 dark:text-slate-400'
                )}>
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TeacherLayout;
