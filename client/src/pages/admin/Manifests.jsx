import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Package } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';

export default function AdminManifests() {
  const { t } = useLang();
  const [manifests, setManifests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const fetchManifests = async () => {
    try {
      const { data } = await axios.get('/api/manifests');
      setManifests(data);
    } catch { toast.error(t('error')); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchManifests(); }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await axios.get('/api/manifests/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      const cd = response.headers['content-disposition'];
      const fname = cd ? cd.split('filename=')[1]?.replace(/"/g, '') : 'manifest.xlsx';
      a.download = fname;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Manifest exported successfully!');
      fetchManifests();
    } catch (err) {
      const errText = err.response?.data ? await new Response(err.response.data).text() : '';
      try {
        const parsed = JSON.parse(errText);
        toast.error(parsed.error || 'Export failed');
      } catch { toast.error('Export failed'); }
    } finally { setExporting(false); }
  };

  const handleImport = async () => {
    if (!importFile) return toast.error('Please select an Excel file first');
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('result_file', importFile);
      const { data } = await axios.post('/api/manifests/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImportResult(data);
      toast.success(`Import complete: ${data.summary.updated} records updated`);
      setImportFile(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Import failed');
    } finally { setImporting(false); }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">{t('manifests')}</h1>
        <p className="page-subtitle">Export and import JET approval results</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export */}
        <div className="card space-y-5 group hover:scale-[1.01] transition-transform duration-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/10">
              <Download className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="font-bold dark:text-slate-100 text-gray-900">{t('exportExcel')}</h2>
              <p className="text-sm dark:text-slate-400 text-gray-500">Export SUBMITTED applications to Excel</p>
            </div>
          </div>
          <p className="text-sm dark:text-slate-400 text-gray-500 leading-relaxed">
            This will export all{' '}
            <span className="text-amber-400 font-bold">SUBMITTED</span> and{' '}
            <span className="text-blue-400 font-bold">PROCESSING</span>{' '}
            applications into an Excel file. Applications will be marked as{' '}
            <span className="text-blue-400 font-bold">PROCESSING</span> after export.
          </p>
          <button onClick={handleExport} disabled={exporting} className="btn-primary w-full rounded-xl">
            {exporting
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Download className="w-4 h-4" />}
            {exporting ? 'Exporting...' : t('exportExcel')}
          </button>
        </div>

        {/* Import */}
        <div className="card space-y-5 group hover:scale-[1.01] transition-transform duration-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Upload className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-bold dark:text-slate-100 text-gray-900">Import JET Results</h2>
              <p className="text-sm dark:text-slate-400 text-gray-500">Upload Excel to auto-update statuses</p>
            </div>
          </div>
          <div
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
              importFile
                ? 'dark:border-emerald-500/60 border-emerald-400/60 dark:bg-emerald-500/5 bg-emerald-50'
                : 'dark:border-slate-600 border-gray-200 dark:hover:border-emerald-500/40 hover:border-emerald-400/40 dark:hover:bg-emerald-500/5 hover:bg-emerald-50'
            }`}
            onClick={() => document.getElementById('import-file').click()}
          >
            <FileSpreadsheet className={`w-8 h-8 mx-auto mb-2 ${importFile ? 'text-emerald-400' : 'dark:text-slate-500 text-gray-400'}`} />
            <p className="text-sm font-medium">
              {importFile
                ? <span className="text-emerald-500">{importFile.name}</span>
                : <span className="dark:text-slate-400 text-gray-500">{t('dragDrop')}</span>
              }
            </p>
            <p className="text-xs dark:text-slate-500 text-gray-400 mt-1">{t('excelFormats')}</p>
            <input id="import-file" type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => setImportFile(e.target.files[0])} />
          </div>
          <button onClick={handleImport} disabled={importing || !importFile} className="btn-success w-full rounded-xl">
            {importing
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Upload className="w-4 h-4" />}
            {importing ? 'Processing...' : 'Import Results'}
          </button>
        </div>
      </div>

      {/* Import result */}
      {importResult && (
        <div className="card space-y-4">
          <h3 className="font-bold dark:text-slate-100 text-gray-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Import Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Rows', value: importResult.summary.total, color: 'dark:bg-slate-700/40 bg-gray-100' },
              { label: 'Updated', value: importResult.summary.updated, color: 'bg-emerald-500/10 border border-emerald-500/20', textColor: 'text-emerald-400' },
              { label: 'Not Found', value: importResult.summary.missing, color: 'bg-amber-500/10 border border-amber-500/20', textColor: 'text-amber-400' },
              { label: 'Invalid', value: importResult.summary.invalid_status, color: 'bg-red-500/10 border border-red-500/20', textColor: 'text-red-400' },
            ].map(({ label, value, color, textColor }) => (
              <div key={label} className={`rounded-2xl p-4 text-center ${color}`}>
                <p className={`text-2xl font-black ${textColor || 'dark:text-slate-100 text-gray-900'}`}>{value}</p>
                <p className="text-xs dark:text-slate-400 text-gray-500 mt-1 font-medium">{label}</p>
              </div>
            ))}
          </div>
          {importResult.details.missing?.length > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
              <p className="text-sm text-amber-400 font-medium flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4" /> Passports not found:
              </p>
              <p className="text-xs dark:text-slate-400 text-gray-500 font-mono">{importResult.details.missing.join(', ')}</p>
            </div>
          )}
        </div>
      )}

      {/* Manifest History */}
      <div className="card !p-0 overflow-hidden">
        <div className="px-6 py-5 border-b dark:border-slate-700/50 border-gray-100 flex items-center gap-3">
          <Package className="w-5 h-5 dark:text-slate-400 text-gray-500" />
          <h2 className="font-bold dark:text-slate-100 text-gray-900">{t('manifestList')}</h2>
        </div>
        <div className="table-wrapper rounded-none border-0">
          <table className="table">
            <thead>
              <tr>
                <th>Manifest Number</th>
                <th>{t('applications')}</th>
                <th>{t('date')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="text-center py-8">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : manifests.length === 0 ? (
                <tr><td colSpan={3} className="text-center dark:text-slate-500 text-gray-400 py-10">
                  <Package className="w-7 h-7 mx-auto mb-2 opacity-30" />
                  {t('noData')}
                </td></tr>
              ) : manifests.map(m => (
                <tr key={m.id}>
                  <td><span className="font-mono text-blue-500 text-sm font-bold bg-blue-500/10 px-2 py-0.5 rounded-lg">{m.manifest_number}</span></td>
                  <td>
                    <span className="dark:bg-slate-700/60 bg-gray-100 px-2 py-0.5 rounded-lg text-xs font-bold dark:text-slate-300 text-gray-700">
                      {m._count?.applications || 0}
                    </span>
                  </td>
                  <td className="dark:text-slate-500 text-gray-400 text-xs">{new Date(m.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
