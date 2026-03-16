import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Wallet, X, Check, Building2 } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';

const EMPTY_FORM = { name: '', email: '', password: '', markup_price: 3, status: 'ACTIVE' };
const EMPTY_WALLET = { type: 'DEPOSIT', amount: '', description: '' };

export default function AdminCompanies() {
  const { t } = useLang();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [walletForm, setWalletForm] = useState(EMPTY_WALLET);
  const [saving, setSaving] = useState(false);

  const fetchCompanies = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/companies');
      setCompanies(data);
    } catch { toast.error(t('error')); }
    finally { setLoading(false); }
  }, [t]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const openCreate = () => { setForm(EMPTY_FORM); setModal('create'); };
  const openEdit = (c) => { setSelected(c); setForm({ name: c.name, email: c.email, password: '', markup_price: c.markup_price, status: c.status }); setModal('edit'); };
  const openWallet = (c) => { setSelected(c); setWalletForm(EMPTY_WALLET); setModal('wallet'); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === 'create') {
        await axios.post('/api/companies', form);
        toast.success(t('companyAdded'));
      } else {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await axios.put(`/api/companies/${selected.id}`, payload);
        toast.success(t('companyUpdated'));
      }
      setModal(null);
      fetchCompanies();
    } catch (err) { toast.error(err.response?.data?.error || t('error')); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      await axios.delete(`/api/companies/${id}`);
      toast.success('Deleted');
      fetchCompanies();
    } catch (err) { toast.error(err.response?.data?.error || t('error')); }
  };

  const handleWallet = async () => {
    setSaving(true);
    try {
      await axios.post(`/api/companies/${selected.id}/wallet`, walletForm);
      toast.success(t('topUpSuccess'));
      setModal(null);
      fetchCompanies();
    } catch (err) { toast.error(err.response?.data?.error || t('error')); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">{t('companies')}</h1>
          <p className="page-subtitle">{companies.length} registered companies</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" />
          {t('addCompany')}
        </button>
      </div>

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        <div className="table-wrapper rounded-2xl border-0">
          <table className="table">
            <thead>
              <tr>
                <th>{t('companyName')}</th>
                <th>{t('contactEmail')}</th>
                <th>{t('fee')}</th>
                <th>{t('walletBalance')}</th>
                <th>{t('applications')}</th>
                <th>{t('status')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : companies.length === 0 ? (
                <tr><td colSpan={7} className="text-center dark:text-slate-500 text-gray-400 py-12">
                  <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  {t('noData')}
                </td></tr>
              ) : companies.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 dark:from-blue-500/20 dark:to-indigo-500/20 rounded-xl flex items-center justify-center text-blue-500 text-sm font-black border border-blue-500/20 flex-shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold dark:text-slate-200 text-gray-800">{c.name}</span>
                    </div>
                  </td>
                  <td className="dark:text-slate-400 text-gray-500">{c.email}</td>
                  <td>
                    <span className="text-emerald-500 font-bold text-sm">{c.markup_price}</span>
                    <span className="text-xs dark:text-slate-500 text-gray-400 ms-1">JOD</span>
                  </td>
                  <td>
                    <span className={`font-bold text-sm ${c.wallet_balance < c.markup_price ? 'text-red-400' : 'text-emerald-400'}`}>
                      {c.wallet_balance.toFixed(2)}
                    </span>
                    <span className="text-xs dark:text-slate-500 text-gray-400 ms-1">JOD</span>
                  </td>
                  <td>
                    <span className="dark:bg-slate-700/60 bg-gray-100 px-2 py-0.5 rounded-lg text-xs font-bold dark:text-slate-300 text-gray-700">
                      {c._count?.applications || 0}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${c.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}`}>
                      {t(c.status)}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openWallet(c)} className="btn btn-sm bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-xl" title="Wallet">
                        <Wallet className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => openEdit(c)} className="btn btn-sm dark:bg-slate-700/60 bg-gray-100 dark:text-slate-300 text-gray-600 dark:hover:bg-slate-600 hover:bg-gray-200 rounded-xl" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="btn btn-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h2 className="text-lg font-bold dark:text-slate-100 text-gray-900">
                  {modal === 'create' ? t('addCompany') : t('editCompany')}
                </h2>
              </div>
              <button onClick={() => setModal(null)} className="btn-ghost btn btn-sm rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">{t('companyName')}</label>
                <input className="input" placeholder="Travel Agency Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">{t('contactEmail')}</label>
                <input className="input" type="email" placeholder="company@travel.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="label">{modal === 'edit' ? 'New Password (leave blank to keep)' : t('password')}</label>
                <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('markupPrice')}</label>
                  <input className="input" type="number" step="0.5" min="0" value={form.markup_price} onChange={e => setForm({ ...form, markup_price: e.target.value })} />
                </div>
                <div>
                  <label className="label">{t('status')}</label>
                  <select className="select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="ACTIVE">{t('ACTIVE')}</option>
                    <option value="INACTIVE">{t('INACTIVE')}</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t dark:border-slate-700/50 border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setModal(null)} className="btn-secondary">{t('cancel')}</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                {modal === 'create' ? t('addCompany') : t('saveChanges')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Modal */}
      {modal === 'wallet' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h2 className="text-lg font-bold dark:text-slate-100 text-gray-900">{t('wallet')}</h2>
                <p className="text-sm dark:text-slate-400 text-gray-500 mt-0.5">
                  {selected?.name} —{' '}
                  <span className="text-emerald-500 font-bold">{selected?.wallet_balance?.toFixed(2)} JOD</span>
                </p>
              </div>
              <button onClick={() => setModal(null)} className="btn-ghost btn btn-sm rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Operation</label>
                <select className="select" value={walletForm.type} onChange={e => setWalletForm({ ...walletForm, type: e.target.value })}>
                  <option value="DEPOSIT">{t('credit')}</option>
                  <option value="DEDUCTION">{t('debit')}</option>
                </select>
              </div>
              <div>
                <label className="label">{t('topUpAmount')}</label>
                <input className="input" type="number" step="0.5" min="0.5" placeholder="0.00" value={walletForm.amount} onChange={e => setWalletForm({ ...walletForm, amount: e.target.value })} />
              </div>
              <div>
                <label className="label">{t('notes')} ({t('optional')})</label>
                <input className="input" placeholder="Reason for transaction" value={walletForm.description} onChange={e => setWalletForm({ ...walletForm, description: e.target.value })} />
              </div>
            </div>
            <div className="p-6 border-t dark:border-slate-700/50 border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setModal(null)} className="btn-secondary">{t('cancel')}</button>
              <button
                onClick={handleWallet}
                disabled={saving || !walletForm.amount}
                className={walletForm.type === 'DEPOSIT' ? 'btn-success' : 'btn-danger'}
              >
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                {walletForm.type === 'DEPOSIT' ? t('topUp') : t('debit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
