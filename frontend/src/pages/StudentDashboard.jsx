import React, { useEffect, useState } from 'react';
import {
  BarChart2,
  Bell,
  BookOpen,
  Briefcase,
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
  { key: 'student_card', label: t('dashboard.cards.student_card'), icon: CreditCard, gradient: 'from-purple-100 to-fuchsia-100', iconBg: 'bg-purple-200/50', iconColor: 'text-purple-600', href: '/profile' },
  { key: 'messages', label: t('dashboard.cards.messages'), icon: MessageSquare, gradient: 'from-blue-100 to-sky-100', iconBg: 'bg-blue-200/50', iconColor: 'text-blue-600', href: '/messages', badge: '3' },
  { key: 'results', label: t('dashboard.cards.results'), icon: BarChart2, gradient: 'from-emerald-100 to-teal-100', iconBg: 'bg-emerald-200/50', iconColor: 'text-emerald-600', href: '/notes' },
  { key: 'absences', label: t('dashboard.cards.absences'), icon: CalendarOff, gradient: 'from-rose-100 to-pink-100', iconBg: 'bg-rose-200/50', iconColor: 'text-rose-600', href: '/attendance' },
  { key: 'schedule', label: t('dashboard.cards.schedule'), icon: CalendarDays, gradient: 'from-amber-100 to-orange-100', iconBg: 'bg-amber-200/50', iconColor: 'text-amber-600', href: '/schedules' },
  { key: 'my_group', label: t('dashboard.cards.my_group'), icon: Users, gradient: 'from-indigo-100 to-blue-100', iconBg: 'bg-indigo-200/50', iconColor: 'text-indigo-600', href: '/classes' },
  { key: 'suggestions', label: t('dashboard.cards.suggestions'), icon: Lightbulb, gradient: 'from-yellow-100 to-amber-100', iconBg: 'bg-yellow-200/50', iconColor: 'text-yellow-600', href: '/notes' },
  { key: 'languages', label: t('dashboard.cards.languages'), icon: Globe, gradient: 'from-cyan-100 to-sky-100', iconBg: 'bg-cyan-200/50', iconColor: 'text-cyan-600', href: '/profile' },
  { key: 'documents', label: t('dashboard.cards.documents'), icon: FileText, gradient: 'from-slate-100 to-gray-100', iconBg: 'bg-slate-200/50', iconColor: 'text-slate-600', href: '/documents' },
  { key: 'balance', label: t('dashboard.cards.balance'), icon: Wallet, gradient: 'from-green-100 to-emerald-100', iconBg: 'bg-green-200/50', iconColor: 'text-green-600', href: '/finance' },
];

function DashboardCard({ item }) {
  const Icon = item.icon;

  return (
    <a
      href={item.href}
      className="group relative flex flex-col items-center justify-center overflow-hidden rounded-[24px] p-6 text-center transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 active:scale-95"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-80 transition-opacity group-hover:opacity-100`} />
      <div className="absolute inset-0 bg-[length:200%_100%] bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.8)_50%,transparent_75%)] opacity-0 transition-opacity duration-500 group-hover:animate-[shimmer_1.5s_ease] group-hover:opacity-60" />

      {item.badge && (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-rose-400 text-xs font-bold text-white shadow-sm">
          {item.badge}
        </span>
      )}

      <div className="relative flex flex-col items-center gap-3">
        <div className={`rounded-2xl ${item.iconBg} p-3 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110`}>
          <Icon className={`h-7 w-7 ${item.iconColor}`} />
        </div>
        <span className="text-sm font-semibold leading-tight text-slate-700">{item.label}</span>
      </div>
    </a>
  );
}

function StatBadge({ label, value, icon, trend, bgColor, iconColor }) {
  const IconComponent = icon;

  return (
    <div className="flex items-start gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow dark:border-[#2e2a6b] dark:bg-[#1E1B4B]">
      <div className={`rounded-2xl p-3 ${bgColor}`}>
        <IconComponent className={`h-6 w-6 ${iconColor}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-black text-slate-800 dark:text-white">{value}</p>
        {trend !== undefined && (
          <div className={`mt-1 flex items-center text-xs font-bold ${trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trend >= 0 ? <TrendingUp className="mr-1 h-3.5 w-3.5" /> : <TrendingDown className="mr-1 h-3.5 w-3.5" />}
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
  const [suggestions, setSuggestions] = useState([]);
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
        setSuggestions(averageResponse.data?.suggestions || []);
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
          { id: 1, title: 'Enquête de satisfaction - Semestre 2', created_at: new Date().toISOString() },
          { id: 2, title: 'Calendrier des examens finaux publié', created_at: new Date().toISOString() },
          { id: 3, title: 'Séminaire Intelligence Artificielle', created_at: new Date().toISOString() },
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
      if (hour < 18) return 'Bon après-midi';
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
    { time: '10:00', subject: 'Base de données', room: 'Labo 3', color: 'bg-blue-500' },
    { time: '13:00', subject: 'Réseaux', room: 'Salle 105', color: 'bg-amber-500' },
    { time: '15:30', subject: 'Génie Logiciel', room: 'Amphi A', color: 'bg-emerald-500' },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-indigo-100 via-purple-100 to-pink-100 p-8 text-slate-800 shadow-xl shadow-purple-200/30">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/40 blur-3xl" />
        <div className="absolute bottom-0 left-16 h-32 w-32 rounded-full bg-white/40 blur-2xl" />
        <div className="absolute right-8 top-8 opacity-[0.08]">
          <Star className="h-40 w-40 fill-purple-600" />
        </div>

        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full border-4 border-white bg-purple-200/50 text-3xl font-bold text-purple-700 shadow-md backdrop-blur-sm">
              {user?.first_name?.charAt(0) || 'S'}
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide text-purple-600/80">{greetingTime()}</p>
              <h2 className="mt-0.5 text-3xl font-extrabold tracking-tight text-slate-800 sm:text-4xl">{user?.first_name} {user?.last_name}</h2>
              <p className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-600">
                <BookOpen className="h-4 w-4 text-purple-500" />
                {user?.student?.classe?.name || '—'}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="rounded-2xl border border-white/50 bg-white/40 px-5 py-3 text-center shadow-sm backdrop-blur-md">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Moyenne</p>
              <p className="mt-1 text-2xl font-black text-slate-800">{loadingStats ? '…' : `${stats.average}/20`}</p>
            </div>
            <div className="rounded-2xl border border-white/50 bg-white/40 px-5 py-3 text-center shadow-sm backdrop-blur-md">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Absences</p>
              <p className="mt-1 text-2xl font-black text-slate-800">{loadingStats ? '…' : stats.absences}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatBadge label="Moyenne Générale" value={loadingStats ? '…' : `${stats.average}/20`} icon={BarChart2} trend={2.1} bgColor="bg-purple-100" iconColor="text-purple-600" />
        <StatBadge label="Absences" value={loadingStats ? '…' : stats.absences} icon={CalendarOff} trend={-1} bgColor="bg-rose-100" iconColor="text-rose-600" />
        <StatBadge label="Finance" value={user?.student?.studentFinances?.financial_status || 'À jour'} icon={Wallet} bgColor="bg-emerald-100" iconColor="text-emerald-600" />
        <StatBadge label="Stage" value="À rechercher" icon={Briefcase} bgColor="bg-blue-100" iconColor="text-blue-600" />
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
        {/* Actualités */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-[#2e2a6b] dark:bg-[#1E1B4B]">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-[#2e2a6b]">
            <h3 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white text-sm">
              <Bell className="h-5 w-5 text-primary" />
              {t('dashboard.actualites')}
            </h3>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {visibleAnnouncements.length}
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
                  <div key={announcement.id} className="group flex items-start gap-3 px-5 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-[#2e2a6b]/50">
                    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${color}`}>
                      !
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold leading-snug text-slate-800 dark:text-white line-clamp-2">{announcement.title}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock className="h-2.5 w-2.5" />
                        {announcement.created_at
                          ? new Date(announcement.created_at).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short' })
                          : '—'}
                      </p>
                    </div>
                    <button
                      onClick={() => setDismissedIds((ids) => [...ids, announcement.id])}
                      className="text-slate-300 opacity-0 transition-all hover:text-slate-500 group-hover:opacity-100 dark:hover:text-slate-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Suggestions & Conseils */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-[#2e2a6b] dark:bg-[#1E1B4B]">
          <div className="border-b border-slate-100 px-6 py-4 dark:border-[#2e2a6b]">
            <h3 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white text-sm">
              <Lightbulb className="h-5 w-5 text-amber-500 animate-pulse" />
              Recommandations de l'IA (Ollama)
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {loadingStats ? (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-5/6"></div>
                <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-full"></div>
                <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-2/3"></div>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 p-4 text-center">
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">Félicitations ! 🌟</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">Excellent parcours académique et d'assiduité. Continuez ainsi !</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {suggestions.map((sug, i) => {
                  const isWarning = sug.toLowerCase().includes('warning') || sug.toLowerCase().includes('needs') || sug.toLowerCase().includes('critical');
                  return (
                    <div 
                      key={i} 
                      className={`flex items-start gap-2.5 rounded-xl p-3 text-xs border ${
                        sug.toLowerCase().includes('critical')
                          ? 'bg-rose-50 border-rose-100 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400'
                          : isWarning
                            ? 'bg-amber-50 border-amber-100 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400'
                            : 'bg-indigo-50 border-indigo-100 text-indigo-850 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400'
                      }`}
                    >
                      <span className="text-base mt-0.5">{sug.toLowerCase().includes('critical') ? '🛑' : isWarning ? '⚠️' : '💡'}</span>
                      <p className="font-medium leading-relaxed">{sug}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Emploi du temps */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-[#2e2a6b] dark:bg-[#1E1B4B]">
          <div className="border-b border-slate-100 px-6 py-4 dark:border-[#2e2a6b]">
            <h3 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white text-sm">
              <CalendarDays className="h-5 w-5 text-purple-500" />
              {t('dashboard.cards.schedule')}
            </h3>
          </div>
          <div className="space-y-3 p-4">
            {schedulePreview.map((item) => (
              <div key={`${item.time}-${item.subject}`} className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50 dark:hover:bg-[#2e2a6b]/50">
                <div className={`w-1.5 flex-shrink-0 self-stretch rounded-full ${item.color}`} />
                <div className="flex-1">
                  <p className="text-[10px] font-medium text-slate-400">{item.time}</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{item.subject}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.room}</p>
                </div>
              </div>
            ))}
            <a href="/schedules" className="mt-2 block text-center text-xs font-semibold text-primary hover:underline">
              Voir tout l'emploi du temps →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
