import { useState, useEffect, useCallback } from 'react';
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
  const [cotisationLabels, setCotisationLabels] = useState([]);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedEventTitle, setSelectedEventTitle] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [e, m, c] = await Promise.all([
        api.get('/events/', { params: { page_size: 50 } }).catch(() => ({ data: { results: [] } })),
        api.get('/members/directory/').catch(() => ({ data: [] })),
        api.get('/cotisations/', { params: { page_size: 500 } }).catch(() => ({ data: { results: [] } })),
      ]);
      setEvents(e.data.results || e.data || []);
      setMembers(m.data.results || m.data || []);
      const rows = c.data.results || c.data || [];
      setCotisationLabels([...new Set(rows.map(r => r.label))]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

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
    setSelectedEvent(String(ev.id));
    setSelectedEventTitle(`${MONTHLY_TITLE} (${dateStr})`);
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
        <p className="text-xs text-surface-500 w-full mt-1 flex items-center gap-1">
          <ClipboardCheck className="w-3.5 h-3.5" /> Relevez en une seule feuille : la <strong>présence</strong> et la <strong>cotisation mensuelle</strong> (obligatoire) de chaque membre pour l'assemblée du mois.
        </p>
      </motion.div>

      {!selectedEvent ? (
        <div className="bg-white rounded-2xl border border-surface-100 p-8 text-center text-surface-500">
          <HandCoins className="w-10 h-10 text-surface-300 mx-auto mb-3" />
          <p>Choisissez un mois puis cliquez sur « Ouvrir l'assemblée du dernier dimanche » pour relever présence et cotisations ensemble.</p>
        </div>
      ) : (
        <PresenceCotisationSheet
          members={members}
          eventId={selectedEvent}
          eventTitle={selectedEventTitle || MONTHLY_TITLE}
          labels={cotisationLabels}
          withPresence
          canEdit
          canEditCotisations={isTreasurer || isAdmin}
        />
      )}
    </div>
  );
}
