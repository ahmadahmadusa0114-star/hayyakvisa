import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Shield, Eye, EyeOff, LogIn, Sun, Moon, Languages } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLang } from '../../contexts/LangContext';

export default function AdminLogin() {
  const [email, setEmail] = useState('admin@hayyakvisa.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, toggleLang, lang } = useLang();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/admin/login', { email, password });
      login(data.user, data.token);
      toast.success(t('welcomeAdmin'));
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || t('loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen dark:bg-slate-950 bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -start-40 w-[600px] h-[600px] bg-blue-600/10 dark:bg-blue-500/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -end-40 w-[500px] h-[500px] bg-indigo-600/10 dark:bg-indigo-500/8 rounded-full blur-3xl animate-pulse animation-delay-300" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-2xl animate-float" />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)', backgroundSize: '60px 60px'}} />
      </div>

      {/* Top bar */}
      <div className="absolute top-4 end-4 flex gap-2">
        <button onClick={toggleTheme} className="btn-ghost btn btn-sm rounded-xl dark:bg-slate-800/60 bg-white/60 backdrop-blur-sm border dark:border-slate-700/50 border-gray-200">
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        </button>
        <button onClick={toggleLang} className="btn-ghost btn btn-sm rounded-xl dark:bg-slate-800/60 bg-white/60 backdrop-blur-sm border dark:border-slate-700/50 border-gray-200">
          <Languages className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold">{lang === 'en' ? 'ع' : 'EN'}</span>
        </button>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl mb-5 shadow-2xl shadow-blue-500/30 animate-float">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black dark:text-slate-100 text-gray-900 tracking-tight">{t('appName')}</h1>
          <p className="dark:text-slate-400 text-gray-500 text-sm mt-2 font-medium">{t('securitySystem')}</p>
        </div>

        {/* Card */}
        <div className="card-glass dark:bg-slate-800/70 bg-white/80 shadow-2xl shadow-black/10 dark:shadow-black/40">
          <div className="mb-6">
            <h2 className="text-xl font-bold dark:text-slate-100 text-gray-900">{t('adminSignIn')}</h2>
            <p className="dark:text-slate-400 text-gray-500 text-sm mt-1">{t('signInAdmin')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">{t('emailAddress')}</label>
              <input
                id="admin-email"
                type="email"
                className="input"
                placeholder="admin@hayyakvisa.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">{t('password')}</label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input pe-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute end-3 top-1/2 -translate-y-1/2 dark:text-slate-400 text-gray-400 dark:hover:text-slate-200 hover:text-gray-900 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="admin-login-btn"
              type="submit"
              disabled={loading}
              className="btn-primary w-full btn-lg mt-2 rounded-xl shadow-lg shadow-blue-500/30"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn className="w-5 h-5" />
              )}
              {loading ? t('signingIn') : t('signIn')}
            </button>
          </form>
        </div>

        <p className="text-center dark:text-slate-500 text-gray-400 text-sm mt-6">
          {t('travelCompany')}{' '}
          <Link to="/company/login" className="text-blue-500 hover:text-blue-400 font-semibold transition-colors">
            {t('signInHere')}
          </Link>
        </p>
      </div>
    </div>
  );
}
