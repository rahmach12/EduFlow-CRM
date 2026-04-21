import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './layouts/DashboardLayout';
import StudentLayout from './layouts/StudentLayout';
import TeacherLayout from './layouts/TeacherLayout';
import { NotificationProvider } from './contexts/NotificationContext';
import Dashboard from './pages/Dashboard';

import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Filieres from './pages/Filieres';
import { Classes } from './pages/Classes';
import { Subjects } from './pages/Subjects';
import { Notes } from './pages/Notes';
import { Finance } from './pages/Finance';
import { Attendance } from './pages/Attendance';
import Messages from './pages/Messages';
import Documents from './pages/Documents';
import { Internships } from './pages/Internships';
import Profile from './pages/Profile';
import InternshipDashboard from './pages/InternshipDashboard';
import ScolariteDashboard from './pages/ScolariteDashboard';
import UserManagement from './pages/UserManagement';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0F172A]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Chargement...</p>
      </div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Choose layout based on role
const RoleBasedLayout = () => {
  const { user } = useAuth();
  const role = user?.role?.name;

  if (role === 'Student') return <StudentLayout />;
  if (role === 'Teacher') return <TeacherLayout />;
  return <DashboardLayout />;  // Admin / Administration
};

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: '12px', background: '#1e1b4b', color: '#fff' } }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <NotificationProvider>
              <RoleBasedLayout />
            </NotificationProvider>
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="teachers" element={<Teachers />} />
          <Route path="filieres" element={<Filieres />} />
          <Route path="classes" element={<Classes />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="notes" element={<Notes />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="finance" element={<Finance />} />
          <Route path="messages" element={<Messages />} />
          <Route path="documents" element={<Documents />} />
          <Route path="internships" element={<Internships />} />
          <Route path="internship-dashboard" element={<InternshipDashboard />} />
          <Route path="scolarite" element={<ScolariteDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
