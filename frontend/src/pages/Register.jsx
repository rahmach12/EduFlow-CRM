import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/axios';
import { School, User, Lock, Calendar, Phone, MapPin, Hash } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', password: '', 
    cin: '', gender: 'Male', date_of_birth: '', phone: '', 
    address: '', class_id: '', subject_id: ''
  });
  
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (role === 'student') {
          const res = await api.get('/classes');
          setClasses(res.data);
        } else {
          const res = await api.get('/subjects');
          setSubjects(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      }
    };
    fetchData();
  }, [role]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/register', { ...formData, role });
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-primary">
          <School size={48} />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white">
          Join EduFlow CRM
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Create your account as a
        </p>
        
        <div className="mt-4 flex justify-center space-x-4">
          <button 
            className={`px-4 py-2 rounded-md font-medium ${role === 'student' ? 'bg-primary text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}
            onClick={() => setRole('student')}
          >
            Student
          </button>
          <button 
            className={`px-4 py-2 rounded-md font-medium ${role === 'teacher' ? 'bg-primary text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}
            onClick={() => setRole('teacher')}
          >
            Teacher
          </button>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200 dark:border-slate-700">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">First Name</label>
                <input name="first_name" required value={formData.first_name} onChange={handleChange} className="mt-1 block w-full border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-md py-2 px-3 focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Last Name</label>
                <input name="last_name" required value={formData.last_name} onChange={handleChange} className="mt-1 block w-full border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-md py-2 px-3 focus:ring-primary focus:border-primary" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email address</label>
              <input name="email" type="email" required value={formData.email} onChange={handleChange} className="mt-1 block w-full border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-md py-2 px-3 focus:ring-primary focus:border-primary" />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">CIN</label>
                  <input name="cin" required value={formData.cin} onChange={handleChange} className="mt-1 block w-full border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-md py-2 px-3 focus:ring-primary focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-md py-2 px-3 focus:ring-primary focus:border-primary" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                <input name="password" type="password" required minLength="6" value={formData.password} onChange={handleChange} className="mt-1 block w-full border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-md py-2 px-3 focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Date of Birth</label>
                <input name="date_of_birth" type="date" required value={formData.date_of_birth} onChange={handleChange} className="mt-1 block w-full border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-md py-2 px-3 focus:ring-primary focus:border-primary" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="mt-1 block w-full border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-md py-2 px-3 focus:ring-primary focus:border-primary">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            {role === 'student' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Class</label>
                <select name="class_id" required value={formData.class_id} onChange={handleChange} className="mt-1 block w-full border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-md py-2 px-3 focus:ring-primary focus:border-primary">
                  <option value="">Select a Class...</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.filiere ? `(${c.filiere.name})` : ''}</option>
                  ))}
                </select>
              </div>
            )}

            {role === 'teacher' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Subject Specialty</label>
                <select name="subject_id" value={formData.subject_id} onChange={handleChange} className="mt-1 block w-full border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-md py-2 px-3 focus:ring-primary focus:border-primary">
                   <option value="">Select a Subject...</option>
                   {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="pt-2">
              <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50">
                {isLoading ? 'Registering...' : 'Register as ' + (role.charAt(0).toUpperCase() + role.slice(1))}
              </button>
            </div>
            
            <div className="text-center mt-4">
              <span className="text-sm text-slate-500">Already have an account? </span>
              <Link to="/login" className="text-sm text-primary font-semibold hover:underline">Log in</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
