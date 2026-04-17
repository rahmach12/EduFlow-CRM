import React, { useState, useEffect } from 'react';
import { 
  Users, BookOpen, GraduationCap, DollarSign, 
  TrendingUp, RefreshCcw 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import StudentDashboard from './StudentDashboard';
import TeacherDashboard from './TeacherDashboard';
import InternshipDashboard from './InternshipDashboard';
import ScolariteDashboard from './ScolariteDashboard';
import { SkeletonCardGrid } from '../components/SkeletonLoader';

const Dashboard = () => {
  const { user } = useAuth();
  
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
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fallback chart data
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

  const fetchStats = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
      if(isRefreshing) toast.success("Dashboard statistics refreshed!");
    } catch (error) {
      toast.error("Failed to load dashboard stats.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Only fetch stats if admin/administration to avoid blank page crashes
    const role = user?.role?.name;
    if (role === 'Admin' || role === 'Administration') {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [user]);

  const StatCard = ({ title, value, icon: Icon, trend }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {loading ? "..." : value}
          </p>
        </div>
        <div className="p-3 bg-primary/10 rounded-lg">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
          <span className="text-green-500 font-medium">{trend}</span>
          <span className="text-slate-500 dark:text-slate-400 ml-2">vs last month</span>
        </div>
      )}
    </div>
  );

  const role = user?.role?.name;

  if (role === 'Student') {
    return <StudentDashboard />;
  }
  
  if (role === 'Teacher') {
    return <TeacherDashboard />;
  }

  if (role === 'Internship Officer' || role === 'Internship Manager') {
    return <InternshipDashboard />;
  }

  if (role === 'Scolarite') {
    return <ScolariteDashboard />;
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Admin Dashboard Overview</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Welcome back, {user?.first_name || 'Admin'}! Here's what's happening today.</p>
        </div>
        <button 
          onClick={fetchStats}
          disabled={isRefreshing}
          className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCcw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {loading ? (
        <SkeletonCardGrid count={8} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Étudiants" value={stats.students_count} icon={Users} trend="+4.75%" />
          <StatCard title="Total Enseignants" value={stats.teachers_count} icon={GraduationCap} trend="+1.2%" />
          <StatCard title="Taux de Réussite" value={`${stats.success_rate}%`} icon={BookOpen} />
          <StatCard title="Taux d'Absences" value={`${stats.absence_rate}%`} icon={Users} />
          <StatCard title="Revenus Total" value={`${stats.revenue} TND`} icon={DollarSign} trend="+12.5%" />
          <StatCard title="Taux de Paiement" value={`${stats.payment_rate}%`} icon={DollarSign} />
          <StatCard title="Stages Approuvés" value={`${stats.internship_rate}%`} icon={GraduationCap} />
          <StatCard title="Classes Actives" value={stats.classes_count} icon={BookOpen} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Revenue Overview</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="amount" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Student Attendance</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 5', 'dataMax + 2']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
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
