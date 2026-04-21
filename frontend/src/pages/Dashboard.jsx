import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Briefcase,
  DollarSign,
  GraduationCap,
  RefreshCcw,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { SkeletonCardGrid } from '../components/SkeletonLoader';
import { useAuth } from '../hooks/useAuth';
import InternshipDashboard from './InternshipDashboard';
import ScolariteDashboard from './ScolariteDashboard';
import StudentDashboard from './StudentDashboard';
import TeacherDashboard from './TeacherDashboard';

function StatCard({ loading, title, value, icon, trend }) {
  const IconComponent = icon;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{loading ? '...' : value}</p>
        </div>
        <div className="rounded-lg bg-primary/10 p-3">
          <IconComponent className="h-6 w-6 text-primary" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
          <span className="font-medium text-green-500">{trend}</span>
          <span className="ml-2 text-slate-500 dark:text-slate-400">vs last month</span>
        </div>
      )}
    </div>
  );
}

const Dashboard = () => {
  const { user } = useAuth();
  const role = user?.role?.name;

  const [stats, setStats] = useState({
    students_count: 0,
    teachers_count: 0,
    classes_count: 0,
    revenue: 0,
    payment_rate: 0,
    internship_rate: 0,
    absence_rate: 0,
    success_rate: 0,
  });
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const revenueData = [
    { name: 'Jan', amount: 4000 },
    { name: 'Feb', amount: 3000 },
    { name: 'Mar', amount: 2000 },
    { name: 'Apr', amount: 2780 },
    { name: 'May', amount: 1890 },
    { name: 'Jun', amount: 2390 },
  ];

  const attendanceData = [
    { name: 'Mon', rate: 95 },
    { name: 'Tue', rate: 92 },
    { name: 'Wed', rate: 98 },
    { name: 'Thu', rate: 90 },
    { name: 'Fri', rate: 96 },
  ];

  const fetchDashboard = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [statsResponse, alertsResponse] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/alerts'),
      ]);

      setStats(statsResponse.data);
      setAlerts(alertsResponse.data);

      if (!loading) {
        toast.success('Dashboard statistics refreshed!');
      }
    } catch {
      toast.error('Failed to load dashboard stats.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [loading]);

  useEffect(() => {
    if (role === 'Admin' || role === 'Administration') {
      void fetchDashboard();
      return;
    }

    setLoading(false);
  }, [fetchDashboard, role]);

  if (role === 'Student') return <StudentDashboard />;
  if (role === 'Teacher') return <TeacherDashboard />;
  if (role === 'Internship Officer' || role === 'Internship Manager') return <InternshipDashboard />;
  if (role === 'Scolarite') return <ScolariteDashboard />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Admin Dashboard Overview</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Welcome back, {user?.first_name || 'Admin'}! Here&apos;s what needs attention today.</p>
        </div>
        <button
          onClick={() => void fetchDashboard()}
          disabled={isRefreshing}
          className="flex items-center rounded-md border border-slate-200 bg-white px-4 py-2 text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <RefreshCcw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {loading ? (
        <SkeletonCardGrid count={8} />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard loading={loading} title="Total Etudiants" value={stats.students_count} icon={Users} trend="+4.75%" />
          <StatCard loading={loading} title="Total Enseignants" value={stats.teachers_count} icon={GraduationCap} trend="+1.2%" />
          <StatCard loading={loading} title="Taux de Reussite" value={`${stats.success_rate}%`} icon={BookOpen} />
          <StatCard loading={loading} title="Taux d'Absences" value={`${stats.absence_rate}%`} icon={Users} />
          <StatCard loading={loading} title="Revenus Total" value={`${stats.revenue} TND`} icon={DollarSign} trend="+12.5%" />
          <StatCard loading={loading} title="Taux de Paiement" value={`${stats.payment_rate}%`} icon={DollarSign} />
          <StatCard loading={loading} title="Stages Approuves" value={`${stats.internship_rate}%`} icon={Briefcase} />
          <StatCard loading={loading} title="Classes Actives" value={stats.classes_count} icon={BookOpen} />
        </div>
      )}

      {!loading && alerts.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-amber-100 p-3 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Alertes metier</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Vue synthese des sujets qui peuvent impacter les operations ou la qualite du service.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {alerts.map((alert) => {
              const Icon = alert.type === 'finance' ? DollarSign : alert.type === 'internship' ? Briefcase : Users;
              return (
                <div key={alert.key} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="rounded-xl bg-white p-2 text-primary shadow-sm dark:bg-slate-800">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{alert.value}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{alert.title}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{alert.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">Revenue Overview</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                <Bar dataKey="amount" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">Student Attendance</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 5', 'dataMax + 2']} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                <Line type="monotone" dataKey="rate" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--primary)' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
