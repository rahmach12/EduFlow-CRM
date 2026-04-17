import React, { useState, useEffect } from 'react';
import {
  CreditCard, MessageSquare, BarChart2, CalendarOff, CalendarDays,
  Users, Lightbulb, Globe, FileText, Wallet, ClipboardList, BookOpen,
  TrendingUp, TrendingDown, Bell, ChevronRight, Clock, Star, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../lib/axios';

// ─────── Card Config ───────────────────────────────────────────────────
const CARD_CONFIG = (t) => [
  {
    key: 'student_card',
    label: t('dashboard.cards.student_card'),
    icon: CreditCard,
    gradient: 'from-violet-500 to-purple-700',
    href: '/profile',
  },
  {
    key: 'messages',
    label: t('dashboard.cards.messages'),
    icon: MessageSquare,
    gradient: 'from-blue-500 to-blue-700',
    href: '/messages',
    badge: '3',
  },
  {
    key: 'results',
    label: t('dashboard.cards.results'),
    icon: BarChart2,
    gradient: 'from-emerald-500 to-teal-700',
    href: '/notes',
  },
  {
    key: 'absences',
    label: t('dashboard.cards.absences'),
    icon: CalendarOff,
    gradient: 'from-rose-500 to-red-700',
    href: '/absences',
  },
  {
    key: 'schedule',
    label: t('dashboard.cards.schedule'),
    icon: CalendarDays,
    gradient: 'from-amber-500 to-orange-600',
    href: '/classes',
  },
  {
    key: 'my_group',
    label: t('dashboard.cards.my_group'),
    icon: Users,
    gradient: 'from-indigo-500 to-indigo-700',
    href: '/classes',
  },
  {
    key: 'suggestions',
    label: t('dashboard.cards.suggestions'),
    icon: Lightbulb,
    gradient: 'from-yellow-400 to-amber-600',
    href: '#',
  },
  {
    key: 'languages',
    label: t('dashboard.cards.languages'),
    icon: Globe,
    gradient: 'from-cyan-500 to-sky-700',
    href: '#',
  },
  {
    key: 'documents',
    label: t('dashboard.cards.documents'),
    icon: FileText,
    gradient: 'from-slate-500 to-slate-700',
    href: '#',
  },
  {
    key: 'balance',
    label: t('dashboard.cards.balance'),
    icon: Wallet,
    gradient: 'from-green-500 to-green-700',
    href: '#',
  },
  {
    key: 'surveys',
    label: t('dashboard.cards.surveys'),
    icon: ClipboardList,
    gradient: 'from-pink-500 to-rose-600',
    href: '#',
  },
  {
    key: 'epi_sup',
    label: t('dashboard.cards.epi_sup'),
    icon: BookOpen,
    gradient: 'from-purple-500 to-violet-700',
    href: '#',
  },
];

// ─────── DashboardCard Sub-component ────────────────────────────────────
const DashboardCard = ({ item }) => {
  const Icon = item.icon;
  return (
    <a
      href={item.href}
      className="group relative flex flex-col items-center justify-center p-6 rounded-2xl text-white text-center
                 overflow-hidden cursor-pointer transition-all duration-300 ease-out
                 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 active:scale-95"
      style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
    >
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-90 group-hover:opacity-100 transition-opacity`} />

      {/* Shimmer effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500
                      bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.5)_50%,transparent_75%)]
                      bg-[length:200%_100%] group-hover:animate-[shimmer_1.5s_ease]" />

      {/* Badge */}
      {item.badge && (
        <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-rose-600 shadow">
          {item.badge}
        </span>
      )}

      <div className="relative flex flex-col items-center gap-3">
        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:bg-white/30 transition-colors">
          <Icon className="h-7 w-7 text-white" />
        </div>
        <span className="text-sm font-semibold leading-tight">{item.label}</span>
        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-80 -mt-1 transition-all group-hover:translate-x-1 duration-300" />
      </div>
    </a>
  );
};

// ─────── StatBadge Sub-component ────────────────────────────────────────
const StatBadge = ({ label, value, icon: Icon, trend, color }) => (
  <div className="bg-white dark:bg-[#1E1B4B] rounded-2xl p-5 border border-slate-100 dark:border-[#2e2a6b] shadow-sm flex items-start gap-4">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon className="h-5 w-5 text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider truncate">{label}</p>
      <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{value}</p>
      {trend !== undefined && (
        <div className={`flex items-center mt-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
          {Math.abs(trend)}% vs last month
        </div>
      )}
    </div>
  </div>
);

// ─────── Main StudentDashboard ────────────────────────────────────────────
const StudentDashboard = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const [stats, setStats] = useState({ average: null, absences: null });
  const [announcements, setAnnouncements] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);
  const [dismissedIds, setDismissedIds] = useState([]);

  const isArabicName = (name) => /[\u0600-\u06FF]/.test(name);

  const greetingTime = () => {
    const h = new Date().getHours();
    const lang = i18n.language;
    if (lang === 'fr') {
      if (h < 12) return 'Bonjour';
      if (h < 18) return 'Bon après-midi';
      return 'Bonsoir';
    } else {
      if (h < 12) return 'Good morning';
      if (h < 18) return 'Good afternoon';
      return 'Good evening';
    }
  };

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const studentId = user?.student?.id;
        if (studentId) {
          const avgRes = await api.get(`/students/${studentId}/average`);
          const absRes = await api.get('/absences');
          const myAbsences = absRes.data?.data?.filter(a => a.student_id === studentId) || [];
          setStats({
            average: avgRes.data?.average ?? '—',
            absences: myAbsences.length,
          });
        }
      } catch (e) {
        setStats({ average: '—', absences: '—' });
      } finally {
        setLoadingStats(false);
      }
    };

    const fetchAnnouncements = async () => {
      try {
        const res = await api.get('/announcements');
        setAnnouncements(res.data?.data?.slice(0, 4) || res.data?.slice(0, 4) || []);
      } catch {
        // Use mock data if API fails
        setAnnouncements([
          { id: 1, title: 'Enquête de satisfaction — Semestre 2', date: new Date().toISOString(), target_roles: 'Student' },
          { id: 2, title: 'Calendrier des examens finaux publié', date: new Date().toISOString(), target_roles: 'All' },
          { id: 3, title: 'Séminaire Intelligence Artificielle', date: new Date().toISOString(), target_roles: 'Student, Administration' },
        ]);
      } finally {
        setLoadingNews(false);
      }
    };

    fetchStudentData();
    fetchAnnouncements();
  }, [user]);

  const cards = CARD_CONFIG(t);
  const dismissedAnnouncements = announcements.filter(a => !dismissedIds.includes(a.id));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">

      {/* ── Hero Welcome Banner ───────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-[#7C3AED] via-[#8B5CF6] to-[#A78BFA] p-8 text-white shadow-2xl shadow-purple-500/30">
        {/* Background decoration */}
        <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-16 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute top-8 right-8 opacity-20">
          <Star className="h-40 w-40 fill-white" />
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex-shrink-0 h-20 w-20 rounded-full bg-white/25 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center text-3xl font-bold shadow-inner">
              {user?.first_name?.charAt(0) || 'S'}
            </div>
            <div>
              <p className="text-white/70 text-sm font-medium tracking-wide">{greetingTime()} 👋</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-0.5">
                {user?.first_name} {user?.last_name}
              </h2>
              <p className="mt-2 text-white/80 text-sm font-medium flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {user?.student?.classe?.name || '—'}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-3 text-center border border-white/20">
              <p className="text-xs text-white/60 uppercase tracking-wider font-medium">Moyenne</p>
              <p className="text-2xl font-bold mt-1">
                {loadingStats ? '…' : (stats.average !== null ? `${stats.average}/20` : '—')}
              </p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-3 text-center border border-white/20">
              <p className="text-xs text-white/60 uppercase tracking-wider font-medium">Absences</p>
              <p className="text-2xl font-bold mt-1">
                {loadingStats ? '…' : stats.absences}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Stats Row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBadge
          label="Moyenne Générale"
          value={loadingStats ? '…' : (stats.average !== null ? `${stats.average}/20` : '—')}
          icon={BarChart2}
          trend={2.1}
          color="bg-gradient-to-br from-violet-500 to-purple-700"
        />
        <StatBadge
          label="Absences"
          value={loadingStats ? '…' : stats.absences}
          icon={CalendarOff}
          trend={-1}
          color="bg-gradient-to-br from-rose-500 to-red-700"
        />
        <StatBadge
          label="Emploi du temps"
          value="Actif"
          icon={CalendarDays}
          color="bg-gradient-to-br from-amber-500 to-orange-600"
        />
        <StatBadge
          label="Messages"
          value="3"
          icon={MessageSquare}
          color="bg-gradient-to-br from-blue-500 to-blue-700"
        />
      </div>

      {/* ── Main Grid of Cards ────────────────────────────────────────── */}
      <section>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <span className="h-1 w-5 bg-primary rounded-full inline-block" />
          {t('dashboard.title')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {cards.map((item) => (
            <DashboardCard key={item.key} item={item} />
          ))}
        </div>
      </section>

      {/* ── Announcements + Schedule Side-by-side ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Announcements */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1E1B4B] rounded-2xl border border-slate-100 dark:border-[#2e2a6b] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-[#2e2a6b] flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              {t('dashboard.actualites')}
            </h3>
            <span className="text-xs text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full">
              {dismissedAnnouncements.length} nouvelles
            </span>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-[#2e2a6b]">
            {loadingNews ? (
              <div className="p-6 space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="animate-pulse flex gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-700 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-3/4" />
                      <div className="h-2 bg-slate-50 dark:bg-slate-800 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : dismissedAnnouncements.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center gap-2">
                <Bell className="h-10 w-10 opacity-20" />
                <p className="text-sm">{t('messages.no_news')}</p>
              </div>
            ) : (
              dismissedAnnouncements.map((ann, idx) => {
                const colors = ['bg-purple-100 text-purple-600', 'bg-blue-100 text-blue-600', 'bg-amber-100 text-amber-600', 'bg-emerald-100 text-emerald-600'];
                const color = colors[idx % colors.length];
                return (
                  <div key={ann.id} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-[#2e2a6b]/50 transition-colors group">
                    <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${color}`}>
                      📢
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white leading-snug truncate">{ann.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {ann.date ? new Date(ann.date).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long' }) : '—'}
                      </p>
                    </div>
                    <button
                      onClick={() => setDismissedIds(prev => [...prev, ann.id])}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-slate-500 dark:hover:text-slate-200 transition-all"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Schedule Preview (Mock) */}
        <div className="bg-white dark:bg-[#1E1B4B] rounded-2xl border border-slate-100 dark:border-[#2e2a6b] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-[#2e2a6b]">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-amber-500" />
              {t('dashboard.cards.schedule')}
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {[
              { time: '08:00', subject: 'Algorithmique', room: 'Salle 201', color: 'bg-violet-500' },
              { time: '10:00', subject: 'Base de données', room: 'Labo 3', color: 'bg-blue-500' },
              { time: '13:00', subject: 'Réseaux', room: 'Salle 105', color: 'bg-amber-500' },
              { time: '15:30', subject: 'Génie Logiciel', room: 'Amphi A', color: 'bg-emerald-500' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-[#2e2a6b]/50 transition-colors">
                <div className={`flex-shrink-0 w-1.5 self-stretch rounded-full ${item.color}`} />
                <div className="flex-1">
                  <p className="text-xs text-slate-400 font-medium">{item.time}</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{item.subject}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.room}</p>
                </div>
              </div>
            ))}
            <a href="/classes" className="block mt-2 text-center text-xs font-semibold text-primary hover:underline">
              Voir tout l'emploi du temps →
            </a>
          </div>
        </div>
      </div>

    </div>
  );
};

export default StudentDashboard;
