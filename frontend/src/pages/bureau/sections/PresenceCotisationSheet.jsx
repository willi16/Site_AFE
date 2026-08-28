import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, FileSpreadsheet, FileText, ClipboardCheck, Plus, X } from 'lucide-react';
import api from '../../../api/axios';
import { confirmAction, showSuccess, showError, showLoading, closeLoading, extractError } from '../../../utils/swal';

const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const STATUS_LABELS = {
  present: 'Présent',
  absent: 'Absent non justifié',
  excuse: 'Absent justifié',
};

const MONTHLY_LABEL = 'Cotisation mensuelle';
const DEFAULT_AMOUNT = 2500;

export default function PresenceCotisationSheet({
  members,
  eventId,
  eventTitle,
  isMonthlyAssembly = false,
  withPresence = true,
  canEdit = true,
  canEditCotisations = false,
}) {
  const [presence, setPresence] = useState({});
  const [columns, setColumns] = useState([]);
  const [dueAmounts, setDueAmounts] = useState({});
  const [amounts, setAmounts] = useState({});
  const [existingCotis, setExistingCotis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newAmount, setNewAmount] = useState(DEFAULT_AMOUNT);

  useEffect(() => {
    if (!members.length) return;
    setLoading(true);
    const initPresence = {};
    members.forEach(m => { initPresence[m.id] = 'present'; });
    setPresence(initPresence);

    const attendanceReq = withPresence && eventId
      ? api.get('/attendances/', { params: { event: eventId, page_size: 100 } }).then(({ data }) => data.results || data || [])
      : Promise.resolve([]);
    const cotisationReq = canEditCotisations && eventId
      ? api.get('/cotisations/', { params: { event: eventId, page_size: 500 } }).then(({ data }) => data.results || data || [])
      : Promise.resolve([]);

    Promise.all([attendanceReq, cotisationReq]).then(([attRows, cotRows]) => {
      const attMap = {};
      attRows.forEach(r => { attMap[r.member] = r.status; });
      setPresence(prev => ({ ...prev, ...attMap }));

      if (canEditCotisations) {
        setExistingCotis(cotRows);
        let cols = [];
        if (isMonthlyAssembly) {
          const first = cotRows.find(c => c.label === MONTHLY_LABEL);
          cols = [{ label: MONTHLY_LABEL, amount: first ? parseFloat(first.amount) : DEFAULT_AMOUNT }];
        } else {
          const seen = {};
          cotRows.forEach(c => {
            if (!seen[c.label]) { seen[c.label] = true; cols.push({ label: c.label, amount: parseFloat(c.amount) }); }
          });
        }
        setColumns(cols);
        const due = {};
        cols.forEach(c => { due[c.label] = c.amount; });
        setDueAmounts(due);
        const amt = {};
        members.forEach(m => {
          amt[m.id] = {};
          cols.forEach(c => {
            const row = cotRows.find(r => r.member === m.id && r.label === c.label);
            amt[m.id][c.label] = row ? parseFloat(row.amount_paid || 0) : 0;
          });
        });
        setAmounts(amt);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [members, eventId, withPresence, isMonthlyAssembly, canEditCotisations]);

  const togglePresence = (id, val) => setPresence(p => ({ ...p, [id]: val }));

  const setPaid = (memberId, label, value) => {
    const num = Math.max(0, parseFloat(value) || 0);
    setAmounts(a => ({ ...a, [memberId]: { ...(a[memberId] || {}), [label]: num } }));
  };

  const setDue = (label, value) => {
    const num = Math.max(0, parseFloat(value) || 0);
    setDueAmounts(d => ({ ...d, [label]: num }));
  };

  const addColumn = (label, amount) => {
    if (!label.trim()) { showError('Libellé requis', 'Indiquez un libellé pour la cotisation.'); return; }
    const amountNum = Math.max(0, parseFloat(amount) || 0);
    setColumns(cols => {
      if (cols.some(c => c.label === label.trim())) return cols;
      return [...cols, { label: label.trim(), amount: amountNum }];
    });
    setDueAmounts(d => ({ ...d, [label.trim()]: amountNum }));
    setAmounts(a => {
      const next = { ...a };
      members.forEach(m => { next[m.id] = { ...(next[m.id] || {}), [label.trim()]: (next[m.id] && next[m.id][label.trim()]) || 0 }; });
      return next;
    });
    setNewLabel('');
    setNewAmount(DEFAULT_AMOUNT);
    setShowAddForm(false);
  };

  const memberTotal = (m) => columns.reduce((s, c) => s + ((amounts[m.id] && amounts[m.id][c.label]) || 0), 0);
  const labelTotal = (c) => members.reduce((s, m) => s + ((amounts[m.id] && amounts[m.id][c.label]) || 0), 0);
  const sessionTotal = () => columns.reduce((s, c) => s + labelTotal(c), 0);

  const computeStatus = (paid, amount) => {
    if (paid >= amount && amount > 0) return 'paid';
    if (paid > 0 && paid < amount) return 'overdue';
    return 'pending';
  };

  const saveCotisation = async (memberId, label) => {
    const paid = (amounts[memberId] && amounts[memberId][label]) || 0;
    const amount = dueAmounts[label] || 0;
    const status = computeStatus(paid, amount);
    const existing = existingCotis.find(c => c.member === memberId && c.label === label);
    const payload = { amount_paid: paid, amount, status };
    if (existing) {
      await api.patch(`/cotisations/${existing.id}/`, payload);
    } else {
      await api.post('/cotisations/', { event: eventId, member: memberId, label, ...payload });
    }
  };

  const saveAttendance = async () => {
    if (!eventId) return;
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
  };

  const handleSave = async () => {
    const canSavePresence = withPresence && canEdit;
    const canSaveCotis = canEditCotisations;
    if (!canSavePresence && !canSaveCotis) return;
    if (canSavePresence && !eventId) { showError('Aucune réunion', 'Veuillez ouvrir une réunion avant d\'enregistrer.'); return; }
    const ok = await confirmAction(
      'Enregistrer ?',
      `Les données de ${members.length} membres seront enregistrées pour « ${eventTitle || 'cette réunion'} ».`,
      { icon: 'question', confirmText: 'Oui, enregistrer' }
    );
    if (!ok.isConfirmed) return;
    setSaving(true);
    showLoading('Enregistrement...');
    let count = 0;
    try {
      if (canSavePresence) {
        await saveAttendance();
        count += members.length;
      }
      if (canSaveCotis && eventId) {
        for (const m of members) {
          for (const c of columns) {
            await saveCotisation(m.id, c.label);
          }
        }
        count += members.length * columns.length;
      }
      closeLoading();
      showSuccess(`Enregistrement terminé (${count} entrées)`);
    } catch (err) {
      closeLoading();
      showError('Erreur', extractError(err, 'Erreur lors de l\'enregistrement.'));
    } finally { setSaving(false); }
  };

  const visibleCotisationColumns = canEditCotisations ? columns : [];
  const canSaveAnything = (withPresence && canEdit) || canEditCotisations;

  const exportExcel = () => {
    const header = ['Membre', ...(withPresence ? ['Présence'] : []), ...visibleCotisationColumns.map(c => `${c.label} (FCFA)`), ...(visibleCotisationColumns.length ? ['Total cotisé'] : [])];
    const lines = members.map(m => {
      const row = [m.full_name];
      if (withPresence) row.push(STATUS_LABELS[presence[m.id]] || '—');
      visibleCotisationColumns.forEach(c => row.push((amounts[m.id] && amounts[m.id][c.label]) || 0));
      if (visibleCotisationColumns.length) row.push(memberTotal(m));
      return row;
    });
    if (visibleCotisationColumns.length) {
      lines.push(['TOTAL SÉANCE', ...(withPresence ? [''] : []), ...visibleCotisationColumns.map(c => labelTotal(c)), sessionTotal()]);
    }
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
    headCells.push(...visibleCotisationColumns.map(c => `${c.label} (FCFA)`));
    if (visibleCotisationColumns.length) headCells.push('Total cotisé');
    const head = headCells.map(c => `<th>${c}</th>`).join('');
    const rows = members.map(m => {
      let cells = `<td>${m.full_name}</td>`;
      if (withPresence) cells += `<td>${STATUS_LABELS[presence[m.id]] || '—'}</td>`;
      visibleCotisationColumns.forEach(c => cells += `<td style="text-align:center">${(amounts[m.id] && amounts[m.id][c.label]) || 0}</td>`);
      if (visibleCotisationColumns.length) cells += `<td>${memberTotal(m)} FCFA</td>`;
      return `<tr>${cells}</tr>`;
    }).join('');
    let footerRow = '';
    if (visibleCotisationColumns.length) {
      footerRow = `<tr>${(withPresence ? '<td></td>' : '')}<td><strong>TOTAL SÉANCE</strong></td>` + visibleCotisationColumns.map(c => `<td style="text-align:center"><strong>${labelTotal(c)}</strong></td>`).join('') + `<td><strong>${sessionTotal()} FCFA</strong></td></tr>`;
    }
    w.document.write(`<html><head><title>Présence & Cotisations</title><style>
      body{font-family:Arial;padding:30px}
      h1{color:#1d4ed8} h2{color:#555}
      table{width:100%;border-collapse:collapse;margin-top:10px;font-size:12px}
      th,td{border:1px solid #ccc;padding:6px;text-align:left}
      th{background:#eef}
    </style></head><body>
      <h1>Feuille de présence & cotisations - Association de Fraternité et d'Entraide</h1>
      <h2>${eventTitle || 'Réunion'} — ${new Date().toLocaleDateString('fr-FR')}</h2>
      <table><thead><tr>${head}</tr></thead><tbody>${rows}${footerRow}</tbody></table>
      <script>setTimeout(()=>window.print(),300)<\/script>
    </body></html>`);
    w.document.close();
  };

  if (loading) return <div className="flex justify-center py-10"><div className="text-surface-400 text-sm">Chargement...</div></div>;
  if (!members.length) return <p className="text-surface-500 text-center py-8">Aucun membre. Ouvrez une réunion pour afficher la feuille.</p>;

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {canSaveAnything && (
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 transition-all">
            <Save className="w-4 h-4" /> {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        )}
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
              {visibleCotisationColumns.map(c => (
                <th key={c.label} className="px-3 py-3 font-semibold whitespace-nowrap text-center min-w-[130px]">
                  <div className="flex flex-col items-center gap-1">
                    <span className="inline-flex items-center gap-1">
                      {isMonthlyAssembly ? <ClipboardCheck className="w-3.5 h-3.5" /> : null}{c.label}
                    </span>
                    {isMonthlyAssembly && (
                      <span className="flex items-center gap-1 text-[10px] font-normal text-surface-400">
                        Dû
                        <input
                          type="number"
                          min="0"
                          value={dueAmounts[c.label] !== undefined ? dueAmounts[c.label] : DEFAULT_AMOUNT}
                          onChange={e => setDue(c.label, e.target.value)}
                          disabled={!canEditCotisations}
                          placeholder={String(DEFAULT_AMOUNT)}
                          className="w-16 px-1.5 py-0.5 rounded-md border border-surface-200 text-xs text-center disabled:opacity-60"
                        />
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {visibleCotisationColumns.length ? <th className="px-4 py-3 font-semibold whitespace-nowrap">Total membre</th> : null}
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
                {visibleCotisationColumns.map(c => (
                  <td key={c.label} className="px-2 py-3 text-center">
                    <input
                      type="number"
                      min="0"
                      value={amounts[m.id] && amounts[m.id][c.label] !== undefined ? amounts[m.id][c.label] : 0}
                      onChange={e => setPaid(m.id, c.label, e.target.value)}
                      disabled={!canEditCotisations}
                      placeholder="0"
                      className="w-20 px-2 py-1.5 rounded-lg border border-surface-200 text-sm text-center disabled:opacity-60"
                    />
                    <div className="text-[10px] text-surface-400 mt-0.5">/ {(dueAmounts[c.label] || 0).toLocaleString('fr-FR')} F</div>
                  </td>
                ))}
                {visibleCotisationColumns.length ? (
                  <td className="px-4 py-3 text-emerald-600 font-medium whitespace-nowrap">{memberTotal(m).toLocaleString('fr-FR')} FCFA</td>
                ) : null}
              </tr>
            ))}
          </tbody>
          {visibleCotisationColumns.length ? (
            <tfoot className="bg-surface-50">
              <tr>
                <td className="px-4 py-3 font-bold text-surface-800 sticky left-0 bg-surface-50">TOTAL SÉANCE</td>
                {withPresence && <td />}
                {visibleCotisationColumns.map(c => (
                  <td key={c.label} className="px-4 py-3 text-center font-bold text-primary-600">{labelTotal(c).toLocaleString('fr-FR')}</td>
                ))}
                <td className="px-4 py-3 font-bold text-primary-700 whitespace-nowrap">{sessionTotal().toLocaleString('fr-FR')} FCFA</td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      {canEditCotisations && !isMonthlyAssembly && (
        <div className="mt-3 bg-surface-50 border border-surface-100 rounded-xl p-4">
          {!showAddForm ? (
            <button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-all">
              <Plus className="w-4 h-4" /> Ajouter une cotisation
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Libellé (ex: Cotisation annuelle)" className="px-3 py-2 rounded-lg border border-surface-200 text-sm" />
              <label className="flex items-center gap-1 text-sm text-surface-500">
                Dû
                <input type="number" min="0" value={newAmount} onChange={e => setNewAmount(e.target.value)} className="w-24 px-3 py-2 rounded-lg border border-surface-200 text-sm" />
              </label>
              <button onClick={() => addColumn(newLabel, newAmount)} className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-all">
                <Plus className="w-4 h-4" /> Ajouter
              </button>
              <button onClick={() => setShowAddForm(false)} className="flex items-center gap-1 px-3 py-2 rounded-xl border border-surface-200 text-surface-600 text-sm">
                <X className="w-4 h-4" /> Annuler
              </button>
            </div>
          )}
          {columns.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {columns.map(c => (
                <span key={c.label} className="inline-flex items-center gap-1 bg-white border border-surface-200 rounded-full px-3 py-1 text-xs text-surface-600">
                  {c.label} · {(dueAmounts[c.label] || 0).toLocaleString('fr-FR')} F
                </span>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {canEditCotisations && (
        <div className="mt-3 bg-surface-50 border border-surface-100 rounded-xl px-4 py-3 text-xs text-surface-500">
          <strong>Cotisation :</strong> le montant « Dû » est décidé par le trésorier. Saisissez par membre le montant réellement versé (les versements multiples s'accumulent dans le même montant payé). Une ligne vide vaut 0.
        </div>
      )}
    </motion.div>
  );
}
