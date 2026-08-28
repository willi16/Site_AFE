import { useState, useEffect, useCallback } from 'react';
import { FileSpreadsheet, FileText, BarChart3, RefreshCw } from 'lucide-react';
import api from '../../../api/axios';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { showError } from '../../../utils/swal';

export default function EtatGlobal() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('');

  const load = useCallback(async (per = period) => {
    setLoading(true);
    try {
      const params = per ? { period: per } : {};
      const res = await api.get('/cotisations/etat-global/', { params });
      setData(res.data);
    } catch (e) {
      showError('Erreur', 'Impossible de charger l\'état global.');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(''); }, []);

  const exportExcel = () => {
    if (!data) return;
    const header = ['Membre', 'Rôle', 'Total dû', 'Total payé', 'Solde', 'Absences', 'Excusés', 'Pénalités', 'Total global'];
    const lines = data.members.map(m => [m.full_name, m.role, m.total_due, m.total_paid, m.balance, m.absences, m.excuses, m.penalties, m.grand_total]);
    lines.push(['TOTAL', '', data.totals.total_due, data.totals.total_paid, data.totals.balance, '', '', data.totals.penalties, data.totals.grand_total]);
    const csv = '\ufeff' + [header, ...lines].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'etat_global_membres.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    if (!data) return;
    const w = window.open('', '_blank', 'width=900,height=700');
    const head = ['Membre', 'Total dû', 'Total payé', 'Solde', 'Pénalités', 'Total global'].map(c => `<th>${c}</th>`).join('');
    const rows = data.members.map(m => `<tr><td>${m.full_name}</td><td>${m.total_due}</td><td>${m.total_paid}</td><td>${m.balance}</td><td>${m.penalties}</td><td>${m.grand_total}</td></tr>`).join('');
    const totals = `<tr><td><strong>TOTAL</strong></td><td><strong>${data.totals.total_due}</strong></td><td><strong>${data.totals.total_paid}</strong></td><td><strong>${data.totals.balance}</strong></td><td><strong>${data.totals.penalties}</strong></td><td><strong>${data.totals.grand_total}</strong></td></tr>`;
    w.document.write(`<html><head><title>État global</title><style>
      body{font-family:Arial;padding:30px} h1{color:#1d4ed8} h2{color:#555}
      table{width:100%;border-collapse:collapse;margin-top:10px;font-size:12px}
      th,td{border:1px solid #ccc;padding:6px;text-align:left} th{background:#eef}
    </style></head><body>
      <h1>État global des cotisations</h1>
      <h2>Association de Fraternité et d'Entraide — ${period ? `Période : ${period}` : 'Toutes périodes'}</h2>
      <table><thead><tr>${head}</tr></thead><tbody>${rows}${totals}</tbody></table>
      <script>setTimeout(()=>window.print(),300)<\/script>
    </body></html>`);
    w.document.close();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
        <h2 className="text-xl font-bold text-surface-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary-500" /> État global des cotisations
        </h2>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="px-3 py-2 rounded-xl border border-surface-200 text-sm"
          />
          <button onClick={() => load(period)} className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-all">
            <RefreshCw className="w-4 h-4" /> Calculer
          </button>
          <button onClick={exportExcel} className="flex items-center gap-2 bg-emerald-500/10 text-emerald-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-500/20 transition-all">
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 bg-red-500/10 text-red-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-500/20 transition-all">
            <FileText className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {loading ? <LoadingSpinner className="py-10" /> : !data ? (
        <p className="text-surface-500 text-center py-8">Aucune donnée.</p>
      ) : (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {[
              { label: 'Total dû', value: data.totals.total_due, color: 'text-red-600' },
              { label: 'Total payé', value: data.totals.total_paid, color: 'text-emerald-600' },
              { label: 'Solde restant', value: data.totals.balance, color: 'text-amber-600' },
              { label: 'Pénalités (retard/absence)', value: data.totals.penalties, color: 'text-orange-600' },
              { label: 'Total global', value: data.totals.grand_total, color: 'text-primary-600' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl border border-surface-100 p-4">
                <div className="text-xs text-surface-500 mb-1">{s.label}</div>
                <div className={`text-lg font-bold ${s.color}`}>{s.value.toLocaleString('fr-FR')} F</div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-surface-100 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-50 text-surface-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Membre</th>
                  <th className="px-4 py-3 font-semibold">Total dû</th>
                  <th className="px-4 py-3 font-semibold">Payé</th>
                  <th className="px-4 py-3 font-semibold">Solde</th>
                  <th className="px-4 py-3 font-semibold text-center">Absences</th>
                  <th className="px-4 py-3 font-semibold">Pénalités</th>
                  <th className="px-4 py-3 font-semibold">Total global</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {data.members.map(m => (
                  <tr key={m.member_id} className="hover:bg-surface-50">
                    <td className="px-4 py-3 font-medium text-surface-800">{m.full_name}</td>
                    <td className="px-4 py-3 text-surface-600">{m.total_due.toLocaleString('fr-FR')}</td>
                    <td className="px-4 py-3 text-emerald-600">{m.total_paid.toLocaleString('fr-FR')}</td>
                    <td className={`px-4 py-3 ${m.balance > 0 ? 'text-amber-600 font-medium' : 'text-surface-500'}`}>{m.balance.toLocaleString('fr-FR')}</td>
                    <td className="px-4 py-3 text-center text-surface-500">{m.absences}</td>
                    <td className="px-4 py-3 text-orange-600">{m.penalties.toLocaleString('fr-FR')}</td>
                    <td className={`px-4 py-3 font-bold ${m.grand_total > 0 ? 'text-primary-600' : 'text-emerald-600'}`}>{m.grand_total.toLocaleString('fr-FR')}</td>
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
