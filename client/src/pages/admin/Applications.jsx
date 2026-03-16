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

export default function AdminApplications() {
  const { t } = useLang();
  const [applications, setApplications] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [companies, setCompanies] = useState([]);
  const [filters, setFilters] = useState({ status: '', company_id: '', search: '' });
  const [loading, setLoading] = useState(true);

  const fetchCompanies = useCallback(async () => {
    try { const { data } = await axios.get('/api/companies'); setCompanies(data); } catch {}
  }, []);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, ...filters };
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
      const { data } = await axios.get('/api/applications', { params });
      setApplications(data.applications);
      setTotal(data.total);
    } catch { toast.error(t('error')); }
    finally { setLoading(false); }
  }, [page, filters, t]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);
  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const handleStatusChange = async (appId, status) => {
    try {
      await axios.put(`/api/applications/${appId}/status`, { status });
      toast.success(t('updateStatus'));
      fetchApplications();
    } catch (err) { toast.error(err.response?.data?.error || t('error')); }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">{t('applications')}</h1>
        <p className="page-subtitle">{total} {total === 1 ? 'result' : 'results'}</p>
      </div>

      {/* Filters */}
      <div className="card !py-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-slate-400 text-gray-400" />
          <input
            className="input ps-9"
            placeholder={t('search')}
            value={filters.search}
            onChange={e => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
          />
        </div>
        <select
          className="select w-44"
          value={filters.status}
          onChange={e => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
        >
          <option value="">{t('allStatus')}</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{t(s)}</option>)}
        </select>
        <select
          className="select w-52"
          value={filters.company_id}
          onChange={e => { setFilters({ ...filters, company_id: e.target.value }); setPage(1); }}
        >
          <option value="">{t('companies')}</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
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
                <th>{t('passportNo')}</th>
                <th>{t('nameAr')}</th>
                <th>{t('nameEn')}</th>
                <th>{t('nationality')}</th>
                <th>{t('company')}</th>
                <th>{t('status')}</th>
                <th>{t('viewPassport')}</th>
                <th>{t('date')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="py-12 text-center">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : applications.length === 0 ? (
                <tr><td colSpan={9} className="text-center dark:text-slate-500 text-gray-400 py-12">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  {t('noApplications')}
                </td></tr>
              ) : applications.map(app => (
                <tr key={app.id}>
                  <td>
                    <span className="font-mono text-blue-500 text-xs font-bold bg-blue-500/10 px-2 py-0.5 rounded-lg">
                      {app.passport_number}
                    </span>
                  </td>
                  <td className="font-medium" dir="rtl">{app.full_name_ar}</td>
                  <td className="font-medium">{app.full_name_en}</td>
                  <td className="dark:text-slate-400 text-gray-500 text-xs">{app.nationality}</td>
                  <td className="dark:text-slate-400 text-gray-500 text-xs">{app.company?.name}</td>
                  <td>
                    <span className={`badge ${statusMap[app.status] || 'badge-submitted'}`}>
                      {t(app.status)}
                    </span>
                  </td>
                  <td>
                    {app.passport_image && (
                      <a
                        href={app.passport_image}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-ghost btn btn-sm text-blue-400 hover:text-blue-300 rounded-lg"
                      >
                        <Image className="w-4 h-4" />
                      </a>
                    )}
                  </td>
                  <td className="dark:text-slate-500 text-gray-400 text-xs">
                    {new Date(app.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <select
                      className="dark:bg-slate-700/80 bg-gray-100 border dark:border-slate-600 border-gray-200 rounded-xl px-3 py-1.5 text-xs dark:text-slate-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      value={app.status}
                      onChange={e => handleStatusChange(app.id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{t(s)}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t dark:border-slate-700/50 border-gray-100">
            <span className="text-sm dark:text-slate-400 text-gray-500">
              Page {page} of {totalPages} ({total} results)
            </span>
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
