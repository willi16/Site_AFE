import { useState, useEffect, useCallback } from 'react';
import { HandCoins, FileSpreadsheet, FileText } from 'lucide-react';
import api from '../../../api/axios';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import Pagination from '../../../components/ui/Pagination';
import { useAuth } from '../../../context/AuthContext';
import { confirmAction, showSuccess, showError, showLoading, closeLoading, extractError } from '../../../utils/swal';

const computeStatus = (paid, amount) => {
  if (amount > 0 && paid >= amount) return 'paid';
  if (paid > 0 && paid < amount) return 'overdue';
  return 'pending';
};

const STATUS_STYLES = {
  paid: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-gray-100 text-gray-600',
  overdue: 'bg-amber-100 text-amber-700',
};

export default function CotisationsManager() {
  const { isTreasurer, isAdmin } = useAuth();
  const canEdit = isTreasurer || isAdmin;
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
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

  const startEdit = (row, field) => setSelected({ ...row, field });

  const saveEdit = async () => {
    if (!selected) return;
    const field = selected.field;
    const label = field === 'amount' ? 'Montant dû' : 'Montant payé';
    const memberName = selected.member_name;
    const ok = await confirmAction(
      `Modifier le ${field === 'amount' ? 'montant dû' : 'montant payé'} ?`,
      `« ${memberName || 'Membre'} » — « ${selected.label} » : ${label} = ${selected[field]}.`,
      { icon: 'question', confirmText: 'Oui, enregistrer' }
    );
    if (!ok.isConfirmed) { setSelected(null); return; }
    const newAmount = Math.max(0, parseFloat(selected.amount) || 0);
    const newPaid = Math.max(0, parseFloat(selected.amount_paid) || 0);
    const status = computeStatus(newPaid, newAmount);
    showLoading('Mise à jour...');
    try {
      await api.patch(`/cotisations/${selected.id}/`, { amount: newAmount, amount_paid: newPaid, status });
      closeLoading();
      showSuccess('Cotisation mise à jour');
      setSelected(null);
      load();
    } catch (err) {
      closeLoading();
      showError('Erreur', extractError(err, 'Impossible de mettre à jour la cotisation.'));
    }
  };

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
          <HandCoins className="w-5 h-5 text-primary-500" /> Cotisations des membres
        </h2>
        <div className="flex gap-2">
          <button onClick={exportExcel} className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-all">
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-600 transition-all">
            <FileText className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

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
                  <td className="px-4 py-3">
                    {canEdit ? (
                      <button onClick={() => startEdit(r, 'amount')} className="px-2 py-1 rounded-lg border border-surface-200 hover:border-primary-400" title="Modifier le montant dû">{r.amount}</button>
                    ) : r.amount}
                  </td>
                  <td className="px-4 py-3">
                    {canEdit ? (
                      <button onClick={() => startEdit(r, 'amount_paid')} className="px-2 py-1 rounded-lg border border-surface-200 text-emerald-600 hover:border-primary-400" title="Modifier le montant payé">{r.amount_paid}</button>
                    ) : <span className="text-emerald-600">{r.amount_paid}</span>}
                  </td>
                  <td className={`px-4 py-3 font-medium ${parseFloat(r.balance || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{r.balance}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[r.status] || STATUS_STYLES.pending}`}>{r.status_display || r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-surface-500">{(r.due_date || r.created_at)?.slice(0, 10) || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {selected && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
              <div className="bg-white rounded-3xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-surface-900 mb-4">
                  Entrer le {selected.field === 'amount' ? 'montant dû' : 'montant payé'} — {selected.label}
                </h3>
                <div className="mb-4 text-sm text-surface-500">
                  Membre : <strong>{selected.member_name || selected.member}</strong>
                  {selected.field === 'amount' && selected.id && (
                    <>
                      {' '}· Payé actuellement : <strong>{selected.amount_paid}</strong>
                    </>
                  )}
                </div>
                <input
                  type="number"
                  min="0"
                  value={selected[selected.field]}
                  onChange={e => setSelected({ ...selected, [selected.field]: e.target.value })}
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-surface-200 text-sm mb-5"
                />
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="flex-1 bg-primary-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-600">Enregistrer</button>
                  <button onClick={() => setSelected(null)} className="px-4 py-2.5 rounded-xl border border-surface-200 text-surface-600 text-sm">Annuler</button>
                </div>
              </div>
            </div>
          )}

          <Pagination page={page} pageSize={pageSize} count={count} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
