import { useState, useEffect, useCallback } from 'react';
import { HandCoins, FileSpreadsheet, FileText, Settings2, ArrowRight } from 'lucide-react';
import api from '../../../api/axios';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import Pagination from '../../../components/ui/Pagination';
import { Link } from 'react-router-dom';

const STATUS_STYLES = {
  paid: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-gray-100 text-gray-600',
  overdue: 'bg-amber-100 text-amber-700',
};

export default function CotisationsManager() {
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const pageSize = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/cotisations/', { params: { page, page_size: pageSize } });
      setRows(data.results || data || []);
      setCount(data.count ?? 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const exportExcel = () => {
    const header = ['Membre', 'Libellé', 'Événement', 'Montant dû', 'Payé', 'Solde', 'Statut', 'Date'];
    const lines = rows.map(r => [
      r.member_name || r.member,
      r.label,
      r.event_title || '—',
      r.amount,
      r.amount_paid,
      (parseFloat(r.amount || 0) - parseFloat(r.amount_paid || 0)).toFixed(2),
      r.status_display || r.status,
      (r.due_date || r.created_at)?.slice(0, 10) || '',
    ]);
    const csv = '\ufeff' + [header, ...lines].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'cotisations_afe.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const w = window.open('', '_blank', 'width=900,height=700');
    const head = ['Membre', 'Libellé', 'Événement', 'Montant dû', 'Payé', 'Solde', 'Statut', 'Date'].map(c => `<th>${c}</th>`).join('');
    const body = rows.map(r => `<tr>
      <td>${r.member_name || r.member}</td>
      <td>${r.label}</td>
      <td>${r.event_title || '—'}</td>
      <td>${r.amount}</td>
      <td>${r.amount_paid}</td>
      <td>${(parseFloat(r.amount || 0) - parseFloat(r.amount_paid || 0)).toFixed(2)}</td>
      <td>${r.status_display || r.status}</td>
      <td>${(r.due_date || r.created_at)?.slice(0, 10) || ''}</td>
    </tr>`).join('');
    w.document.write(`<html><head><title>Cotisations AFE</title><style>
      body{font-family:Arial;padding:30px}
      h1{color:#1d4ed8} h2{color:#555}
      table{width:100%;border-collapse:collapse;margin-top:10px;font-size:12px}
      th,td{border:1px solid #ccc;padding:6px;text-align:left}
      th{background:#eef}
    </style></head><body>
      <h1>État des cotisations - Association de Fraternité et d'Entraide</h1>
      <h2>Généré le ${new Date().toLocaleDateString('fr-FR')}</h2>
      <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
      <script>setTimeout(()=>window.print(),300)<\/script>
    </body></html>`);
    w.document.close();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-xl font-bold text-surface-900 flex items-center gap-2">
          <HandCoins className="w-5 h-5 text-primary-500" /> Liste des cotisations
        </h2>
        <div className="flex gap-2">
          <Link to="/espace-tresorier/presence-cotisations" className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-all">
            <Settings2 className="w-4 h-4" /> Configurer présence & cotisations <ArrowRight className="w-4 h-4" />
          </Link>
          <button onClick={exportExcel} className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-all">
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-600 transition-all">
            <FileText className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      <p className="text-xs text-surface-500 mb-4 flex items-center gap-1">
        <Settings2 className="w-3.5 h-3.5" />
        L'événement et le montant à cotiser se configurent dans « <strong>Présence + Cotisations</strong> ». Cette liste est un récapitulatif en lecture seule.
      </p>

      {loading ? <LoadingSpinner className="py-10" /> : (
        <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 text-surface-500 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Membre</th>
                <th className="px-4 py-3 font-semibold">Libellé</th>
                <th className="px-4 py-3 font-semibold">Événement</th>
                <th className="px-4 py-3 font-semibold">Montant dû</th>
                <th className="px-4 py-3 font-semibold">Payé</th>
                <th className="px-4 py-3 font-semibold">Solde</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
                <th className="px-4 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {rows.map(r => (
                <tr key={r.id} className="hover:bg-surface-50">
                  <td className="px-4 py-3 font-medium text-surface-800">{r.member_name || r.member}</td>
                  <td className="px-4 py-3 text-surface-600">{r.label}</td>
                  <td className="px-4 py-3 text-surface-600">{r.event_title || '—'}</td>
                  <td className="px-4 py-3 text-surface-800">{r.amount}</td>
                  <td className="px-4 py-3 text-surface-800"><span className="text-emerald-600">{r.amount_paid}</span></td>
                  <td className={`px-4 py-3 font-medium ${parseFloat(r.balance || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{r.balance}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[r.status] || STATUS_STYLES.pending}`}>{r.status_display || r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-surface-500">{(r.due_date || r.created_at)?.slice(0, 10) || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination page={page} pageSize={pageSize} count={count} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
