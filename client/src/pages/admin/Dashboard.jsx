import { useState, useEffect } from 'react';
import axios from 'axios';
import { Building2, FileText, CheckCircle, XCircle, Clock, TrendingUp, ArrowUpRight } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';

const StatCard = ({ icon: Icon, label, value, color, gradient, sub }) => (
  <div className="stat-card group">
    <div className={`stat-icon ${color} ${gradient}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-2xl font-black dark:text-slate-100 text-gray-900 leading-none">{value ?? '—'}</p>
      <p className="text-sm dark:text-slate-400 text-gray-500 mt-1 font-medium">{label}</p>
      {sub && <p className="text-xs dark:text-slate-500 text-gray-400 mt-0.5">{sub}</p>}
    </div>
    <ArrowUpRight className="w-4 h-4 dark:text-slate-600 text-gray-300 group-hover:text-blue-400 transition-colors" />
  </div>
);

const statusMap = {
  SUBMITTED: 'badge-submitted',
  PROCESSING: 'badge-processing',
  APPROVED: 'badge-approved',
  REJECTED: 'badge-rejected',
};

export default function AdminDashboard() {
  const { t } = useLang();
  const [stats, setStats] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, companiesRes, appsRes] = await Promise.all([
          axios.get('/api/applications/stats'),
          axios.get('/api/companies'),
          axios.get('/api/applications?limit=8'),
        ]);
        setStats(statsRes.data);
        setCompanies(companiesRes.data);
        setRecent(appsRes.data.applications);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="page-loading">
      <div className="spinner" />
    </div>
  );

  const statCards = [
    { icon: Building2, label: t('totalCompanies'), value: companies.length, color: 'bg-blue-500/15 text-blue-400', gradient: 'shadow-blue-500/20' },
    { icon: FileText, label: t('totalApplications'), value: stats?.total, color: 'bg-slate-500/15 text-slate-400', gradient: '' },
    { icon: CheckCircle, label: t('approved'), value: stats?.approved, color: 'bg-emerald-500/15 text-emerald-400', gradient: 'shadow-emerald-500/20' },
    { icon: XCircle, label: t('rejected'), value: stats?.rejected, color: 'bg-red-500/15 text-red-400', gradient: 'shadow-red-500/20' },
    { icon: Clock, label: t('submitted'), value: stats?.submitted, color: 'bg-amber-500/15 text-amber-400', gradient: 'shadow-amber-500/20' },
    { icon: TrendingUp, label: t('processing'), value: stats?.processing, color: 'bg-purple-500/15 text-purple-400', gradient: 'shadow-purple-500/20' },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">{t('dashboard')}</h1>
        <p className="page-subtitle">{t('securitySystem')} — {t('overview')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Recent Applications */}
      <div className="card !p-0 overflow-hidden">
        <div className="px-6 py-5 border-b dark:border-slate-700/50 border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold dark:text-slate-100 text-gray-900">{t('recentApplications')}</h2>
            <p className="text-xs dark:text-slate-500 text-gray-400 mt-0.5">Last 8 applications</p>
          </div>
          <span className="badge dark:bg-blue-500/10 bg-blue-100 dark:text-blue-400 text-blue-600 border-0">
            {recent.length} entries
          </span>
        </div>
        <div className="table-wrapper rounded-none border-0">
          <table className="table">
            <thead>
              <tr>
                <th>{t('passportNo')}</th>
                <th>{t('nameEn')}</th>
                <th>{t('company')}</th>
                <th>{t('status')}</th>
                <th>{t('date')}</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan={5} className="text-center dark:text-slate-500 text-gray-400 py-12">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  {t('noApplications')}
                </td></tr>
              ) : recent.map(app => (
                <tr key={app.id}>
                  <td><span className="font-mono text-blue-500 text-xs font-bold bg-blue-500/10 px-2 py-0.5 rounded-lg">{app.passport_number}</span></td>
                  <td className="font-medium">{app.full_name_en}</td>
                  <td><span className="dark:text-slate-400 text-gray-500 text-xs">{app.company?.name}</span></td>
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
