import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { GraduationCap, User, Lock, ArrowRight, Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.error || 'Échec de la connexion. Vérifiez vos identifiants.');
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
            Gérez votre parcours <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200">
              Scolaire & Universitaire
            </span>
          </h1>
          <p className="text-lg text-white/80 max-w-md font-medium leading-relaxed">
            EduFlow CRM est la plateforme nouvelle génération pour étudiants, enseignants et administrateurs.
          </p>

          <div className="mt-12 flex items-center gap-4 text-sm font-medium text-white/60">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 border-2 border-primary/20 flex items-center justify-center font-bold">A</div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-primary/20 flex items-center justify-center font-bold">M</div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-primary/20 flex items-center justify-center font-bold">S</div>
            </div>
            <p>Rejoignez plus de 10,000+ utilisateurs actifs</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex flex-col justify-center w-full lg:w-1/2 px-6 sm:px-12 xl:px-24">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="p-3 bg-gradient-to-br from-primary to-purple-700 rounded-xl shadow-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">EduFlow</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Bienvenue 👋</h2>
            <p className="text-slate-500 dark:text-slate-400">Connectez-vous pour accéder à votre espace personnel.</p>
          </div>

          <div className="bg-white dark:bg-[#1E1B4B]/40 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 backdrop-blur-xl">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-4 rounded-xl text-sm font-medium flex items-center gap-2 border border-rose-100 dark:border-rose-900/30">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Adresse Email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                      placeholder="admin@eduflow.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Mot de passe
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center">
                  <input id="remember" type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary dark:border-slate-600 dark:bg-slate-800" />
                  <label htmlFor="remember" className="ml-2 block text-sm text-slate-500 dark:text-slate-400">
                    Se souvenir de moi
                  </label>
                </div>
                <a href="#" className="text-sm font-bold text-primary hover:text-primary-dark transition-colors">
                  Mot de passe oublié ?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary to-purple-600 hover:from-primary-dark hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-primary/30 disabled:opacity-70 transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Connexion en cours...
                  </>
                ) : (
                  <>
                    Se connecter <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Vous n'avez pas de compte ?{' '}
              <Link to="/register" className="font-bold text-primary hover:text-primary-dark transition-colors border-b border-primary/30 hover:border-primary pb-0.5">
                Créer un compte
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
