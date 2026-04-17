import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { 
  Users, UserCheck, BookOpen, GraduationCap, 
  LayoutDashboard, FileText, CalendarOff, DollarSign,
  LogOut, School, Menu, X, Bell, Briefcase, Search,
  User, ChevronDown
} from 'lucide-react';
import classNames from 'classnames';
import GlobalSearch from '../components/GlobalSearch';
import { SearchProvider } from '../contexts/SearchContext';

// Academic year options (Phase 1 — localStorage-persisted frontend selector)
const ACADEMIC_YEARS = ['2023-2024', '2024-2025', '2025-2026'];

const DashboardLayoutInner = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);

  const { notifications, markAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const role = user?.role?.name;
  const isAdmin = role === 'Admin' || role === 'Administration';

  // Academic year — persisted in localStorage
  const [academicYear, setAcademicYear] = useState(() =>
    localStorage.getItem('academic_year') || '2024-2025'
  );
  const selectYear = (yr) => {
    setAcademicYear(yr);
    localStorage.setItem('academic_year', yr);
    setIsYearOpen(false);
  };

  // Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isAdmin) setIsSearchOpen(o => !o);
      }
      if (e.key === 'Escape') setIsSearchOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isAdmin]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = () => { setShowNotifications(false); setIsYearOpen(false); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const getNavigation = () => {
    switch(role) {
      case 'Admin':
      case 'Administration':
        return [
          { name: 'Dashboard', href: '/', icon: LayoutDashboard },
          { name: 'Utilisateurs', href: '/users', icon: Users },
          { name: 'Étudiants', href: '/students', icon: Users },
          { name: 'Enseignants', href: '/teachers', icon: UserCheck },
          { name: 'Classes', href: '/classes', icon: School },
          { name: 'Matières', href: '/subjects', icon: BookOpen },
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
          { name: 'Étudiants', href: '/students', icon: Users },
          { name: 'Absences', href: '/attendance', icon: CalendarOff },
          { name: 'Notes', href: '/notes', icon: FileText },
        ];
      case 'Teacher':
        return [
          { name: 'Dashboard', href: '/', icon: LayoutDashboard },
          { name: 'Mes Classes', href: '/classes', icon: School },
          { name: 'Étudiants', href: '/students', icon: Users },
          { name: 'Notes', href: '/notes', icon: FileText },
          { name: 'Absences', href: '/attendance', icon: CalendarOff },
        ];
      default:
        return [
          { name: 'Dashboard', href: '/', icon: LayoutDashboard },
          { name: 'Mes Notes', href: '/notes', icon: FileText },
          { name: 'Mes Absences', href: '/attendance', icon: CalendarOff },
          { name: 'Mon Emploi du temps', href: '/classes', icon: School },
          { name: 'Stages', href: '/internships', icon: Briefcase },
          { name: 'Finance', href: '/finance', icon: DollarSign },
          { name: 'Documents', href: '/documents', icon: FileText },
        ];
    }
  };

  const navigation = getNavigation();

  const NavItem = ({ item }) => {
    const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
    const Icon = item.icon;
    return (
      <Link
        to={item.href}
        onClick={() => setIsMobileMenuOpen(false)}
        className={classNames(
          isActive
            ? 'bg-primary/10 text-primary border-r-4 border-primary font-semibold'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white',
          'group flex items-center px-4 py-3 text-sm transition-all duration-150 rounded-l-lg'
        )}
      >
        <Icon className={classNames(isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-500', 'mr-3 h-5 w-5 flex-shrink-0')} />
        {item.name}
      </Link>
    );
  };

  const pageTitle = location.pathname === '/'
    ? 'Dashboard'
    : location.pathname.substring(1).charAt(0).toUpperCase() + location.pathname.substring(2);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* ── Sidebar Desktop ── */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-4 bg-gradient-to-r from-primary to-violet-700 text-white">
          <GraduationCap className="h-7 w-7 mr-2 flex-shrink-0" />
          <span className="text-xl font-extrabold tracking-wider">EduFlow</span>
        </div>

        {/* Academic Year Badge */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between bg-primary/5 dark:bg-primary/10 rounded-xl px-3 py-2">
            <span className="text-xs font-semibold text-primary">Année Académique</span>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{academicYear}</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto pt-4 pb-4">
          <div className="px-4 mb-3">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Navigation</p>
          </div>
          <nav className="flex-1 space-y-0.5 pr-2">
            {navigation.map((item) => <NavItem key={item.name} item={item} />)}
          </nav>
        </div>

        {/* User section */}
        <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-800 p-4 space-y-3">
          <Link to="/profile" className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-violet-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.first_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user?.role?.name}</p>
            </div>
            <User className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        {/* Top Navbar */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <button
            className="px-4 border-r border-slate-200 dark:border-slate-800 md:hidden text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1 px-4 flex justify-between items-center gap-4">
            <h1 className="text-lg font-bold text-slate-800 dark:text-white capitalize hidden sm:block">
              {pageTitle}
            </h1>

            <div className="flex items-center gap-2 ml-auto">
              {/* Global Search (Admin only) */}
              {isAdmin && (
                <button
                  onClick={(e) => { e.stopPropagation(); setIsSearchOpen(true); }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-primary/40 transition-all group"
                  title="Search (Ctrl+K)"
                >
                  <Search className="h-4 w-4 group-hover:text-primary" />
                  <span className="hidden sm:block text-xs">Recherche...</span>
                  <kbd className="hidden sm:flex items-center gap-0.5 text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-1.5 py-0.5 rounded">
                    Ctrl K
                  </kbd>
                </button>
              )}

              {/* Academic Year Selector */}
              <div className="relative" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setIsYearOpen(o => !o)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-primary bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl hover:bg-primary/10 transition-all"
                >
                  <span className="hidden sm:block">{academicYear}</span>
                  <span className="sm:hidden">A.Y.</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isYearOpen ? 'rotate-180' : ''}`} />
                </button>

                {isYearOpen && (
                  <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-20">
                    {ACADEMIC_YEARS.map(yr => (
                      <button
                        key={yr}
                        onClick={() => selectYear(yr)}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          academicYear === yr
                            ? 'bg-primary text-white font-semibold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Notifications Bell */}
              <div className="relative" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setShowNotifications(o => !o)}
                  className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full ring-2 ring-white dark:ring-slate-900">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-20">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-xs px-2 py-0.5 rounded-full font-bold">
                          {unreadCount} Non lues
                        </span>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
                      {notifications.length === 0 ? (
                        <div className="py-10 text-center">
                          <Bell className="h-8 w-8 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                          <p className="text-sm text-slate-400">Aucune notification</p>
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => !n.is_read && markAsRead(n.id)}
                            className={`px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${!n.is_read ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                          >
                            <div className="flex items-start gap-2">
                              {!n.is_read && <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs ${!n.is_read ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                                  {n.title}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>
                                <p className="text-xs text-primary mt-1">{new Date(n.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
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

      {/* ── Mobile Menu ── */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative flex flex-col max-w-xs w-full bg-white dark:bg-slate-900 shadow-xl">
            <div className="absolute top-4 right-4">
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="h-16 flex items-center px-4 bg-gradient-to-r from-primary to-violet-700">
              <GraduationCap className="h-7 w-7 text-white mr-2" />
              <span className="text-xl font-extrabold text-white tracking-wider">EduFlow</span>
            </div>
            <div className="flex-1 overflow-y-auto pt-4 pb-4">
              <div className="px-4 mb-2">
                <div className="bg-primary/5 rounded-xl px-3 py-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary">Année Académique</span>
                  <span className="text-xs font-bold text-primary">{academicYear}</span>
                </div>
              </div>
              <nav className="mt-3 px-2 space-y-0.5">
                {navigation.map((item) => <NavItem key={item.name} item={item} />)}
                <NavItem item={{ name: 'Mon Profil', href: '/profile', icon: User }} />
              </nav>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-800 p-4">
              <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors">
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Global Search Overlay ── */}
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};

// Wrap with SearchProvider so GlobalSearch has access to index
const DashboardLayout = () => (
  <SearchProvider>
    <DashboardLayoutInner />
  </SearchProvider>
);

export default DashboardLayout;
