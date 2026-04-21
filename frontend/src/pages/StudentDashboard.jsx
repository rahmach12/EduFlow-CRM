import React, { useEffect, useState } from 'react';
import {
  BarChart2,
  Bell,
  BookOpen,
  CalendarDays,
  CalendarOff,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  Globe,
  Lightbulb,
  MessageSquare,
  Star,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../lib/axios';
import { useAuth } from '../hooks/useAuth';

const CARD_CONFIG = (t) => [
  { key: 'student_card', label: t('dashboard.cards.student_card'), icon: CreditCard, gradient: 'from-violet-500 to-purple-700', href: '/profile' },
  { key: 'messages', label: t('dashboard.cards.messages'), icon: MessageSquare, gradient: 'from-blue-500 to-blue-700', href: '/messages', badge: '3' },
  { key: 'results', label: t('dashboard.cards.results'), icon: BarChart2, gradient: 'from-emerald-500 to-teal-700', href: '/notes' },
  { key: 'absences', label: t('dashboard.cards.absences'), icon: CalendarOff, gradient: 'from-rose-500 to-red-700', href: '/attendance' },
  { key: 'schedule', label: t('dashboard.cards.schedule'), icon: CalendarDays, gradient: 'from-amber-500 to-orange-600', href: '/classes' },
  { key: 'my_group', label: t('dashboard.cards.my_group'), icon: Users, gradient: 'from-indigo-500 to-indigo-700', href: '/classes' },
  { key: 'suggestions', label: t('dashboard.cards.suggestions'), icon: Lightbulb, gradient: 'from-yellow-400 to-amber-600', href: '/notes' },
  { key: 'languages', label: t('dashboard.cards.languages'), icon: Globe, gradient: 'from-cyan-500 to-sky-700', href: '/profile' },
  { key: 'documents', label: t('dashboard.cards.documents'), icon: FileText, gradient: 'from-slate-500 to-slate-700', href: '/documents' },
  { key: 'balance', label: t('dashboard.cards.balance'), icon: Wallet, gradient: 'from-green-500 to-green-700', href: '/finance' },
];

function DashboardCard({ item }) {
  const Icon = item.icon;

  return (
    <a
      href={item.href}
      className="group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl p-6 text-center text-white transition-all duration-300 ease-out hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 active:scale-95"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-90 transition-opacity group-hover:opacity-100`} />
      <div className="absolute inset-0 bg-[length:200%_100%] bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.5)_50%,transparent_75%)] opacity-0 transition-opacity duration-500 group-hover:animate-[shimmer_1.5s_ease] group-hover:opacity-10" />

      {item.badge && (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-rose-600 shadow">
          {item.badge}
        </span>
      )}

      <div className="relative flex flex-col items-center gap-3">
        <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm transition-colors group-hover:bg-white/30">
          <Icon className="h-7 w-7 text-white" />
        </div>
        <span className="text-sm font-semibold leading-tight">{item.label}</span>
        <ChevronRight className="h-4 w-4 -mt-1 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-80" />
      </div>
    </a>
  );
}

function StatBadge({ label, value, icon, trend, color }) {
  const IconComponent = icon;

  return (
    <div className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-[#2e2a6b] dark:bg-[#1E1B4B]">
      <div className={`rounded-xl p-3 ${color}`}>
        <IconComponent className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
        {trend !== undefined && (
          <div className={`mt-1 flex items-center text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0 ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
            {Math.abs(trend)}% vs last month
          </div>
        )}
      </div>
    </div>
  );
}

const StudentDashboard = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState({ average: '—', absences: '—' });
  const [announcements, setAnnouncements] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);
  const [dismissedIds, setDismissedIds] = useState([]);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const studentId = user?.student?.id;
        if (!studentId) return;

        const [averageResponse, attendanceResponse] = await Promise.all([
          api.get(`/students/${studentId}/average`),
          api.get('/attendance'),
        ]);

        const absences = (attendanceResponse.data || []).filter((session) =>
          session.records?.some((record) => record.status === 'absent')
        );

        setStats({
          average: averageResponse.data?.general_average ?? '—',
          absences: absences.length,
        });
      } catch {
        setStats({ average: '—', absences: '—' });
      } finally {
        setLoadingStats(false);
      }
    };

    const fetchAnnouncements = async () => {
      try {
        const response = await api.get('/notifications');
        setAnnouncements((response.data || []).slice(0, 4));
      } catch {
        setAnnouncements([
          { id: 1, title: 'Enquete de satisfaction - Semestre 2', created_at: new Date().toISOString() },
          { id: 2, title: 'Calendrier des examens finaux publie', created_at: new Date().toISOString() },
          { id: 3, title: 'Seminaire Intelligence Artificielle', created_at: new Date().toISOString() },
        ]);
      } finally {
        setLoadingNews(false);
      }
    };

    void fetchStudentData();
    void fetchAnnouncements();
  }, [user]);

  const greetingTime = () => {
    const hour = new Date().getHours();
    if (i18n.language === 'fr') {
      if (hour < 12) return 'Bonjour';
      if (hour < 18) return 'Bon apres-midi';
      return 'Bonsoir';
    }

    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const cards = CARD_CONFIG(t);
  const visibleAnnouncements = announcements.filter((announcement) => !dismissedIds.includes(announcement.id));
  const schedulePreview = [
    { time: '08:00', subject: 'Algorithmique', room: 'Salle 201', color: 'bg-violet-500' },
    { time: '10:00', subject: 'Base de donnees', room: 'Labo 3', color: 'bg-blue-500' },
    { time: '13:00', subject: 'Reseaux', room: 'Salle 105', color: 'bg-amber-500' },
    { time: '15:30', subject: 'Genie Logiciel', room: 'Amphi A', color: 'bg-emerald-500' },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-[#7C3AED] via-[#8B5CF6] to-[#A78BFA] p-8 text-white shadow-2xl shadow-purple-500/30">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-16 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute right-8 top-8 opacity-20">
          <Star className="h-40 w-40 fill-white" />
        </div>

        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full border-2 border-white/40 bg-white/25 text-3xl font-bold shadow-inner backdrop-blur-sm">
              {user?.first_name?.charAt(0) || 'S'}
            </div>
            <div>
              <p className="text-sm font-medium tracking-wide text-white/70">{greetingTime()}</p>
              <h2 className="mt-0.5 text-3xl font-extrabold tracking-tight sm:text-4xl">{user?.first_name} {user?.last_name}</h2>
              <p className="mt-2 flex items-center gap-2 text-sm font-medium text-white/80">
                <BookOpen className="h-4 w-4" />
                {user?.student?.classe?.name || '—'}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="rounded-2xl border border-white/20 bg-white/15 px-5 py-3 text-center backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-white/60">Moyenne</p>
              <p className="mt-1 text-2xl font-bold">{loadingStats ? '…' : `${stats.average}/20`}</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/15 px-5 py-3 text-center backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-white/60">Absences</p>
              <p className="mt-1 text-2xl font-bold">{loadingStats ? '…' : stats.absences}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatBadge label="Moyenne Generale" value={loadingStats ? '…' : `${stats.average}/20`} icon={BarChart2} trend={2.1} color="bg-gradient-to-br from-violet-500 to-purple-700" />
        <StatBadge label="Absences" value={loadingStats ? '…' : stats.absences} icon={CalendarOff} trend={-1} color="bg-gradient-to-br from-rose-500 to-red-700" />
        <StatBadge label="Emploi du temps" value="Actif" icon={CalendarDays} color="bg-gradient-to-br from-amber-500 to-orange-600" />
        <StatBadge label="Messages" value="3" icon={MessageSquare} color="bg-gradient-to-br from-blue-500 to-blue-700" />
      </div>

      <section>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white">
          <span className="inline-block h-1 w-5 rounded-full bg-primary" />
          {t('dashboard.title')}
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {cards.map((item) => <DashboardCard key={item.key} item={item} />)}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-[#2e2a6b] dark:bg-[#1E1B4B] lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-[#2e2a6b]">
            <h3 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
              <Bell className="h-5 w-5 text-primary" />
              {t('dashboard.actualites')}
            </h3>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {visibleAnnouncements.length} nouvelles
            </span>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-[#2e2a6b]">
            {loadingNews ? (
              <div className="space-y-3 p-6">
                {[1, 2, 3].map((index) => (
                  <div key={index} className="flex animate-pulse gap-3">
                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-slate-100 dark:bg-slate-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-3/4 rounded bg-slate-100 dark:bg-slate-700" />
                      <div className="h-2 w-1/2 rounded bg-slate-50 dark:bg-slate-800" />
                    </div>
                  </div>
                ))}
              </div>
            ) : visibleAnnouncements.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-8 text-center text-slate-400 dark:text-slate-500">
                <Bell className="h-10 w-10 opacity-20" />
                <p className="text-sm">{t('messages.no_news')}</p>
              </div>
            ) : (
              visibleAnnouncements.map((announcement, index) => {
                const colors = ['bg-purple-100 text-purple-600', 'bg-blue-100 text-blue-600', 'bg-amber-100 text-amber-600', 'bg-emerald-100 text-emerald-600'];
                const color = colors[index % colors.length];

                return (
                  <div key={announcement.id} className="group flex items-start gap-4 px-6 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-[#2e2a6b]/50">
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${color}`}>
                      !
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold leading-snug text-slate-800 dark:text-white">{announcement.title}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="h-3 w-3" />
                        {announcement.created_at
                          ? new Date(announcement.created_at).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long' })
                          : '—'}
                      </p>
                    </div>
                    <button
                      onClick={() => setDismissedIds((ids) => [...ids, announcement.id])}
                      className="text-slate-300 opacity-0 transition-all hover:text-slate-500 group-hover:opacity-100 dark:hover:text-slate-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-[#2e2a6b] dark:bg-[#1E1B4B]">
          <div className="border-b border-slate-100 px-6 py-4 dark:border-[#2e2a6b]">
            <h3 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
              <CalendarDays className="h-5 w-5 text-amber-500" />
              {t('dashboard.cards.schedule')}
            </h3>
          </div>
          <div className="space-y-3 p-4">
            {schedulePreview.map((item) => (
              <div key={`${item.time}-${item.subject}`} className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50 dark:hover:bg-[#2e2a6b]/50">
                <div className={`w-1.5 flex-shrink-0 self-stretch rounded-full ${item.color}`} />
                <div className="flex-1">
                  <p className="text-xs font-medium text-slate-400">{item.time}</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{item.subject}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.room}</p>
                </div>
              </div>
            ))}
            <a href="/classes" className="mt-2 block text-center text-xs font-semibold text-primary hover:underline">
              Voir tout l'emploi du temps →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
