import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { HandCoins, FileSpreadsheet, FileText, Check } from 'lucide-react';
import api from '../../../api/axios';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function CotisationsManager() {
  const [members, setMembers] = useState([]);
  const [cotisations, setCotisations] = useState([]);
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [m, c] = await Promise.all([
        api.get('/members/directory/').catch(() => ({ data: [] })),
        api.get('/cotisations/', { params: { page_size: 500 } }).catch(() => ({ data: { results: [] } })),
      ]);
      setMembers(m.data.results || m.data || []);
      const rows = c.data.results || c.data || [];
      setCotisations(rows);
      const lbls = [...new Set(rows.map(r => r.label))];
      setLabels(lbls);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // For evolution: group by label, compute paid totals
  const colStats = labels.map(label => {
    const rows = cotisations.filter(c => c.label === label);
    return { label, total: rows.reduce((s, c) => s + parseFloat(c.amount || 0), 0), paid: rows.reduce((s, c) => s + parseFloat(c.amount_paid || 0), 0) };
  });

  const memberStatus = (memberId, label) => cotisations.find(c => c.member === memberId && c.label === label);

  const togglePaid = async (memberId, label) => {
    const c = memberStatus(memberId, label);
    try {
      if (c) {
        const paid = c.amount_paid >= c.amount ? 0 : c.amount;
        const status = paid >= c.amount ? 'paid' : 'overdue';
        await api.patch(`/cotisations/${c.id}/`, { amount_paid: paid, status });
      } else {
        await api.post('/cotisations/', { member: memberId, label, amount: 2500, amount_paid: 2500, status: 'paid' });
      }
      toast.success('Cotisation mise à jour');
      load();
    } catch (err) { console.error(err); toast.error('Erreur'); }
  };

  const exportExcel = () => {
    const header = ['Membre', 'Email', ...labels.map(l => l), 'Total payé', 'Solde'];
    const lines = members.map(m => {
      const totalPaid = labels.reduce((s, l) => s + (memberStatus(m.id, l)?.amount_paid || 0), 0);
      const totalDue = labels.reduce((s, l) => s + (memberStatus(m.id, l)?.amount || 0), 0);
      return [m.full_name, m.email, ...labels.map(l => memberStatus(m.id, l)?.status === 'paid' ? 'OUI' : 'NON'), totalPaid, Math.max(0, totalDue - totalPaid)];
    });
    const csv = '\ufeff' + [header, ...lines].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'cotisations_afe.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const w = window.open('', '_blank', 'width=900,height=700');
    const rows = members.map(m => {
      const totalPaid = labels.reduce((s, l) => s + (memberStatus(m.id, l)?.amount_paid || 0), 0);
      const totalDue = labels.reduce((s, l) => s + (memberStatus(m.id, l)?.amount || 0), 0);
      const cells = labels.map(l => `<td style="text-align:center">${memberStatus(m.id, l)?.status === 'paid' ? '✓' : '✗'}</td>`).join('');
      return `<tr><td>${m.full_name}</td><td>${m.email}</td>${cells}<td>${totalPaid} FCFA</td><td>${Math.max(0, totalDue - totalPaid)} FCFA</td></tr>`;
    }).join('');
    const head = labels.map(l => `<th>${l}</th>`).join('');
    w.document.write(`<html><head><title>Cotisations AFE</title><style>
      body{font-family:Arial;padding:30px}
      h1{color:#1d4ed8} h2{color:#555}
      table{width:100%;border-collapse:collapse;margin-top:10px;font-size:12px}
      th,td{border:1px solid #ccc;padding:6px;text-align:left}
      th{background:#eef}
    </style></head><body>
      <h1>État des cotisations - Association de Fraternité et d'Entraide</h1>
      <h2>Généré le ${new Date().toLocaleDateString('fr-FR')}</h2>
      <table><thead><tr><th>Membre</th><th>Email</th>${head}<th>Total payé</th><th>Solde</th></tr></thead><tbody>${rows}</tbody></table>
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
        <>
          {/* Stats par cotisation */}
          <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {colStats.map(cs => (
              <div key={cs.label} className="bg-white rounded-2xl p-5 border border-surface-100">
                <p className="text-sm text-surface-500 mb-1">{cs.label}</p>
                <p className="text-lg font-bold text-surface-900">{Math.round(cs.paid / (cs.total || 1) * 100)}% encaissé</p>
                <p className="text-xs text-surface-400">{cs.paid.toLocaleString('fr-FR')} / {cs.total.toLocaleString('fr-FR')} FCFA</p>
              </div>
            ))}
          </motion.div>

          <div className="bg-white rounded-2xl border border-surface-100 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-50 text-surface-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold sticky left-0 bg-surface-50">Membre</th>
                  {labels.map(l => <th key={l} className="px-4 py-3 font-semibold whitespace-nowrap">✔ {l}</th>)}
                  <th className="px-4 py-3 font-semibold">Total payé</th>
                  <th className="px-4 py-3 font-semibold">Solde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {members.map(m => {
                  const totalDue = labels.reduce((s, l) => s + (memberStatus(m.id, l)?.amount || 0), 0);
                  const totalPaid = labels.reduce((s, l) => s + (memberStatus(m.id, l)?.amount_paid || 0), 0);
                  return (
                    <tr key={m.id} className="hover:bg-surface-50">
                      <td className="px-4 py-2.5 font-medium text-surface-800 sticky left-0 bg-white">{m.full_name}</td>
                      {labels.map(l => {
                        const c = memberStatus(m.id, l);
                        const checked = c?.status === 'paid';
                        return (
                          <td key={l} className="px-4 py-2.5 text-center">
                            <button
                              onClick={() => togglePaid(m.id, l)}
                              title={checked ? 'Marquer comme non payée' : 'Marquer comme payée'}
                              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-surface-300 text-transparent hover:border-emerald-400'}`}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </td>
                        );
                      })}
                      <td className="px-4 py-2.5 text-emerald-600 font-medium">{totalPaid.toLocaleString('fr-FR')}</td>
                      <td className={`px-4 py-2.5 font-medium ${totalDue - totalPaid > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{Math.max(0, totalDue - totalPaid).toLocaleString('fr-FR')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
