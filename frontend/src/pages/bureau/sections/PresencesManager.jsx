import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ClipboardCheck, Save, Calendar, X } from 'lucide-react';
import api from '../../../api/axios';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const STATUS_LABELS = {
  present: 'Présent',
  absent: 'Absent non justifié',
  excuse: 'Absent justifié',
};

export default function PresencesManager() {
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
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

  const handleSave = async () => {
    if (!selectedEvent) return;
    setSaving(true);
    let updated = 0;
    try {
      for (const m of members) {
        const status = statuses[m.id] || 'present';
        await api.post('/attendances/', { event: selectedEvent, member: m.id, status, event_title: events.find(e => String(e.id) === String(selectedEvent))?.title || '' });
        updated++;
      }
      toast.success(`${updated} présences enregistrées`);
    } catch (err) {
      // Individual records may be unique-per-event; try PATCH or ignore
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
        }
        toast.success(`${updated} présences enregistrées`);
      } catch (e2) { console.error(e2); toast.error('Erreur lors de l\'enregistrement'); }
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-surface-900 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-primary-500" /> Feuille de présence
        </h2>
      </div>

      <div className="bg-white rounded-2xl border border-surface-100 p-5 mb-6 flex flex-wrap items-center gap-3">
        <Calendar className="w-5 h-5 text-surface-400" />
        <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)} className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl border border-surface-200 text-sm">
          <option value="">Sélectionner un événement</option>
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title} ({ev.event_date?.slice(0,10)})</option>)}
        </select>
        <button onClick={handleSave} disabled={!selectedEvent || saving} className="flex items-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 transition-all">
          <Save className="w-4 h-4" /> {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2 max-w-md text-xs">
        {Object.entries(STATUS_LABELS).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5 text-surface-500"><span className={`w-3 h-3 rounded-full ${k === 'present' ? 'bg-emerald-500' : k === 'excuse' ? 'bg-amber-500' : 'bg-red-500'}`} />{v}</div>
        ))}
      </div>

      {loading ? <LoadingSpinner className="py-10" /> : (
        <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
          {!selectedEvent ? (
            <p className="text-surface-500 text-center py-10">Sélectionnez un événement pour ouvrir la feuille de présence.</p>
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
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
