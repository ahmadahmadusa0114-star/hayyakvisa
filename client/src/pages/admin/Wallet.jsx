import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, Building2 } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';

export default function AdminWallet() {
  const { t } = useLang();
  const [companies, setCompanies] = useState([]);
  const [selected, setSelected] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get('/api/companies').then(({ data }) => setCompanies(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    axios.get('/api/wallet/transactions', { params: { company_id: selected } })
      .then(({ data }) => setTransactions(data.transactions))
      .catch(() => toast.error(t('error')))
      .finally(() => setLoading(false));
  }, [selected, t]);

  const company = companies.find(c => c.id === selected);
  const totalDeposited = transactions.filter(tr => tr.type === 'DEPOSIT').reduce((s, tr) => s + tr.amount, 0);
  const totalDeducted = transactions.filter(tr => tr.type === 'DEDUCTION').reduce((s, tr) => s + tr.amount, 0);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">{t('wallet')}</h1>
        <p className="page-subtitle">View balances and transaction history</p>
      </div>

      {/* Company selector */}
      <div className="card !py-4 flex items-center gap-4">
        <Building2 className="w-5 h-5 dark:text-slate-400 text-gray-400 flex-shrink-0" />
        <select
          className="select flex-1 max-w-xs"
          value={selected}
          onChange={e => setSelected(e.target.value)}
        >
          <option value="">{t('select')} company...</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {company && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat-card border-l-4 border-emerald-500">
            <div className="stat-icon bg-emerald-500/15 text-emerald-400 shadow-emerald-500/20">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-400">{company.wallet_balance.toFixed(2)}<span className="text-sm font-medium ms-1 opacity-70">JOD</span></p>
              <p className="text-sm dark:text-slate-400 text-gray-500 font-medium">{t('walletBalance')}</p>
            </div>
            <ArrowUpRight className="w-4 h-4 dark:text-slate-600 text-gray-300" />
          </div>
          <div className="stat-card border-l-4 border-blue-500">
            <div className="stat-icon bg-blue-500/15 text-blue-400 shadow-blue-500/20">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-blue-400">{totalDeposited.toFixed(2)}<span className="text-sm font-medium ms-1 opacity-70">JOD</span></p>
              <p className="text-sm dark:text-slate-400 text-gray-500 font-medium">Total {t('credit')}</p>
            </div>
            <ArrowUpRight className="w-4 h-4 dark:text-slate-600 text-gray-300" />
          </div>
          <div className="stat-card border-l-4 border-red-500">
            <div className="stat-icon bg-red-500/15 text-red-400 shadow-red-500/20">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-red-400">{totalDeducted.toFixed(2)}<span className="text-sm font-medium ms-1 opacity-70">JOD</span></p>
              <p className="text-sm dark:text-slate-400 text-gray-500 font-medium">Total {t('debit')}</p>
            </div>
            <ArrowUpRight className="w-4 h-4 dark:text-slate-600 text-gray-300" />
          </div>
        </div>
      )}

      {selected && (
        <div className="card !p-0 overflow-hidden">
          <div className="px-6 py-5 border-b dark:border-slate-700/50 border-gray-100 flex items-center gap-3">
            <Wallet className="w-5 h-5 dark:text-slate-400 text-gray-400" />
            <h2 className="font-bold dark:text-slate-100 text-gray-900">{t('transactionHistory')}</h2>
          </div>
          <div className="table-wrapper rounded-none border-0">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('type')}</th>
                  <th>{t('amount')}</th>
                  <th>{t('notes')}</th>
                  <th>{t('date')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="text-center py-8">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td></tr>
                ) : transactions.length === 0 ? (
                  <tr><td colSpan={4} className="text-center dark:text-slate-500 text-gray-400 py-10">
                    {t('noData')}
                  </td></tr>
                ) : transactions.map(tr => (
                  <tr key={tr.id}>
                    <td>
                      <span className={`badge ${tr.type === 'DEPOSIT' ? 'badge-approved' : tr.type === 'DEDUCTION' ? 'badge-rejected' : 'badge-processing'}`}>
                        {tr.type === 'DEPOSIT' ? t('credit') : t('debit')}
                      </span>
                    </td>
                    <td className={`font-bold ${tr.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tr.type === 'DEPOSIT' ? '+' : '-'}{tr.amount.toFixed(2)} JOD
                    </td>
                    <td className="dark:text-slate-400 text-gray-500 text-sm">{tr.description || '—'}</td>
                    <td className="dark:text-slate-500 text-gray-400 text-xs">{new Date(tr.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
