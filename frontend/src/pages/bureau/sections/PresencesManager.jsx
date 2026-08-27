import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ClipboardCheck, Save, Calendar, CalendarDays } from 'lucide-react';
import api from '../../../api/axios';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { confirmAction, showSuccess, showError, showLoading, closeLoading, extractError } from '../../../utils/swal';

const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const STATUS_LABELS = {
  present: 'Présent',
  absent: 'Absent non justifié',
  excuse: 'Absent justifié',
};

const MONTHLY_TITLE = 'Assemblée mensuelle — dernier dimanche';

// Renvoie la date du dernier dimanche du mois (mois 1-based de "YYYY-MM")
const lastSundayOfMonth = (year, month) => {
  const last = new Date(Date.UTC(year, month, 0));
  last.setUTCDate(last.getUTCDate() - last.getUTCDay());
  return last;
};

export default function PresencesManager() {
  const [mode, setMode] = useState('event');
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [monthlyLabel, setMonthlyLabel] = useState('');
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/events/', { params: { page_size: 50 } }).catch(() => ({ data: { results: [] } })),
      api.get('/members/directory/').catch(() => ({ data: [] })),
    ]).then(([e, m]) => {
      setEvents((e.data.results || e.data || []).filter(ev => ev.status === 'upcoming' || ev.status === 'past'));
      setMembers(m.data.results || m.data || []);
      if (m.data.results || m.data) {
        const init = {};
        ((m.data.results || m.data) || []).forEach(mem => init[mem.id] = 'present');
        setStatuses(init);
      }
    }).finally(() => setLoading(false));
  }, []);

  const loadAttendance = useCallback(async () => {
    if (!selectedEvent) { return; }
    try {
      const { data } = await api.get('/attendances/', { params: { event: selectedEvent, page_size: 100 } });
      const rows = data.results || data || [];
      const map = {};
      rows.forEach(r => { map[r.member] = r.status; });
      setStatuses(prev => ({ ...prev, ...map }));
    } catch (e) { console.error(e); }
  }, [selectedEvent]);

  useEffect(() => { if (selectedEvent) loadAttendance(); }, [selectedEvent, loadAttendance]);

  const selectedLabel = () => {
    const found = events.find(e => String(e.id) === String(selectedEvent));
    if (found) return `${found.title} (${found.event_date?.slice(0, 10)})`;
    return monthlyLabel || '';
  };

  const openMonthly = async () => {
    if (!month) return;
    const [y, m] = month.split('-').map(Number);
    const sunday = lastSundayOfMonth(y, m);
    const dateStr = sunday.toISOString().slice(0, 10);
    let ev = events.find(e => e.event_date?.slice(0, 10) === dateStr && /Assemblée mensuelle/i.test(e.title) && String(e.id) === String(selectedEvent));
    if (!ev) {
      ev = events.find(e => e.event_date?.slice(0, 10) === dateStr && /Assemblée mensuelle/i.test(e.title));
    }
    if (!ev) {
      showLoading('Préparation de l\'assemblée mensuelle...');
      try {
        const { data } = await api.post('/events/', {
          title: MONTHLY_TITLE,
          short_description: MONTHLY_TITLE,
          description: `Assemblée mensuelle de l'association du ${sunday.toLocaleDateString('fr-FR')}. La présence de chaque membre sera relevée.`,
          event_date: sunday.toISOString(),
          location: "Salle de réunion de l'association",
          status: 'upcoming',
          is_published: true,
        });
        closeLoading();
        ev = data;
        setEvents(prev => [data, ...prev]);
      } catch (err) {
        closeLoading();
        showError('Échec', extractError(err, 'Impossible de préparer l\'assemblée mensuelle.'));
        return;
      }
    }
    setMonthlyLabel(MONTHLY_TITLE);
    setSelectedEvent(String(ev.id));
  };

  const handleSave = async () => {
    if (!selectedEvent) { showError('Aucune réunion', 'Veuillez d\'abord ouvrir une feuille de présence.'); return; }
    const ok = await confirmAction(
      'Enregistrer les présences ?',
      `Les présences de ${members.length} membres seront enregistrées pour ${selectedLabel()}.`,
      { icon: 'question', confirmText: 'Oui, enregistrer' }
    );
    if (!ok.isConfirmed) return;
    setSaving(true);
    showLoading('Enregistrement des présences...');
    let updated = 0;
    try {
      for (const m of members) {
        const status = statuses[m.id] || 'present';
        await api.post('/attendances/', { event: selectedEvent, member: m.id, status, event_title: events.find(e => String(e.id) === String(selectedEvent))?.title || '' });
        updated++;
      }
      closeLoading();
      showSuccess(`${updated} présences enregistrées`);
    } catch (err) {
      try {
        const { data } = await api.get('/attendances/', { params: { event: selectedEvent, page_size: 100 } });
        const rows = data.results || data || [];
        const existing = {};
        rows.forEach(r => existing[r.member] = r.id);
        for (const m of members) {
          const status = statuses[m.id] || 'present';
          const id = existing[m.id];
          if (id) await api.patch(`/attendances/${id}/`, { status });
          else await api.post('/attendances/', { event: selectedEvent, member: m.id, status });
          updated++;
        }
        closeLoading();
        showSuccess(`${updated} présences enregistrées`);
      } catch (e2) { closeLoading(); console.error(e2); showError('Erreur', extractError(e2, 'Erreur lors de l\'enregistrement des présences.')); }
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-surface-900 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-primary-500" /> Feuille de présence
        </h2>
      </div>

      <div className="flex gap-2 mb-5">
        <button
          onClick={() => { setMode('event'); setSelectedEvent(''); setMonthlyLabel(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${mode === 'event' ? 'bg-primary-500 text-white' : 'bg-white border border-surface-200 text-surface-600 hover:bg-surface-100'}`}
        >
          <Calendar className="w-4 h-4" /> Par événement
        </button>
        <button
          onClick={() => { setMode('monthly'); setSelectedEvent(''); setMonthlyLabel(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${mode === 'monthly' ? 'bg-primary-500 text-white' : 'bg-white border border-surface-200 text-surface-600 hover:bg-surface-100'}`}
        >
          <CalendarDays className="w-4 h-4" /> Assemblée mensuelle
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-surface-100 p-5 mb-6 flex flex-wrap items-center gap-3">
        {mode === 'event' ? (
          <>
            <Calendar className="w-5 h-5 text-surface-400" />
            <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)} className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl border border-surface-200 text-sm">
              <option value="">Sélectionner un événement</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title} ({ev.event_date?.slice(0,10)})</option>)}
            </select>
          </>
        ) : (
          <>
            <CalendarDays className="w-5 h-5 text-emerald-500" />
            <input
              type="month"
              value={month}
              onChange={e => { setMonth(e.target.value); setSelectedEvent(''); setMonthlyLabel(''); }}
              className="px-4 py-2.5 rounded-xl border border-surface-200 text-sm"
            />
            <button onClick={openMonthly} className="flex items-center gap-2 bg-primary-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-all">
              <CalendarDays className="w-4 h-4" /> Ouvrir le dernier dimanche
            </button>
            <p className="text-xs text-surface-500 w-full mt-1">
              La feuille de présence sera préparée pour <strong>le dernier dimanche du mois choisi</strong> (réunion mensuelle de l'association).
            </p>
          </>
        )}
        <button onClick={handleSave} disabled={!selectedEvent || saving} className="flex items-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 transition-all">
          <Save className="w-4 h-4" /> {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      {selectedEvent && monthlyLabel && (
        <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium flex items-center gap-2">
          <CalendarDays className="w-4 h-4" /> Réunion mensuelle en cours : {selectedLabel()}
        </div>
      )}

      <div className="mb-4 grid grid-cols-3 gap-2 max-w-md text-xs">
        {Object.entries(STATUS_LABELS).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5 text-surface-500"><span className={`w-3 h-3 rounded-full ${k === 'present' ? 'bg-emerald-500' : k === 'excuse' ? 'bg-amber-500' : 'bg-red-500'}`} />{v}</div>
        ))}
      </div>

      {loading ? <LoadingSpinner className="py-10" /> : (
        <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
          {!selectedEvent ? (
            <p className="text-surface-500 text-center py-10">
              {mode === 'monthly'
                ? 'Choisissez un mois puis cliquez sur « Ouvrir le dernier dimanche » pour préparer la réunion mensuelle.'
                : 'Sélectionnez un événement pour ouvrir la feuille de présence.'}
            </p>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead className="bg-surface-50 text-surface-500 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Membre</th>
                    <th className="px-4 py-3 font-semibold">Statut de présence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {members.map(m => (
                    <tr key={m.id} className="hover:bg-surface-50">
                      <td className="px-4 py-3 font-medium text-surface-800">{m.full_name}</td>
                      <td className="px-4 py-3">
                        <select
                          value={statuses[m.id] || 'absent'}
                          onChange={e => setStatuses({ ...statuses, [m.id]: e.target.value })}
                          className="px-3 py-2 rounded-lg border border-surface-200 text-sm"
                        >
                          <option value="present">Présent</option>
                          <option value="absent">Absent non justifié</option>
                          <option value="excuse">Absent justifié</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-3 bg-surface-50 text-xs text-surface-500">
                <strong>Règlement :</strong> 3 absences non justifiées consécutives peuvent entraîner une convocation du bureau. Une absence justifiée (justificatif fourni) est tolérée.
                {mode === 'monthly' && <span className="block mt-1 text-emerald-700"><strong>Réunion mensuelle :</strong> l'assemblée a lieu le dernier dimanche de chaque mois. La présence y est obligatoire.</span>}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
