import React from 'react';
import { Home, FileText, CalendarOff, School, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';

const StudentMobile = () => {
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { name: t('nav.home'), href: '/', icon: Home },
    { name: t('nav.notes'), href: '/notes', icon: FileText },
    { name: t('nav.schedule'), href: '/classes', icon: School },
    { name: t('nav.absences'), href: '/absences', icon: CalendarOff },
    { name: t('nav.profile'), href: '/profile', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={classNames(
                'flex flex-col items-center justify-center w-full h-full space-y-1',
                isActive ? 'text-primary' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              <Icon 
                className={classNames(
                  'h-5 w-5',
                  isActive ? 'fill-primary/20' : ''
                )} 
              />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default StudentMobile;
