import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Building2, Eye, EyeOff, LogIn, Sun, Moon, Languages } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLang } from '../../contexts/LangContext';

export default function CompanyLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      const { data } = await axios.post('/api/auth/company/login', { email, password });
      login(data.user, data.token);
      toast.success(t('welcomeCompany'));
      navigate('/company/dashboard');
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
        <div className="absolute -top-40 -start-40 w-[600px] h-[600px] bg-emerald-600/10 dark:bg-emerald-500/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -end-40 w-[500px] h-[500px] bg-teal-600/10 dark:bg-teal-500/8 rounded-full blur-3xl animate-pulse animation-delay-300" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-2xl animate-float animation-delay-150" />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{backgroundImage: 'linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)', backgroundSize: '60px 60px'}} />
      </div>

      {/* Top bar */}
      <div className="absolute top-4 end-4 flex gap-2">
        <button onClick={toggleTheme} className="btn-ghost btn btn-sm rounded-xl dark:bg-slate-800/60 bg-white/60 backdrop-blur-sm border dark:border-slate-700/50 border-gray-200">
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        </button>
        <button onClick={toggleLang} className="btn-ghost btn btn-sm rounded-xl dark:bg-slate-800/60 bg-white/60 backdrop-blur-sm border dark:border-slate-700/50 border-gray-200">
          <Languages className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold">{lang === 'en' ? 'ع' : 'EN'}</span>
        </button>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl mb-5 shadow-2xl shadow-emerald-500/30 animate-float">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black dark:text-slate-100 text-gray-900 tracking-tight">{t('appName')}</h1>
          <p className="dark:text-slate-400 text-gray-500 text-sm mt-2 font-medium">{t('securitySystem')}</p>
        </div>

        {/* Card */}
        <div className="card-glass dark:bg-slate-800/70 bg-white/80 shadow-2xl shadow-black/10 dark:shadow-black/40">
          <div className="mb-6">
            <h2 className="text-xl font-bold dark:text-slate-100 text-gray-900">{t('companySignIn')}</h2>
            <p className="dark:text-slate-400 text-gray-500 text-sm mt-1">{t('signInCompany')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">{t('emailAddress')}</label>
              <input
                id="company-email"
                type="email"
                className="input"
                placeholder="company@example.com"
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
                  id="company-password"
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
              id="company-login-btn"
              type="submit"
              disabled={loading}
              className="btn-success w-full btn-lg mt-2 rounded-xl shadow-lg shadow-emerald-500/30"
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
          {t('adminPortal')}{' '}
          <Link to="/admin/login" className="text-emerald-500 hover:text-emerald-400 font-semibold transition-colors">
            {t('signInHere')}
          </Link>
        </p>
      </div>
    </div>
  );
}
