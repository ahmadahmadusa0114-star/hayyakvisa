import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Search, RefreshCw, Image, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';

const STATUS_OPTIONS = ['SUBMITTED', 'PROCESSING', 'APPROVED', 'REJECTED'];
const statusMap = {
  SUBMITTED: 'badge-submitted',
  PROCESSING: 'badge-processing',
  APPROVED: 'badge-approved',
  REJECTED: 'badge-rejected',
};

export default function CompanyApplications() {
  const { t } = useLang();
  const [applications, setApplications] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await axios.get('/api/applications', { params });
      setApplications(data.applications);
      setTotal(data.total);
    } catch { toast.error(t('error')); }
    finally { setLoading(false); }
  }, [page, search, statusFilter, t]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">{t('myApplications')}</h1>
        <p className="page-subtitle">{total} {t('totalApplications').toLowerCase()}</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {['', ...STATUS_OPTIONS].map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              statusFilter === s
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                : 'dark:bg-slate-800 bg-gray-100 dark:text-slate-400 text-gray-600 dark:hover:bg-slate-700 hover:bg-gray-200'
            }`}
          >
            {s ? t(s) : t('allStatus')}
          </button>
        ))}
      </div>

      {/* Search + refresh */}
      <div className="card !py-4 flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-slate-400 text-gray-400" />
          <input
            className="input ps-9"
            placeholder={t('search')}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <button onClick={fetchApplications} className="btn-secondary">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        <div className="table-wrapper rounded-2xl border-0">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t('passportNo')}</th>
                <th>{t('nameAr')}</th>
                <th>{t('nameEn')}</th>
                <th>{t('nationality')}</th>
                <th>{t('status')}</th>
                <th>{t('viewPassport')}</th>
                <th>{t('date')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : applications.length === 0 ? (
                <tr><td colSpan={8} className="text-center dark:text-slate-500 text-gray-400 py-12">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  {t('noApplications')}
                </td></tr>
              ) : applications.map((app, idx) => (
                <tr key={app.id}>
                  <td className="dark:text-slate-500 text-gray-400 text-xs font-mono">{(page - 1) * 20 + idx + 1}</td>
                  <td><span className="font-mono text-blue-500 text-xs font-bold bg-blue-500/10 px-2 py-0.5 rounded-lg">{app.passport_number}</span></td>
                  <td className="font-medium" dir="rtl">{app.full_name_ar}</td>
                  <td className="font-medium">{app.full_name_en}</td>
                  <td className="dark:text-slate-400 text-gray-500 text-sm">{app.nationality}</td>
                  <td><span className={`badge ${statusMap[app.status] || 'badge-submitted'}`}>{t(app.status)}</span></td>
                  <td>
                    {app.passport_image && (
                      <a href={app.passport_image} target="_blank" rel="noreferrer"
                        className="btn-ghost btn btn-sm text-blue-400 rounded-xl">
                        <Image className="w-4 h-4" />
                      </a>
                    )}
                  </td>
                  <td className="dark:text-slate-500 text-gray-400 text-xs">{new Date(app.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t dark:border-slate-700/50 border-gray-100">
            <span className="text-sm dark:text-slate-400 text-gray-500">Page {page} of {totalPages} ({total})</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-secondary btn-sm">
                <ChevronLeft className="w-4 h-4 ltr-icon" />
              </button>
              <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="btn-secondary btn-sm">
                <ChevronRight className="w-4 h-4 ltr-icon" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
