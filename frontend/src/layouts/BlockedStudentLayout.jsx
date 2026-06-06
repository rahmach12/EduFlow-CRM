import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { GraduationCap, LogOut, Sun, Moon, Globe, ShieldAlert, User, DollarSign, Bell } from 'lucide-react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import StudentNotifications from '../components/StudentNotifications';

const BlockedStudentLayout = () => {
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
    let newLang = 'fr';
    if (i18n.language === 'fr') newLang = 'en';
    else if (i18n.language === 'en') newLang = 'ar';
    else if (i18n.language === 'ar') newLang = 'fr';
    
    i18n.changeLanguage(newLang);
  };

  React.useEffect(() => {
    if (i18n.language === 'ar') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = i18n.language;
    }
  }, [i18n.language]);

  const navItems = [
    { name: t('nav.profile', 'Mon Profil'), href: '/profile', icon: User },
    { name: t('dashboard.cards.balance', 'Finance'), href: '/finance', icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] flex flex-col md:flex-row transition-colors duration-300">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 bg-white dark:bg-[#1E1B4B] border-r border-slate-200 dark:border-[#2e2a6b] shadow-sm z-20">
        <div className="flex items-center justify-center h-20 bg-red-600 text-white space-x-3">
          <GraduationCap className="h-8 w-8" />
          <span className="text-2xl font-bold tracking-wider">EduFlow</span>
        </div>
        
        <div className="flex-1 flex flex-col overflow-y-auto px-4 py-8">
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 text-center">
            <ShieldAlert className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-1">Accès Restreint</p>
            <p className="text-[10px] text-red-600 dark:text-red-300 leading-tight">Votre accès complet a été suspendu pour raisons financières.</p>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href || (item.href === '/profile' && location.pathname === '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={classNames(
                    isActive 
                      ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 font-semibold border-r-4 border-red-500' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2e2a6b] hover:text-slate-900 dark:hover:text-white',
                    'group flex items-center px-4 py-3 rounded-l-xl text-sm transition-all duration-200'
                  )}
                >
                  <Icon 
                    className={classNames(
                      isActive ? 'text-red-600 dark:text-red-400' : 'text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300',
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
            className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <LogOut className="mr-2 h-5 w-5" />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-72 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Top Header */}
        <header className="sticky top-0 z-10 flex h-20 bg-white/80 dark:bg-[#1E1B4B]/80 backdrop-blur-md border-b border-red-200 dark:border-red-900/50 px-4 sm:px-6 lg:px-8">
          <div className="flex-1 flex justify-between items-center">
            
            {/* Mobile Brand */}
            <div className="md:hidden flex items-center text-red-600">
              <GraduationCap className="h-8 w-8 mr-2" />
              <span className="text-xl font-bold">EduFlow</span>
            </div>

            {/* Desktop Context */}
            <div className="hidden md:flex flex-col">
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                {t('greeting')} {user?.first_name} 👋
              </h1>
              <p className="text-sm font-medium text-red-500 mt-0.5 flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" /> Compte Administratif Bloqué
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

              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold shadow-md ring-2 ring-red-200">
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
      <div className="fixed bottom-0 left-0 right-0 z-50 flex h-16 bg-white/90 dark:bg-[#1E1B4B]/90 backdrop-blur-md border-t border-red-200 dark:border-red-900/50 md:hidden">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || (item.href === '/profile' && location.pathname === '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              to={item.href}
              className="flex flex-1 flex-col items-center justify-center space-y-1"
            >
              <Icon 
                className={classNames(
                  isActive ? 'text-red-600 dark:text-red-400' : 'text-slate-400',
                  'h-6 w-6'
                )} 
              />
              <span className={classNames(
                isActive ? 'text-red-600 dark:text-red-400 font-medium' : 'text-slate-500',
                'text-[10px]'
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BlockedStudentLayout;
