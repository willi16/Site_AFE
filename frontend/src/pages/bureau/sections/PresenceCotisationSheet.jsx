import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, FileSpreadsheet, FileText, Check, ClipboardCheck } from 'lucide-react';
import api from '../../../api/axios';
import { confirmAction, showSuccess, showError, showLoading, closeLoading, extractError } from '../../../utils/swal';

const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const STATUS_LABELS = {
  present: 'Présent',
  absent: 'Absent non justifié',
  excuse: 'Absent justifié',
};

const DEFAULT_MONTHLY_LABEL = 'Cotisation mensuelle';
const DEFAULT_AMOUNT = 2500;

export default function PresenceCotisationSheet({
  members,
  eventId,
  eventTitle,
  labels = [],
  withPresence = true,
  canEdit = true,
  canEditCotisations = true,
}) {
  const [presence, setPresence] = useState({});
  const [cotis, setCotis] = useState({});
  const [existingCotis, setExistingCotis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Garantir la cotisation mensuelle en premier (obligatoire)
  const cotisationLabels = labels.includes(DEFAULT_MONTHLY_LABEL)
    ? labels
    : [DEFAULT_MONTHLY_LABEL, ...labels.filter(l => l !== DEFAULT_MONTHLY_LABEL)];

  useEffect(() => {
    if (!members.length) return;
    setLoading(true);
    const init = {};
    members.forEach(m => { init[m.id] = 'present'; });
    setPresence(init);
    const tasks = [];
    if (withPresence && eventId) {
      tasks.push(api.get('/attendances/', { params: { event: eventId, page_size: 100 } }).then(({ data }) => {
        const map = {};
        (data.results || data || []).forEach(r => { map[r.member] = r.status; });
        setPresence(prev => ({ ...prev, ...map }));
      }).catch(() => {}));
    }
    tasks.push(api.get('/cotisations/', { params: { page_size: 500 } }).then(({ data }) => {
      const rows = data.results || data || [];
      setExistingCotis(rows);
      const map = {};
      rows.forEach(r => {
        if (!map[r.member]) map[r.member] = {};
        const label = r.label;
        map[r.member][label] = r.status === 'paid';
      });
      setCotis(prev => {
        const next = { ...prev };
        members.forEach(m => {
          next[m.id] = { ...(next[m.id] || {}), ...(map[m.id] || {}) };
          cotisationLabels.forEach(lbl => {
            if (next[m.id][lbl] === undefined) next[m.id][lbl] = false;
          });
        });
        return next;
      });
    }).catch(() => {}));
    Promise.all(tasks).finally(() => setLoading(false));
  }, [members, eventId, withPresence]);

  const togglePresence = (id, val) => setPresence(p => ({ ...p, [id]: val }));

  const toggleCotis = (memberId, label) => setCotis(c => ({
    ...c,
    [memberId]: { ...(c[memberId] || {}), [label]: !(c[memberId] && c[memberId][label]) },
  }));

  const memberPaid = (m) => cotisationLabels.reduce((s, l) => s + ((cotis[m.id] && cotis[m.id][l]) ? getAmount(m.id, l) : 0), 0);

  const getAmount = (memberId, label) => {
    const found = existingCotis.find(c => c.member === memberId && c.label === label);
    return found ? parseFloat(found.amount || DEFAULT_AMOUNT) : DEFAULT_AMOUNT;
  };

  const saveCotisation = async (memberId, label) => {
    const paid = !!(cotis[memberId] && cotis[memberId][label]);
    const existing = existingCotis.find(c => c.member === memberId && c.label === label);
    const amount = getAmount(memberId, label);
    if (existing) {
      const newPaid = paid ? amount : 0;
      const status = newPaid >= amount ? 'paid' : 'overdue';
      await api.patch(`/cotisations/${existing.id}/`, { amount_paid: newPaid, status });
    } else {
      await api.post('/cotisations/', { member: memberId, label, amount, amount_paid: paid ? amount : 0, status: paid ? 'paid' : 'overdue' });
    }
  };

  const saveAttendance = async () => {
    if (!eventId) return;
    try {
      const { data } = await api.get('/attendances/', { params: { event: eventId, page_size: 100 } });
      const rows = data.results || data || [];
      const existing = {};
      rows.forEach(r => existing[r.member] = r.id);
      for (const m of members) {
        const status = presence[m.id] || 'present';
        const id = existing[m.id];
        if (id) await api.patch(`/attendances/${id}/`, { status });
        else await api.post('/attendances/', { event: eventId, member: m.id, status, event_title: eventTitle || '' });
      }
    } catch (err) {
      throw new Error(extractError(err, 'Erreur lors de l\'enregistrement des présences.'));
    }
  };

  const handleSave = async () => {
    if (!withPresence && !canEditCotisations) return;
    if (withPresence && !eventId) { showError('Aucune réunion', 'Veuillez ouvrir une réunion avant d\'enregistrer.'); return; }
    const ok = await confirmAction(
      'Enregistrer présences et cotisations ?',
      `Les présences et cotisations de ${members.length} membres seront enregistrées pour « ${eventTitle || 'cette réunion'} ».`,
      { icon: 'question', confirmText: 'Oui, enregistrer' }
    );
    if (!ok.isConfirmed) return;
    setSaving(true);
    showLoading('Enregistrement...');
    let count = 0;
    try {
      if (withPresence) { await saveAttendance(); count += members.length; }
      if (canEditCotisations) {
        for (const m of members) {
          for (const lbl of cotisationLabels) {
            await saveCotisation(m.id, lbl);
          }
        }
      }
      closeLoading();
      showSuccess(`Enregistrement terminé (${count} présences)`);
    } catch (err) {
      closeLoading();
      showError('Erreur', extractError(err, 'Erreur lors de l\'enregistrement.'));
    } finally { setSaving(false); }
  };

  const exportExcel = () => {
    const header = ['Membre', ...(withPresence ? ['Présence'] : []), ...cotisationLabels.map(l => l), 'Total cotisé'];
    const lines = members.map(m => {
      const row = [m.full_name];
      if (withPresence) row.push(STATUS_LABELS[presence[m.id]] || '—');
      cotisationLabels.forEach(l => row.push((cotis[m.id] && cotis[m.id][l]) ? 'OUI' : 'NON'));
      row.push(memberPaid(m));
      return row;
    });
    const csv = '\ufeff' + [header, ...lines].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `presence_cotisations_${(eventTitle || 'reunion').replace(/\s+/g, '_')}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const w = window.open('', '_blank', 'width=900,height=700');
    const headCells = ['Membre'];
    if (withPresence) headCells.push('Présence');
    headCells.push(...cotisationLabels.map(l => l));
    headCells.push('Total cotisé');
    const head = headCells.map(c => `<th>${c}</th>`).join('');
    const rows = members.map(m => {
      let cells = `<td>${m.full_name}</td>`;
      if (withPresence) cells += `<td>${STATUS_LABELS[presence[m.id]] || '—'}</td>`;
      cotisationLabels.forEach(l => cells += `<td style="text-align:center">${(cotis[m.id] && cotis[m.id][l]) ? '✓' : '✗'}</td>`);
      cells += `<td>${memberPaid(m)} FCFA</td>`;
      return `<tr>${cells}</tr>`;
    }).join('');
    w.document.write(`<html><head><title>Présence & Cotisations</title><style>
      body{font-family:Arial;padding:30px}
      h1{color:#1d4ed8} h2{color:#555}
      table{width:100%;border-collapse:collapse;margin-top:10px;font-size:12px}
      th,td{border:1px solid #ccc;padding:6px;text-align:left}
      th{background:#eef}
    </style></head><body>
      <h1>Feuille de présence & cotisations - Association de Fraternité et d'Entraide</h1>
      <h2>${eventTitle || 'Réunion'} — ${new Date().toLocaleDateString('fr-FR')}</h2>
      <table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>
      <script>setTimeout(()=>window.print(),300)<\/script>
    </body></html>`);
    w.document.close();
  };

  if (loading) return <div className="flex justify-center py-10"><div className="text-surface-400 text-sm">Chargement...</div></div>;
  if (!members.length) return <p className="text-surface-500 text-center py-8">Aucun membre. Ouvrez une réunion pour afficher la feuille.</p>;

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 transition-all">
          <Save className="w-4 h-4" /> {saving ? 'Enregistrement...' : 'Enregistrer présences + cotisations'}
        </button>
        <button onClick={exportExcel} className="flex items-center gap-2 bg-emerald-500/10 text-emerald-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-500/20 transition-all">
          <FileSpreadsheet className="w-4 h-4" /> Excel
        </button>
        <button onClick={exportPDF} className="flex items-center gap-2 bg-red-500/10 text-red-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-500/20 transition-all">
          <FileText className="w-4 h-4" /> PDF
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-surface-100 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-50 text-surface-500 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold sticky left-0 bg-surface-50">Membre</th>
              {withPresence && <th className="px-4 py-3 font-semibold min-w-[150px]">Présence</th>}
              {cotisationLabels.map(l => (
                <th key={l} className="px-4 py-3 font-semibold whitespace-nowrap text-center">
                  {DEFAULT_MONTHLY_LABEL === l ? <span className="inline-flex items-center gap-1"><ClipboardCheck className="w-3.5 h-3.5" /> {l} *</span> : l}
                </th>
              ))}
              <th className="px-4 py-3 font-semibold whitespace-nowrap">Total cotisé</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {members.map(m => (
              <tr key={m.id} className="hover:bg-surface-50">
                <td className="px-4 py-3 font-medium text-surface-800 sticky left-0 bg-white">{m.full_name}</td>
                {withPresence && (
                  <td className="px-4 py-3">
                    <select
                      value={presence[m.id] || 'absent'}
                      onChange={e => togglePresence(m.id, e.target.value)}
                      disabled={!canEdit}
                      className="px-3 py-2 rounded-lg border border-surface-200 text-sm disabled:opacity-60"
                    >
                      <option value="present">Présent</option>
                      <option value="absent">Absent non justifié</option>
                      <option value="excuse">Absent justifié</option>
                    </select>
                  </td>
                )}
                {cotisationLabels.map(l => {
                  const checked = !!(cotis[m.id] && cotis[m.id][l]);
                  return (
                    <td key={l} className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleCotis(m.id, l)}
                        disabled={!canEditCotisations}
                        title={l === DEFAULT_MONTHLY_LABEL ? 'Cotisation mensuelle (obligatoire)' : l}
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-surface-300 text-transparent hover:border-emerald-400'} ${!canEditCotisations ? 'cursor-not-allowed opacity-60' : ''}`}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-emerald-600 font-medium whitespace-nowrap">{memberPaid(m).toLocaleString('fr-FR')} FCFA</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {canEditCotisations && (
        <div className="mt-3 bg-surface-50 border border-surface-100 rounded-xl px-4 py-3 text-xs text-surface-500">
          <strong>* Cotisation mensuelle :</strong> obligatoire pour chaque membre. Cocher pour valider le paiement du mois. Les autres cotisations (fond solidaire, sorties...) sont facultatives.
        </div>
      )}
    </motion.div>
  );
}
