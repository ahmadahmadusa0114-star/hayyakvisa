import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Trash2, Upload, Scan, CheckCircle, AlertTriangle, Send, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';

const EMPTY_PASSENGER = {
  full_name_ar: '', full_name_en: '', passport_number: '',
  nationality: '', date_of_birth: '', passport_expiry: '',
  phone: '', passport_image: null, personal_photo: null,
  ocr_previewed: false, ocr_loading: false,
};

export default function SubmitApplication() {
  const { user, refreshUser } = useAuth();
  const { t } = useLang();
  const [passengers, setPassengers] = useState([{ ...EMPTY_PASSENGER }]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState([]);

  const update = (index, field, value) => {
    setPassengers(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const addPassenger = () => {
    if (passengers.length >= 100) return toast.error('Maximum 100 passengers per batch');
    setPassengers(prev => [...prev, { ...EMPTY_PASSENGER }]);
  };

  const removePassenger = (index) => {
    if (passengers.length === 1) return toast.error('At least one passenger required');
    setPassengers(prev => prev.filter((_, i) => i !== index));
  };

  const handlePassportOCR = async (index, file) => {
    update(index, 'passport_image', file);
    update(index, 'ocr_loading', true);
    try {
      const formData = new FormData();
      formData.append('passport_image', file);
      const { data } = await axios.post('/api/ocr/passport', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (data.success && data.data) {
        const d = data.data;
        setPassengers(prev => prev.map((p, i) => i === index ? {
          ...p,
          passport_number: d.passport_number || p.passport_number,
          full_name_en: d.full_name_en || p.full_name_en,
          nationality: d.nationality || p.nationality,
          date_of_birth: d.date_of_birth || p.date_of_birth,
          passport_expiry: d.passport_expiry || p.passport_expiry,
          ocr_loading: false, ocr_previewed: true,
        } : p));
        toast.success(t('ocrExtracted'));
      }
    } catch (err) {
      update(index, 'ocr_loading', false);
      toast.error(err.response?.data?.error || 'OCR failed', { duration: 5000 });
    }
  };

  const handleSubmitAll = async () => {
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.full_name_ar || !p.full_name_en || !p.passport_number || !p.nationality || !p.date_of_birth || !p.passport_expiry || !p.phone) {
        toast.error(`Passenger ${i + 1}: All required fields must be filled`, { duration: 5000 });
        return;
      }
    }
    const totalCost = passengers.length * (user?.markup_price || 3);
    if ((user?.wallet_balance || 0) < totalCost) {
      toast.error(`Insufficient balance. Need ${totalCost} JOD, have ${(user?.wallet_balance || 0).toFixed(2)} JOD`);
      return;
    }
    if (!confirm(`Submit ${passengers.length} passenger(s)? Total cost: ${totalCost} JOD`)) return;

    setSubmitting(true);
    const results = [];
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      try {
        const formData = new FormData();
        formData.append('full_name_ar', p.full_name_ar);
        formData.append('full_name_en', p.full_name_en);
        formData.append('passport_number', p.passport_number);
        formData.append('nationality', p.nationality);
        formData.append('date_of_birth', p.date_of_birth);
        formData.append('passport_expiry', p.passport_expiry);
        formData.append('phone', p.phone);
        if (p.passport_image) formData.append('passport_image', p.passport_image);
        if (p.personal_photo) formData.append('personal_photo', p.personal_photo);
        await axios.post('/api/applications', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        results.push({ index: i + 1, name: p.full_name_en, success: true });
      } catch (err) {
        results.push({ index: i + 1, name: p.full_name_en, success: false, error: err.response?.data?.error || 'Failed' });
      }
    }

    setSubmitted(results);
    setSubmitting(false);
    await refreshUser();
    const successCount = results.filter(r => r.success).length;
    if (successCount === passengers.length) {
      toast.success(`All ${successCount} passengers submitted successfully!`);
      setPassengers([{ ...EMPTY_PASSENGER }]);
    } else {
      toast.error(`${passengers.length - successCount} submissions failed.`);
      setPassengers(prev => prev.filter((_, i) => !results[i]?.success));
    }
  };

  const totalCost = passengers.length * (user?.markup_price || 3);
  const hasEnoughBalance = (user?.wallet_balance || 0) >= totalCost;

  return (
    <div className="p-6 lg:p-8 space-y-6 pb-28">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">{t('newApplication')}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-sm dark:text-slate-400 text-gray-500">
              <Users className="w-4 h-4" /> {passengers.length} passenger{passengers.length !== 1 ? 's' : ''}
            </span>
            <span className="text-sm">
              Cost: <span className="text-amber-500 font-bold">{totalCost.toFixed(2)} JOD</span>
            </span>
            <span className="text-sm">
              {t('walletBalance')}: <span className={`font-bold ${hasEnoughBalance ? 'text-emerald-500' : 'text-red-400'}`}>
                {(user?.wallet_balance || 0).toFixed(2)} JOD
              </span>
            </span>
          </div>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <button onClick={addPassenger} className="btn-secondary">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add</span>
          </button>
          <button onClick={handleSubmitAll} disabled={submitting} className="btn-primary">
            {submitting
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Send className="w-4 h-4" />}
            <span className="hidden sm:inline">{submitting ? t('submitting') : t('submit')}</span>
          </button>
        </div>
      </div>

      {/* Submission results */}
      {submitted.length > 0 && (
        <div className="card space-y-2 border-l-4 border-blue-500">
          <h3 className="font-bold dark:text-slate-100 text-gray-900">Submission Results</h3>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {submitted.map(r => (
              <div key={r.index} className={`flex items-center gap-3 p-2.5 rounded-xl text-sm ${
                r.success
                  ? 'dark:bg-emerald-500/10 bg-emerald-50 text-emerald-500 dark:text-emerald-400'
                  : 'dark:bg-red-500/10 bg-red-50 text-red-500 dark:text-red-400'
              }`}>
                {r.success
                  ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
                <span className="font-bold">#{r.index} {r.name}:</span>
                <span>{r.success ? t('applicationSubmitted') : r.error}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Passenger forms */}
      <div className="space-y-6">
        {passengers.map((passenger, index) => (
          <div key={index} className="card space-y-5 border dark:border-slate-700/60 border-gray-200">
            {/* Passenger header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-500 border border-blue-500/20 rounded-xl flex items-center justify-center text-xs font-black">
                  {index + 1}
                </div>
                <h3 className="font-bold dark:text-slate-200 text-gray-800">
                  Passenger {index + 1}
                </h3>
                {passenger.ocr_previewed && (
                  <span className="badge badge-approved text-xs">
                    <CheckCircle className="w-3 h-3" /> OCR Auto-filled
                  </span>
                )}
                {passenger.ocr_loading && (
                  <span className="badge badge-processing text-xs">
                    <span className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                    Scanning...
                  </span>
                )}
              </div>
              <button onClick={() => removePassenger(index)} className="btn btn-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* File uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Passport Image with OCR */}
              <div>
                <label className="label flex items-center gap-2">
                  {t('uploadPassport')}
                  <span className="text-blue-400 text-xs normal-case tracking-normal font-normal">*</span>
                </label>
                <label className="block cursor-pointer">
                  <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all duration-200 ${
                    passenger.passport_image
                      ? 'dark:border-blue-500/50 border-blue-400/50 dark:bg-blue-500/5 bg-blue-50'
                      : 'dark:border-slate-600 border-gray-200 dark:hover:border-blue-500/40 hover:border-blue-400/40 dark:hover:bg-blue-500/5 hover:bg-blue-50'
                  }`}>
                    {passenger.passport_image ? (
                      <div className="flex items-center justify-center gap-2 text-blue-500 text-sm font-medium">
                        <Scan className="w-5 h-5" /> {passenger.passport_image.name}
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-6 h-6 dark:text-slate-500 text-gray-400 mx-auto mb-1.5" />
                        <p className="text-xs dark:text-slate-400 text-gray-500">{t('dragDrop')}</p>
                        <p className="text-xs dark:text-slate-500 text-gray-400 mt-0.5">{t('imageFormats')}</p>
                      </div>
                    )}
                  </div>
                  <input
                    type="file" className="hidden"
                    accept="image/jpeg,image/png,image/jpg,.pdf"
                    onChange={e => e.target.files[0] && handlePassportOCR(index, e.target.files[0])}
                  />
                </label>
              </div>

              {/* Personal photo */}
              <div>
                <label className="label">Personal Photo ({t('optional')})</label>
                <label className="block cursor-pointer">
                  <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all duration-200 ${
                    passenger.personal_photo
                      ? 'dark:border-emerald-500/50 border-emerald-400/50 dark:bg-emerald-500/5 bg-emerald-50'
                      : 'dark:border-slate-600 border-gray-200 dark:hover:border-emerald-500/40 hover:border-emerald-400/40'
                  }`}>
                    {passenger.personal_photo ? (
                      <div className="flex items-center justify-center gap-2 text-emerald-500 text-sm font-medium">
                        <CheckCircle className="w-5 h-5" /> {passenger.personal_photo.name}
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-6 h-6 dark:text-slate-500 text-gray-400 mx-auto mb-1.5" />
                        <p className="text-xs dark:text-slate-400 text-gray-500">Upload personal photo</p>
                        <p className="text-xs dark:text-slate-500 text-gray-400 mt-0.5">{t('imageFormats')}</p>
                      </div>
                    )}
                  </div>
                  <input
                    type="file" className="hidden"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={e => update(index, 'personal_photo', e.target.files[0])}
                  />
                </label>
              </div>
            </div>

            {/* Form fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="label">{t('fullNameAr')} *</label>
                <input className="input" placeholder="الاسم الكامل" dir="rtl"
                  value={passenger.full_name_ar} onChange={e => update(index, 'full_name_ar', e.target.value)} />
              </div>
              <div>
                <label className="label">{t('fullNameEn')} *</label>
                <input className="input" placeholder="Full Name in English"
                  value={passenger.full_name_en} onChange={e => update(index, 'full_name_en', e.target.value)} />
              </div>
              <div>
                <label className="label">{t('passportNumber')} *</label>
                <input className="input font-mono tracking-wider" placeholder="A12345678"
                  value={passenger.passport_number} onChange={e => update(index, 'passport_number', e.target.value.toUpperCase())} />
              </div>
              <div>
                <label className="label">{t('nationality')} *</label>
                <input className="input uppercase" placeholder="SYR"
                  value={passenger.nationality} onChange={e => update(index, 'nationality', e.target.value.toUpperCase())} />
              </div>
              <div>
                <label className="label">Date of Birth *</label>
                <input className="input" type="date"
                  value={passenger.date_of_birth} onChange={e => update(index, 'date_of_birth', e.target.value)} />
              </div>
              <div>
                <label className="label">Passport Expiry *</label>
                <input className="input" type="date"
                  value={passenger.passport_expiry} onChange={e => update(index, 'passport_expiry', e.target.value)} />
              </div>
              <div>
                <label className="label">{t('phone')} *</label>
                <input className="input" placeholder="+962xxxxxxxxx"
                  value={passenger.phone} onChange={e => update(index, 'phone', e.target.value)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-4 inset-x-4 lg:inset-x-auto lg:start-72 lg:end-4 z-20">
        <div className="card !py-3 border dark:border-slate-600/60 border-gray-200 shadow-2xl dark:shadow-black/50 flex items-center justify-between gap-4">
          <div className="text-sm dark:text-slate-400 text-gray-600">
            <span className="font-bold dark:text-slate-200 text-gray-800">{passengers.length}</span> passenger{passengers.length !== 1 ? 's' : ''} ·{' '}
            Total: <span className={`font-bold ${hasEnoughBalance ? 'text-emerald-500' : 'text-red-400'}`}>
              {totalCost.toFixed(2)} JOD
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={addPassenger} className="btn-secondary btn-sm rounded-xl">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
            <button onClick={handleSubmitAll} disabled={submitting} className="btn-primary btn-sm rounded-xl">
              {submitting
                ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Send className="w-3.5 h-3.5" />}
              {submitting ? 'Submitting...' : t('submit')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
