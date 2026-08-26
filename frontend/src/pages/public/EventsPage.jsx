import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Filter } from 'lucide-react';
import SectionHeader from '../../components/ui/SectionHeader';
import EventCard from '../../components/ui/EventCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useEvents } from '../../hooks/useEvents';

const fadeInUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const defaultEvents = [
  { id: 1, title: 'Gala de la Fraternité 2026', short_description: 'Soirée de gala réunissant tous les membres et partenaires.', event_date: '2026-09-15T19:00:00Z', location: 'Palais des Congrès', status: 'upcoming' },
  { id: 2, title: 'Journée Portes Ouvertes', short_description: 'Découvrez nos activités et rencontrez les bénévoles.', event_date: '2026-10-05T10:00:00Z', location: 'Siège de l\'AFE', status: 'upcoming' },
  { id: 3, title: 'Atelier Entraide Solidaire', short_description: 'Participez à notre atelier pratique dédié à l\'entraide.', event_date: '2026-10-20T14:00:00Z', location: 'Centre Communautaire', status: 'upcoming' },
  { id: 4, title: 'Fête de l\'Entraide 2026', short_description: 'Célébration annuelle de notre communauté avecanimations etactivités.', event_date: '2026-07-10T10:00:00Z', location: 'Parc Municipal', status: 'past' },
  { id: 5, title: 'Collecte de Don Solidaires', short_description: 'Opération de collecte de vêtements et denrées alimentaires.', event_date: '2026-05-15T09:00:00Z', location: 'Centre Social', status: 'past' },
];

function EventsPage() {
  const [filter, setFilter] = useState('all');
  const { events: apiEvents, loading } = useEvents();
  const events = apiEvents.length > 0 ? apiEvents : defaultEvents;
  const filtered = filter === 'all' ? events : events.filter(e => e.status === filter);

  return (
    <div className="pt-20">
      <section className="relative py-24 bg-gradient-to-br from-primary-800 to-primary-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10"><div className="absolute top-20 right-20 w-64 h-64 bg-accent-500 rounded-full blur-3xl" /></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="max-w-2xl">
            <span className="text-accent-400 font-bold text-sm uppercase tracking-widest">Vie Associative</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mt-3 mb-6 font-[var(--font-display)]">Agenda</h1>
            <p className="text-lg text-white/70">Retrouvez tous nos événements passés et à venir.</p>
          </motion.div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          <div className="flex flex-wrap gap-3 mb-10">
            {[{ key: 'all', label: 'Tous' }, { key: 'upcoming', label: 'À venir' }, { key: 'past', label: 'Passés' }].map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${filter === f.key ? 'bg-primary-500 text-white shadow-lg' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}>
                <Filter className="w-4 h-4 inline mr-2" />{f.label}
              </button>
            ))}
          </div>
          {loading ? <LoadingSpinner className="py-20" /> : (
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="grid md:grid-cols-3 gap-6">
              {filtered.map((event) => (
                <motion.div key={event.id} variants={fadeInUp}><EventCard event={event} /></motion.div>
              ))}
            </motion.div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-20"><Calendar className="w-12 h-12 text-surface-300 mx-auto mb-4" /><p className="text-surface-500">Aucun événement trouvé.</p></div>
          )}
        </div>
      </section>
    </div>
  );
}

export default EventsPage;
