import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, CheckCircle, XCircle, Clock, Wallet, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import { useNavigate } from 'react-router-dom';

const statusMap = {
  SUBMITTED: 'badge-submitted',
  PROCESSING: 'badge-processing',
  APPROVED: 'badge-approved',
  REJECTED: 'badge-rejected',
};

export default function CompanyDashboard() {
  const { user, refreshUser } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, recentRes] = await Promise.all([
          axios.get('/api/applications/stats'),
          axios.get('/api/applications?limit=5'),
        ]);
        setStats(statsRes.data);
        setRecent(recentRes.data.applications);
        refreshUser();
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const statCards = [
    { icon: Wallet, label: t('walletBalance'), value: `${(user?.wallet_balance ?? 0).toFixed(2)} JOD`, color: 'bg-emerald-500/15 text-emerald-400', shadow: 'shadow-emerald-500/20' },
    { icon: FileText, label: t('totalApplications'), value: stats?.total ?? '—', color: 'bg-slate-500/15 text-slate-400', shadow: '' },
    { icon: CheckCircle, label: t('approved'), value: stats?.approved ?? '—', color: 'bg-emerald-500/15 text-emerald-400', shadow: 'shadow-emerald-500/20' },
    { icon: XCircle, label: t('rejected'), value: stats?.rejected ?? '—', color: 'bg-red-500/15 text-red-400', shadow: 'shadow-red-500/20' },
    { icon: Clock, label: t('submitted'), value: (stats?.submitted || 0) + (stats?.processing || 0), color: 'bg-amber-500/15 text-amber-400', shadow: 'shadow-amber-500/20' },
    { icon: TrendingUp, label: t('feePerApp'), value: `${user?.markup_price || 3} JOD`, color: 'bg-blue-500/15 text-blue-400', shadow: 'shadow-blue-500/20' },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Welcome hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white shadow-2xl shadow-emerald-500/30">
        <div className="absolute inset-0 opacity-10"
          style={{backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px'}} />
        <div className="absolute -top-10 -end-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute -bottom-5 -start-5 w-24 h-24 bg-white/5 rounded-full" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span className="text-emerald-200 text-sm font-medium">{t('companyPortal')}</span>
            </div>
            <h1 className="text-2xl font-black">Welcome, {user?.name}!</h1>
            <p className="text-emerald-200 text-sm mt-1">{t('securitySystem')}</p>
          </div>
          <button
            onClick={() => navigate('/company/submit')}
            className="hidden md:flex items-center gap-2 bg-white text-emerald-700 font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-emerald-50 transition-colors shadow-lg"
          >
            {t('submitApplication')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {statCards.map(({ icon: Icon, label, value, color, shadow }) => (
          <div key={label} className="stat-card group">
            <div className={`stat-icon ${color} ${shadow ? 'shadow-lg ' + shadow : ''}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black dark:text-slate-100 text-gray-900 leading-none">{value}</p>
              <p className="text-sm dark:text-slate-400 text-gray-500 mt-1 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Applications */}
      <div className="card !p-0 overflow-hidden">
        <div className="px-6 py-5 border-b dark:border-slate-700/50 border-gray-100 flex items-center justify-between">
          <h2 className="font-bold dark:text-slate-100 text-gray-900">{t('recentApplications')}</h2>
          <button
            onClick={() => navigate('/company/applications')}
            className="text-xs text-emerald-500 hover:text-emerald-400 font-bold transition-colors flex items-center gap-1"
          >
            {t('myApplications')} <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="table-wrapper rounded-none border-0">
          <table className="table">
            <thead>
              <tr>
                <th>{t('passportNo')}</th>
                <th>{t('nameEn')}</th>
                <th>{t('status')}</th>
                <th>{t('date')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8">
                  <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : recent.length === 0 ? (
                <tr><td colSpan={4} className="text-center dark:text-slate-500 text-gray-400 py-10">
                  <FileText className="w-7 h-7 mx-auto mb-2 opacity-30" />
                  {t('noApplications')}
                </td></tr>
              ) : recent.map(app => (
                <tr key={app.id}>
                  <td><span className="font-mono text-blue-500 text-xs font-bold bg-blue-500/10 px-2 py-0.5 rounded-lg">{app.passport_number}</span></td>
                  <td className="font-medium">{app.full_name_en}</td>
                  <td><span className={`badge ${statusMap[app.status] || 'badge-submitted'}`}>{t(app.status)}</span></td>
                  <td className="dark:text-slate-500 text-gray-400 text-xs">{new Date(app.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
