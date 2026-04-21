import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  Briefcase,
  CalendarOff,
  ChevronDown,
  DollarSign,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  School,
  Layers3,
  Search,
  User,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import classNames from 'classnames';
import GlobalSearch from '../components/GlobalSearch';
import { SearchProvider } from '../contexts/SearchContext';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';

const ACADEMIC_YEARS = ['2023-2024', '2024-2025', '2025-2026'];

function NavItem({ item, isActive, onClick }) {
  const Icon = item.icon;

  return (
    <Link
      to={item.href}
      onClick={onClick}
      className={classNames(
        isActive
          ? 'border-r-4 border-primary bg-primary/10 font-semibold text-primary'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white',
        'group flex items-center rounded-l-lg px-4 py-3 text-sm transition-all duration-150'
      )}
    >
      <Icon
        className={classNames(
          isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-500',
          'mr-3 h-5 w-5 flex-shrink-0'
        )}
      />
      {item.name}
    </Link>
  );
}

const DashboardLayoutInner = () => {
  const { user, logout } = useAuth();
  const { notifications, markAsRead } = useNotifications();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [academicYear, setAcademicYear] = useState(() => localStorage.getItem('academic_year') || '2024-2025');

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;
  const role = user?.role?.name;
  const isAdmin = role === 'Admin' || role === 'Administration';

  useEffect(() => {
    const handler = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        if (isAdmin) setIsSearchOpen((open) => !open);
      }

      if (event.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isAdmin]);

  useEffect(() => {
    const handler = () => {
      setShowNotifications(false);
      setIsYearOpen(false);
    };

    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const selectYear = (year) => {
    setAcademicYear(year);
    localStorage.setItem('academic_year', year);
    setIsYearOpen(false);
  };

  const getNavigation = () => {
    switch (role) {
      case 'Admin':
      case 'Administration':
        return [
          { name: 'Dashboard', href: '/', icon: LayoutDashboard },
          { name: 'Utilisateurs', href: '/users', icon: Users },
          { name: 'Etudiants', href: '/students', icon: Users },
          { name: 'Enseignants', href: '/teachers', icon: UserCheck },
          { name: 'Filières', href: '/filieres', icon: Layers3 },
          { name: 'Classes', href: '/classes', icon: School },
          { name: 'Matieres', href: '/subjects', icon: BookOpen },
          { name: 'Notes', href: '/notes', icon: FileText },
          { name: 'Absences', href: '/attendance', icon: CalendarOff },
          { name: 'Finance', href: '/finance', icon: DollarSign },
          { name: 'Stages', href: '/internships', icon: Briefcase },
        ];
      case 'Finance Officer':
        return [
          { name: 'Dashboard', href: '/', icon: LayoutDashboard },
          { name: 'Finance', href: '/finance', icon: DollarSign },
        ];
      case 'Internship Officer':
      case 'Internship Manager':
        return [
          { name: 'Tableau de Bord', href: '/internship-dashboard', icon: LayoutDashboard },
          { name: 'Toutes les Demandes', href: '/internships', icon: Briefcase },
        ];
      case 'Scolarite':
        return [
          { name: 'Tableau de Bord', href: '/scolarite', icon: LayoutDashboard },
          { name: 'Etudiants', href: '/students', icon: Users },
          { name: 'Absences', href: '/attendance', icon: CalendarOff },
          { name: 'Notes', href: '/notes', icon: FileText },
        ];
      case 'Teacher':
        return [
          { name: 'Dashboard', href: '/', icon: LayoutDashboard },
          { name: 'Mes Classes', href: '/classes', icon: School },
          { name: 'Etudiants', href: '/students', icon: Users },
          { name: 'Notes', href: '/notes', icon: FileText },
          { name: 'Absences', href: '/attendance', icon: CalendarOff },
        ];
      default:
        return [
          { name: 'Dashboard', href: '/', icon: LayoutDashboard },
          { name: 'Mes Notes', href: '/notes', icon: FileText },
          { name: 'Mes Absences', href: '/attendance', icon: CalendarOff },
          { name: 'Mon Emploi du Temps', href: '/classes', icon: School },
          { name: 'Stages', href: '/internships', icon: Briefcase },
          { name: 'Finance', href: '/finance', icon: DollarSign },
          { name: 'Documents', href: '/documents', icon: FileText },
        ];
    }
  };

  const navigation = getNavigation();
  const pageTitle = location.pathname === '/' ? 'Dashboard' : location.pathname.slice(1).replace('-', ' ');

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="fixed inset-y-0 hidden w-64 flex-col border-r border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex">
        <div className="flex h-16 items-center justify-center bg-gradient-to-r from-primary to-violet-700 px-4 text-white">
          <GraduationCap className="mr-2 h-7 w-7 flex-shrink-0" />
          <span className="text-xl font-extrabold tracking-wider">EduFlow</span>
        </div>

        <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <div className="flex items-center justify-between rounded-xl bg-primary/5 px-3 py-2 dark:bg-primary/10">
            <span className="text-xs font-semibold text-primary">Annee Academique</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{academicYear}</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto pb-4 pt-4">
          <div className="mb-3 px-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Navigation</p>
          </div>
          <nav className="flex-1 space-y-0.5 pr-2">
            {navigation.map((item) => (
              <NavItem
                key={item.name}
                item={item}
                isActive={location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href))}
                onClick={() => setIsMobileMenuOpen(false)}
              />
            ))}
          </nav>
        </div>

        <div className="space-y-3 border-t border-slate-200 p-4 dark:border-slate-800">
          <Link to="/profile" className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-700 text-sm font-bold text-white">
              {user?.first_name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{user?.first_name} {user?.last_name}</p>
              <p className="truncate text-xs text-slate-400 dark:text-slate-500">{user?.role?.name}</p>
            </div>
            <User className="h-4 w-4 flex-shrink-0 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/10"
          >
            <LogOut className="h-4 w-4" />
            Deconnexion
          </button>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col md:ml-64">
        <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 border-b border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <button
            className="border-r border-slate-200 px-4 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 dark:border-slate-800 md:hidden"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex flex-1 items-center justify-between gap-4 px-4">
            <h1 className="hidden capitalize text-lg font-bold text-slate-800 dark:text-white sm:block">{pageTitle}</h1>

            <div className="ml-auto flex items-center gap-2">
              {isAdmin && (
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsSearchOpen(true);
                  }}
                  className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 transition-all hover:border-primary/40 hover:text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:hover:text-slate-200"
                  title="Search (Ctrl+K)"
                >
                  <Search className="h-4 w-4 group-hover:text-primary" />
                  <span className="hidden text-xs sm:block">Recherche...</span>
                  <kbd className="hidden items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-xs dark:border-slate-600 dark:bg-slate-700 sm:flex">
                    Ctrl K
                  </kbd>
                </button>
              )}

              <div className="relative" onClick={(event) => event.stopPropagation()}>
                <button
                  onClick={() => setIsYearOpen((open) => !open)}
                  className="flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-semibold text-primary transition-all hover:bg-primary/10 dark:bg-primary/10"
                >
                  <span className="hidden sm:block">{academicYear}</span>
                  <span className="sm:hidden">A.Y.</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isYearOpen ? 'rotate-180' : ''}`} />
                </button>

                {isYearOpen && (
                  <div className="absolute right-0 top-full z-20 mt-2 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                    {ACADEMIC_YEARS.map((year) => (
                      <button
                        key={year}
                        onClick={() => selectYear(year)}
                        className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                          academicYear === year
                            ? 'bg-primary font-semibold text-white'
                            : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700'
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative" onClick={(event) => event.stopPropagation()}>
                <button
                  onClick={() => setShowNotifications((open) => !open)}
                  className="relative rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-2 ring-white dark:ring-slate-900">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                          {unreadCount} Non lues
                        </span>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
                      {notifications.length === 0 ? (
                        <div className="py-10 text-center">
                          <Bell className="mx-auto mb-2 h-8 w-8 text-slate-200 dark:text-slate-700" />
                          <p className="text-sm text-slate-400">Aucune notification</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => !notification.is_read && markAsRead(notification.id)}
                            className={`cursor-pointer px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                              !notification.is_read ? 'bg-primary/5 dark:bg-primary/10' : ''
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {!notification.is_read && <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />}
                              <div className="min-w-0 flex-1">
                                <p className={`text-xs ${!notification.is_read ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                                  {notification.title}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-400">{notification.message}</p>
                                <p className="mt-1 text-xs text-primary">
                                  {new Date(notification.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative flex w-full max-w-xs flex-col bg-white shadow-xl dark:bg-slate-900">
            <div className="absolute right-4 top-4">
              <button onClick={() => setIsMobileMenuOpen(false)} className="rounded-xl bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex h-16 items-center bg-gradient-to-r from-primary to-violet-700 px-4">
              <GraduationCap className="mr-2 h-7 w-7 text-white" />
              <span className="text-xl font-extrabold tracking-wider text-white">EduFlow</span>
            </div>
            <div className="flex-1 overflow-y-auto pb-4 pt-4">
              <div className="mb-2 px-4">
                <div className="flex items-center justify-between rounded-xl bg-primary/5 px-3 py-2">
                  <span className="text-xs font-semibold text-primary">Annee Academique</span>
                  <span className="text-xs font-bold text-primary">{academicYear}</span>
                </div>
              </div>
              <nav className="mt-3 space-y-0.5 px-2">
                {navigation.map((item) => (
                  <NavItem
                    key={item.name}
                    item={item}
                    isActive={location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href))}
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                ))}
                <NavItem
                  item={{ name: 'Mon Profil', href: '/profile', icon: User }}
                  isActive={location.pathname === '/profile'}
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              </nav>
            </div>
            <div className="border-t border-slate-200 p-4 dark:border-slate-800">
              <button
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/10"
              >
                <LogOut className="h-4 w-4" />
                Deconnexion
              </button>
            </div>
          </div>
        </div>
      )}

      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};

const DashboardLayout = () => (
  <SearchProvider>
    <DashboardLayoutInner />
  </SearchProvider>
);

export default DashboardLayout;
