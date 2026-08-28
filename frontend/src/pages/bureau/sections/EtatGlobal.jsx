import { useState, useEffect, useCallback } from 'react';
import { FileSpreadsheet, FileText, BarChart3, UserCheck, UserX, CalendarRange, HandCoins } from 'lucide-react';
import api from '../../../api/axios';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import Pagination from '../../../components/ui/Pagination';
import { showError } from '../../../utils/swal';

const fmt = (n) => (n ?? 0).toLocaleString('fr-FR');

const statusBadge = (s) => {
  const map = {
    'À jour': 'bg-emerald-500/10 text-emerald-700',
    'En retard (partiel)': 'bg-amber-500/10 text-amber-700',
    'Non payé': 'bg-red-500/10 text-red-700',
  };
  return map[s] || 'bg-surface-100 text-surface-600';
};

export default function EtatGlobal() {
  const today = new Date();
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(sixMonthsAgo.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(today.toISOString().slice(0, 10));
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const res = await api.get('/cotisations/etat-global/', { params });
      setData(res.data);
    } catch {
      showError('Erreur', 'Impossible de charger l\'état global.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, page]);

  useEffect(() => { load(); }, [load]);

  const resetPage = () => setPage(1);

  const exportExcel = () => {
    if (!data) return;
    const header = ['Membre', 'Rôle', 'Présences', 'Absences', 'Excusés', 'Dû', 'Payé', 'Solde', 'Pénalités', 'Statut'];
    const lines = data.members.map(m => [m.full_name, m.role, m.present, m.absences, m.excuses, m.total_due, m.total_paid, m.balance, m.penalties, m.status]);
    lines.push(['TOTAL', '', data.totals.total_present, data.totals.total_absent, data.totals.total_excuse, data.totals.total_due, data.totals.total_paid, data.totals.balance, data.totals.penalties, '']);
    data.assistances.forEach(a => lines.push([`Assistance ${a.label} (${a.count})`, '', '', '', '', '', '', '', '', a.total]));
    lines.push(['MONTANT TOTAL DÉBOURSÉ (assistances)', '', '', '', '', '', '', '', '', data.totals.total_disbursed]);
    const csv = '\ufeff' + [header, ...lines].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'etat_global.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    if (!data) return;
    const w = window.open('', '_blank', 'width=900,height=700');
    const th = (cells) => `<tr>${cells.map(c => `<th>${c}</th>`).join('')}</tr>`;
    const tr = (cells, cls = '') => `<tr class="${cls}">${cells.map(c => `<td>${c}</td>`).join('')}</tr>`;
    const memberRows = data.members.map(m => tr([m.full_name, m.present, m.absences, m.excuses, m.total_due, m.total_paid, m.balance, m.status]));
    const assRows = data.assistances.map(a => tr([`${a.label} (x${a.count})`, a.amount, a.total], 'ass'));
    w.document.write(`<html><head><title>État global</title><style>
      body{font-family:Arial;padding:30px} h1{color:#1d4ed8}
      table{width:100%;border-collapse:collapse;margin-top:12px;font-size:12px}
      th,td{border:1px solid #ccc;padding:6px;text-align:left} th{background:#eef}
      .ass{background:#f6f6f6}
    </style></head><body>
      <h1>État global — Association de Fraternité et d'Entraide</h1>
      <p>Période : du <strong>${startDate}</strong> au <strong>${endDate}</strong></p>
      <p>
        <strong>Présences :</strong> ${data.totals.total_present} &nbsp;·&nbsp;
        <strong>Absences :</strong> ${data.totals.total_absent} &nbsp;·&nbsp;
        <strong>Excusés :</strong> ${data.totals.total_excuse}
      </p>
      <h3>Assistances effectuées</h3>
      <table>${th(['Assistance', 'Montant unitaire statutaire', 'Total déboursé'])}<tbody>${assRows}${tr([`Montant TOTAL déboursé : ${data.totals.total_disbursed} F`, '', ''], 'ass')}</tbody></table>
      <h3>État financier par membre</h3>
      <table>${th(['Membre', 'Prés.', 'Abs.', 'Exc.', 'Dû', 'Payé', 'Solde', 'Statut'])}<tbody>${memberRows}${tr([`TOTAL`, data.totals.total_present, data.totals.total_absent, data.totals.total_excuse, data.totals.total_due, data.totals.total_paid, data.totals.balance, ''])}</tbody></table>
      <script>setTimeout(()=>window.print(),300)<\/script>
    </body></html>`);
    w.document.close();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
        <h2 className="text-xl font-bold text-surface-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary-500" /> État global
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-surface-200 text-sm">
            <CalendarRange className="w-4 h-4 text-surface-400" />
            <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); resetPage(); }} className="outline-none" />
            <span className="text-surface-400">→</span>
            <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); resetPage(); }} className="outline-none" />
          </div>
          <button onClick={exportExcel} className="flex items-center gap-2 bg-emerald-500/10 text-emerald-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-500/20 transition-all">
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 bg-red-500/10 text-red-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-500/20 transition-all">
            <FileText className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      <p className="text-sm text-surface-500 -mt-2 mb-6">
        Du <strong>{startDate}</strong> au <strong>{endDate}</strong>
      </p>

      {loading ? <LoadingSpinner className="py-10" /> : !data ? (
        <p className="text-surface-500 text-center py-8">Aucune donnée.</p>
      ) : (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Présences', value: data.totals.total_present, color: 'text-emerald-600', icon: <UserCheck className="w-4 h-4" /> },
              { label: 'Absences', value: data.totals.total_absent, color: 'text-red-600', icon: <UserX className="w-4 h-4" /> },
              { label: 'Excusés', value: data.totals.total_excuse, color: 'text-amber-600', icon: <UserCheck className="w-4 h-4" /> },
              { label: 'Membres', value: data.count, color: 'text-primary-600', icon: <BarChart3 className="w-4 h-4" /> },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl border border-surface-100 p-4 flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${s.color} bg-opacity-10`}>{s.icon}</div>
                <div>
                  <div className="text-xs text-surface-500">{s.label}</div>
                  <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total dû', value: data.totals.total_due, color: 'text-red-600' },
              { label: 'Total payé', value: data.totals.total_paid, color: 'text-emerald-600' },
              { label: 'Solde restant', value: data.totals.balance, color: 'text-amber-600' },
              { label: 'Pénalités', value: data.totals.penalties, color: 'text-orange-600' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl border border-surface-100 p-4">
                <div className="text-xs text-surface-500 mb-1">{s.label}</div>
                <div className={`text-lg font-bold ${s.color}`}>{fmt(s.value)} F</div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-surface-100 p-5 mb-6">
            <h3 className="text-sm font-bold text-surface-900 flex items-center gap-2 mb-4">
              <HandCoins className="w-4 h-4 text-primary-500" /> Assistances effectuées ({data.totals.total_assistances})
              <span className="ml-auto text-primary-600 font-bold">Montant déboursé total : {fmt(data.totals.total_disbursed)} F</span>
            </h3>
            {data.assistances.length === 0 ? (
              <p className="text-surface-500 text-sm">Aucune assistance enregistrée sur cette période.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface-50 text-surface-500 text-left">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Type d'assistance</th>
                      <th className="px-4 py-3 font-semibold text-center">Nombre</th>
                      <th className="px-4 py-3 font-semibold text-right">Montant unitaire (statuts)</th>
                      <th className="px-4 py-3 font-semibold text-right">Total déboursé</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {data.assistances.map(a => (
                      <tr key={a.type} className="hover:bg-surface-50">
                        <td className="px-4 py-3 font-medium text-surface-800">{a.label}</td>
                        <td className="px-4 py-3 text-center text-surface-700">{a.count}</td>
                        <td className="px-4 py-3 text-right text-surface-600">{fmt(a.amount)} F</td>
                        <td className="px-4 py-3 text-right font-bold text-primary-600">{fmt(a.total)} F</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
            <h3 className="px-5 pt-4 text-sm font-bold text-surface-900">État financier par membre</h3>
            <table className="w-full text-sm">
              <thead className="bg-surface-50 text-surface-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Membre</th>
                  <th className="px-4 py-3 font-semibold text-center">Prés.</th>
                  <th className="px-4 py-3 font-semibold text-center">Abs.</th>
                  <th className="px-4 py-3 font-semibold text-center">Exc.</th>
                  <th className="px-4 py-3 font-semibold text-right">Dû</th>
                  <th className="px-4 py-3 font-semibold text-right">Payé</th>
                  <th className="px-4 py-3 font-semibold text-right">Solde</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {data.members.map(m => (
                  <tr key={m.member_id} className="hover:bg-surface-50">
                    <td className="px-4 py-3 font-medium text-surface-800">{m.full_name}</td>
                    <td className="px-4 py-3 text-center text-emerald-600">{m.present}</td>
                    <td className="px-4 py-3 text-center text-red-600">{m.absences}</td>
                    <td className="px-4 py-3 text-center text-amber-600">{m.excuses}</td>
                    <td className="px-4 py-3 text-right text-surface-600">{fmt(m.total_due)} F</td>
                    <td className="px-4 py-3 text-right text-surface-600">{fmt(m.total_paid)} F</td>
                    <td className={`px-4 py-3 text-right font-medium ${m.balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{fmt(m.balance)} F</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge(m.status)}`}>{m.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} pageSize={pageSize} count={data.count} onChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}
