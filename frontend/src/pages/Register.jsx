import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/axios';
import { GraduationCap, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', password: '', 
    cin: '', gender: 'M', date_of_birth: '', phone: '', 
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
      toast.success('Inscription réussie ! Veuillez vous connecter.');
      navigate('/login');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'L\'inscription a échoué');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#0F172A] selection:bg-primary/30">
      {/* Left Panel - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-purple-600 to-indigo-800">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl mix-blend-screen"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl mix-blend-screen"></div>
        
        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24 h-full text-white">
          <div className="inline-flex items-center justify-center p-4 bg-white/10 backdrop-blur-md rounded-2xl w-fit mb-8 border border-white/20 shadow-xl">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl xl:text-5xl font-black mb-6 leading-tight">
            Démarrez votre parcours <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200">
              dès aujourd'hui
            </span>
          </h1>
          <p className="text-lg text-white/80 max-w-md font-medium leading-relaxed">
            Rejoignez l'établissement via EduFlow CRM pour profiter d'un suivi académique complet et en temps réel.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex flex-col justify-center w-full lg:w-1/2 px-6 py-12 sm:px-12 xl:px-24 h-screen overflow-y-auto">
        <div className="w-full max-w-lg mx-auto">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="p-3 bg-gradient-to-br from-primary to-purple-700 rounded-xl shadow-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">EduFlow</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Créer un compte 🚀</h2>
            <p className="text-slate-500 dark:text-slate-400">Remplissez vos informations pour vous inscrire.</p>
          </div>

          <div className="flex mb-8 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit">
            <button 
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${role === 'student' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              onClick={() => setRole('student')}
            >
              Étudiant
            </button>
            <button 
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${role === 'teacher' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              onClick={() => setRole('teacher')}
            >
              Enseignant
            </button>
          </div>

          <div className="bg-white dark:bg-[#1E1B4B]/40 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 backdrop-blur-xl">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Prénom</label>
                  <input name="first_name" required value={formData.first_name} onChange={handleChange} className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nom</label>
                  <input name="last_name" required value={formData.last_name} onChange={handleChange} className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
                <input name="email" type="email" required value={formData.email} onChange={handleChange} className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">CIN</label>
                    <input name="cin" required value={formData.cin} onChange={handleChange} className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Téléphone</label>
                    <input name="phone" value={formData.phone} onChange={handleChange} className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200" />
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Mot de passe</label>
                  <input name="password" type="password" required minLength="6" value={formData.password} onChange={handleChange} className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Date de Naissance</label>
                  <input name="date_of_birth" type="date" required value={formData.date_of_birth} onChange={handleChange} className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Sexe</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200">
                    <option value="M">Homme</option>
                    <option value="F">Femme</option>
                  </select>
                </div>
                {role === 'student' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Classe</label>
                    <select name="class_id" required value={formData.class_id} onChange={handleChange} className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200">
                      <option value="">Sélectionner...</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {role === 'teacher' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Matière</label>
                    <select name="subject_id" value={formData.subject_id} onChange={handleChange} className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200">
                       <option value="">Sélectionner...</option>
                       {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary to-purple-600 hover:from-primary-dark hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-primary/30 disabled:opacity-70 transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Inscription en cours...
                  </>
                ) : (
                  <>
                    S'inscrire <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
          
          <div className="text-center mt-8 pb-12">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Vous avez déjà un compte ?{' '}
              <Link to="/login" className="font-bold text-primary hover:text-primary-dark transition-colors border-b border-primary/30 hover:border-primary pb-0.5">
                Connectez-vous
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
