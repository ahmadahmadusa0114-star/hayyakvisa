import { useState, useEffect } from 'react';
import axios from 'axios';
import { Wallet, TrendingUp, TrendingDown, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import toast from 'react-hot-toast';

export default function CompanyWallet() {
  const { user, refreshUser } = useAuth();
  const { t } = useLang();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const { data } = await axios.get('/api/wallet/transactions');
      setTransactions(data.transactions);
      await refreshUser();
    } catch { toast.error(t('error')); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const totalDeposited = transactions.filter(tr => tr.type === 'DEPOSIT').reduce((s, tr) => s + tr.amount, 0);
  const totalDeducted = transactions.filter(tr => tr.type === 'DEDUCTION').reduce((s, tr) => s + tr.amount, 0);
  const balance = user?.wallet_balance || 0;
  const fee = user?.markup_price || 3;
  const isLow = balance < fee * 2;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">{t('wallet')}</h1>
          <p className="page-subtitle">{t('walletBalance')} & {t('transactionHistory')}</p>
        </div>
        <button onClick={fetchData} disabled={refreshing} className="btn-secondary">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Balance hero card */}
      <div className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-2xl ${
        isLow
          ? 'bg-gradient-to-br from-red-600 to-rose-700 shadow-red-500/30'
          : 'bg-gradient-to-br from-emerald-600 to-teal-700 shadow-emerald-500/30'
      }`}>
        <div className="absolute inset-0 opacity-10"
          style={{backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px'}} />
        <div className="absolute -top-8 -end-8 w-32 h-32 bg-white/5 rounded-full" />
        <div className="relative">
          <p className="text-sm font-bold uppercase tracking-widest opacity-70 mb-2">{t('walletBalance')}</p>
          <p className="text-5xl font-black mb-1">{balance.toFixed(2)}</p>
          <p className="text-base opacity-70 font-medium">JOD</p>
          <p className="text-sm opacity-60 mt-3">{t('feePerApp')}: {fee} JOD {t('perApplication')}</p>
        </div>
      </div>

      {/* Low balance warning */}
      {isLow && (
        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-amber-400 font-bold text-sm">Low Balance</p>
            <p className="text-amber-400/70 text-xs mt-0.5">Contact your administrator to top up your balance.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="stat-card">
          <div className="stat-icon bg-blue-500/15 text-blue-400 shadow-lg shadow-blue-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-blue-400">{totalDeposited.toFixed(2)}<span className="text-sm font-medium ms-1 opacity-70">JOD</span></p>
            <p className="text-sm dark:text-slate-400 text-gray-500 mt-1 font-medium">Total {t('credit')}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-red-500/15 text-red-400 shadow-lg shadow-red-500/20">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-red-400">{totalDeducted.toFixed(2)}<span className="text-sm font-medium ms-1 opacity-70">JOD</span></p>
            <p className="text-sm dark:text-slate-400 text-gray-500 mt-1 font-medium">Total {t('debit')}</p>
            <p className="text-xs dark:text-slate-500 text-gray-400">{transactions.filter(tr => tr.type === 'DEDUCTION').length} {t('applications').toLowerCase()}</p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
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
                  <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={4} className="text-center dark:text-slate-500 text-gray-400 py-10">
                  {t('noData')}
                </td></tr>
              ) : transactions.map(tr => (
                <tr key={tr.id}>
                  <td>
                    <span className={`badge ${tr.type === 'DEPOSIT' ? 'badge-approved' : 'badge-rejected'}`}>
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
    </div>
  );
}
