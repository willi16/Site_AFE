import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, ClipboardCheck, HandCoins } from 'lucide-react';
import api from '../../../api/axios';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { useAuth } from '../../../context/AuthContext';
import { showError, showLoading, closeLoading, extractError } from '../../../utils/swal';
import PresenceCotisationSheet from './PresenceCotisationSheet';

const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const MONTHLY_TITLE = 'Assemblée mensuelle — dernier dimanche';

const lastSundayOfMonth = (year, month) => {
  const last = new Date(Date.UTC(year, month, 0));
  last.setUTCDate(last.getUTCDate() - last.getUTCDay());
  return last;
};

export default function TresorierPresenceCotisations() {
  const { isTreasurer, isAdmin } = useAuth();
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedEventTitle, setSelectedEventTitle] = useState('');
  const [selectedEventMonthly, setSelectedEventMonthly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/events/', { params: { page_size: 50 } }).catch(() => ({ data: { results: [] } })),
      api.get('/members/directory/').catch(() => ({ data: [] })),
    ]).then(([e, m]) => {
      setEvents(e.data.results || e.data || []);
      setMembers(m.data.results || m.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

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
          is_monthly_assembly: true,
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
    setSelectedEvent(String(ev.id));
    setSelectedEventTitle(`${MONTHLY_TITLE} (${dateStr})`);
    setSelectedEventMonthly(!!(ev && ev.is_monthly_assembly));
  };

  const selectExisting = (e) => {
    const id = e.target.value;
    if (!id) { setSelectedEvent(''); return; }
    const ev = events.find(x => String(x.id) === String(id));
    if (!ev) return;
    setSelectedEvent(String(ev.id));
    setSelectedEventTitle(ev.title || '');
    setSelectedEventMonthly(!!ev.is_monthly_assembly);
  };

  if (loading) return <LoadingSpinner className="py-10" />;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <HandCoins className="w-5 h-5 text-emerald-500" />
        <h2 className="text-xl font-bold text-surface-900">Présence + Cotisations (trésorier)</h2>
      </div>

      <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="bg-white rounded-2xl border border-surface-100 p-5 mb-6 flex flex-wrap items-center gap-3">
        <CalendarDays className="w-5 h-5 text-emerald-500" />
        <input
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-surface-200 text-sm"
        />
        <button onClick={openMonthly} className="flex items-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-all">
          <CalendarDays className="w-4 h-4" /> Ouvrir l'assemblée du dernier dimanche
        </button>
        <div className="w-full sm:w-auto flex items-center gap-2">
          <span className="text-sm text-surface-500">ou</span>
          <select
            value={selectedEvent}
            onChange={selectExisting}
            className="px-4 py-2.5 rounded-xl border border-surface-200 text-sm"
          >
            <option value="">— Sélectionner un événement existant —</option>
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>
                {ev.title}{ev.is_monthly_assembly ? ' (assemblée mensuelle)' : ''} — {(ev.event_date || '').slice(0, 10)}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-surface-500 w-full mt-1 flex items-center gap-1">
          <ClipboardCheck className="w-3.5 h-3.5" /> Relevez en une seule feuille la présence et les cotisations pour l'événement choisi.
        </p>
      </motion.div>

      {!selectedEvent ? (
        <div className="bg-white rounded-2xl border border-surface-100 p-8 text-center text-surface-500">
          <HandCoins className="w-10 h-10 text-surface-300 mx-auto mb-3" />
          <p>Choisissez un événement : utilisez « Ouvrir l'assemblée du dernier dimanche » pour l'assemblée mensuelle, ou sélectionnez un événement existant dans la liste, puis relevez présence et cotisations.</p>
        </div>
      ) : (
        <PresenceCotisationSheet
          members={members}
          eventId={selectedEvent}
          eventTitle={selectedEventTitle || MONTHLY_TITLE}
          isMonthlyAssembly={selectedEventMonthly}
          withPresence
          canEdit
          canEditCotisations={isTreasurer || isAdmin}
        />
      )}
    </div>
  );
}
