import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { GraduationCap, LogOut, Sun, Moon, Globe, Home, FileText, CalendarOff, School, User } from 'lucide-react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import StudentNotifications from '../components/StudentNotifications';
import StudentMobile from '../components/StudentMobile';

const StudentLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'fr' : 'en';
    i18n.changeLanguage(newLang);
  };

  const navItems = [
    { name: t('nav.home'), href: '/', icon: Home },
    { name: t('nav.notes'), href: '/notes', icon: FileText },
    { name: t('nav.schedule'), href: '/classes', icon: School },
    { name: t('nav.absences'), href: '/attendance', icon: CalendarOff },
    { name: 'Stages', href: '/internships', icon: User }, // Or use Briefcase if imported
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] flex flex-col md:flex-row transition-colors duration-300">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 bg-white dark:bg-[#1E1B4B] border-r border-slate-200 dark:border-[#2e2a6b] shadow-sm z-20">
        <div className="flex items-center justify-center h-20 bg-primary text-white space-x-3">
          <GraduationCap className="h-8 w-8" />
          <span className="text-2xl font-bold tracking-wider">EduFlow</span>
        </div>
        
        <div className="flex-1 flex flex-col overflow-y-auto px-4 py-8">
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={classNames(
                    isActive 
                      ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light font-semibold' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2e2a6b] hover:text-slate-900 dark:hover:text-white',
                    'group flex items-center px-4 py-3 rounded-xl text-sm transition-all duration-200'
                  )}
                >
                  <Icon 
                    className={classNames(
                      isActive ? 'text-primary dark:text-primary-light' : 'text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300',
                      'mr-4 h-5 w-5'
                    )} 
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-[#2e2a6b]">
          <button 
            onClick={logout}
            className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
          >
            <LogOut className="mr-2 h-5 w-5" />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-72 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Top Header */}
        <header className="sticky top-0 z-10 flex h-20 bg-white/80 dark:bg-[#1E1B4B]/80 backdrop-blur-md border-b border-slate-200 dark:border-[#2e2a6b] px-4 sm:px-6 lg:px-8">
          <div className="flex-1 flex justify-between items-center">
            
            {/* Mobile Brand (visible only on small screens) */}
            <div className="md:hidden flex items-center text-primary">
              <GraduationCap className="h-8 w-8 mr-2" />
              <span className="text-xl font-bold dark:text-white">EduFlow</span>
            </div>

            {/* Desktop Context (hidden on small screens) */}
            <div className="hidden md:flex flex-col">
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                {t('greeting')} {user?.first_name} 👋
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {user?.student?.classe?.name || 'Class Unknown'} — Factory Portal
              </p>
            </div>
            
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={toggleLanguage}
                className="p-2 rounded-full text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary-light transition-colors bg-slate-50 dark:bg-[#0F172A]"
                title="Toggle Language"
              >
                <div className="flex items-center text-xs font-bold font-mono uppercase tracking-wider">
                  <Globe className="h-4 w-4 mr-1" />
                  {i18n.language}
                </div>
              </button>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary-light transition-colors bg-slate-50 dark:bg-[#0F172A]"
                title="Toggle Dark Mode"
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              <StudentNotifications />

              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white dark:ring-[#1E1B4B] cursor-pointer">
                {user?.first_name?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation for Mobile */}
      <StudentMobile />
    </div>
  );
};

export default StudentLayout;
