import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ClipboardCheck, Calendar, CalendarDays } from 'lucide-react';
import api from '../../../api/axios';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { useAuth } from '../../../context/AuthContext';
import { showError, showLoading, closeLoading, extractError } from '../../../utils/swal';
import PresenceCotisationSheet from './PresenceCotisationSheet';

const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const MONTHLY_TITLE = 'Assemblée mensuelle — dernier dimanche';

// Renvoie la date du dernier dimanche du mois (mois 1-based de "YYYY-MM")
const lastSundayOfMonth = (year, month) => {
  const last = new Date(Date.UTC(year, month, 0));
  last.setUTCDate(last.getUTCDate() - last.getUTCDay());
  return last;
};

export default function PresencesManager() {
  const { isSecretary, isAdmin, isTreasurer } = useAuth();
  const [mode, setMode] = useState('event');
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [cotisationLabels, setCotisationLabels] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedEventTitle, setSelectedEventTitle] = useState('');
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/events/', { params: { page_size: 50 } }).catch(() => ({ data: { results: [] } })),
      api.get('/members/directory/').catch(() => ({ data: [] })),
      api.get('/cotisations/', { params: { page_size: 500 } }).catch(() => ({ data: { results: [] } })),
    ]).then(([e, m, c]) => {
      setEvents((e.data.results || e.data || []).filter(ev => ev.status === 'upcoming' || ev.status === 'past'));
      setMembers(m.data.results || m.data || []);
      const rows = c.data.results || c.data || [];
      const labels = [...new Set(rows.map(r => r.label))];
      setCotisationLabels(labels);
    }).finally(() => setLoading(false));
  }, []);

  const onSelectEvent = (val) => {
    setSelectedEvent(val);
    const ev = events.find(e => String(e.id) === String(val));
    setSelectedEventTitle(ev ? `${ev.title} (${ev.event_date?.slice(0, 10)})` : '');
  };

  const openMonthly = async () => {
    if (!month) return;
    const [y, m] = month.split('-').map(Number);
    const sunday = lastSundayOfMonth(y, m);
    const dateStr = sunday.toISOString().slice(0, 10);
    let ev = events.find(e => e.event_date?.slice(0, 10) === dateStr && /Assemblée mensuelle/i.test(e.title));
    if (!ev) {
      showLoading('Préparation de l\'assemblée mensuelle...');
      try {
        const { data } = await api.post('/events/', {
          title: MONTHLY_TITLE,
          short_description: MONTHLY_TITLE,
          description: `Assemblée mensuelle de l'association du ${sunday.toLocaleDateString('fr-FR')}. Présence et cotisations relevées.`,
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
    onSelectEvent(String(ev.id));
  };

  const canEditPresence = isSecretary || isAdmin || isTreasurer;
  const canEditCotisations = isTreasurer || isAdmin;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-surface-900 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-primary-500" /> Feuille de présence & cotisations
        </h2>
      </div>

      <div className="flex gap-2 mb-5">
        <button
          onClick={() => { setMode('event'); onSelectEvent(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${mode === 'event' ? 'bg-primary-500 text-white' : 'bg-white border border-surface-200 text-surface-600 hover:bg-surface-100'}`}
        >
          <Calendar className="w-4 h-4" /> Par événement
        </button>
        <button
          onClick={() => { setMode('monthly'); onSelectEvent(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${mode === 'monthly' ? 'bg-primary-500 text-white' : 'bg-white border border-surface-200 text-surface-600 hover:bg-surface-100'}`}
        >
          <CalendarDays className="w-4 h-4" /> Assemblée mensuelle
        </button>
      </div>

      <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="bg-white rounded-2xl border border-surface-100 p-5 mb-6 flex flex-wrap items-center gap-3">
        {mode === 'event' ? (
          <>
            <Calendar className="w-5 h-5 text-surface-400" />
            <select value={selectedEvent} onChange={e => onSelectEvent(e.target.value)} className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl border border-surface-200 text-sm">
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
              onChange={e => setMonth(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-surface-200 text-sm"
            />
            <button onClick={openMonthly} className="flex items-center gap-2 bg-primary-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-all">
              <CalendarDays className="w-4 h-4" /> Ouvrir le dernier dimanche
            </button>
            <p className="text-xs text-surface-500 w-full mt-1">
              Feuille combinée <strong>présence + cotisations</strong> pour <strong>le dernier dimanche du mois choisi</strong> (réunion mensuelle de l'association).
            </p>
          </>
        )}
      </motion.div>

      {loading ? <LoadingSpinner className="py-10" /> : !selectedEvent ? (
        <p className="text-surface-500 text-center py-10">
          {mode === 'monthly'
            ? 'Choisissez un mois puis cliquez sur « Ouvrir le dernier dimanche ».'
            : 'Sélectionnez un événement pour ouvrir la feuille de présence et de cotisations.'}
        </p>
      ) : (
        <PresenceCotisationSheet
          members={members}
          eventId={selectedEvent}
          eventTitle={selectedEventTitle || (mode === 'monthly' ? MONTHLY_TITLE : '')}
          labels={cotisationLabels}
          withPresence
          canEdit={canEditPresence}
          canEditCotisations={canEditCotisations}
        />
      )}
    </div>
  );
}
