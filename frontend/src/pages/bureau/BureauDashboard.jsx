import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings, Users, Calendar, FileText, FolderOpen, Camera, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import MembersManager from './sections/MembersManager';
import EventsManager from './sections/EventsManager';
import DocumentsManager from './sections/DocumentsManager';
import FichiersManager from './sections/FichiersManager';
import GalleryManager from './sections/GalleryManager';

const fadeInUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const sections = [
  { key: '', label: 'Tableau de bord', icon: LayoutDashboard, path: '/espace-bureau' },
  { key: 'membres', label: 'Membres', icon: Users, path: '/espace-bureau/membres' },
  { key: 'evenements', label: 'Événements', icon: Calendar, path: '/espace-bureau/evenements' },
  { key: 'documents', label: 'Documents & PV', icon: FileText, path: '/espace-bureau/documents' },
  { key: 'fichiers', label: 'Fichiers', icon: FolderOpen, path: '/espace-bureau/fichiers' },
  { key: 'galerie', label: 'Galerie', icon: Camera, path: '/espace-bureau/galerie' },
];

function BureauDashboard() {
  const { user, member } = useAuth();
  const location = useLocation();
  const [stats, setStats] = useState({ members: 0, events: 0, documents: 0, gallery: 0 });
  const [loading, setLoading] = useState(true);

  const current = sections.find(s => s.key && location.pathname.endsWith('/' + s.key));
  const activeSection = current || sections[0];

  useEffect(() => {
    Promise.all([
      api.get('/members/').catch(() => ({ data: { count: 0 } })),
      api.get('/events/').catch(() => ({ data: { count: 0 } })),
      api.get('/documents/').catch(() => ({ data: { count: 0 } })),
      api.get('/gallery/').catch(() => ({ data: { count: 0 } })),
    ]).then(([m, e, d, g]) => {
      setStats({
        members: m.data.count || (m.data.results || m.data).length || 0,
        events: e.data.count || (e.data.results || e.data).length || 0,
        documents: d.data.count || (d.data.results || d.data).length || 0,
        gallery: g.data.count || (g.data.results || g.data).length || 0,
      });
    }).finally(() => setLoading(false));
  }, []);

  const showAdminSpaces = member?.role === 'admin';

  if (activeSection.key !== '') {
    return (
      <div className="min-h-screen bg-surface-50 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/espace-bureau" className="text-sm text-surface-500 hover:text-primary-500 flex items-center gap-1 mb-3"><ArrowLeft className="w-4 h-4" /> Retour au tableau de bord</Link>
          <div className="flex gap-2 overflow-x-auto mb-6 pb-1">
            {sections.map(s => (
              <Link key={s.key} to={s.path} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${s.key === activeSection.key ? 'bg-primary-500 text-white' : 'bg-white text-surface-600 hover:bg-surface-100 border border-surface-100'}`}>
                <s.icon className="w-4 h-4" />{s.label}
              </Link>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-surface-100 p-6">
            {activeSection.key === 'membres' && <MembersManager canRegister />}
            {activeSection.key === 'evenements' && <EventsManager />}
            {activeSection.key === 'documents' && <DocumentsManager />}
            {activeSection.key === 'fichiers' && <FichiersManager />}
            {activeSection.key === 'galerie' && <GalleryManager />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-primary-500" />
            <h1 className="text-3xl font-bold text-surface-900 font-[var(--font-display)]">Espace Bureau</h1>
          </div>
          <p className="text-surface-500">Administration de l'association - {user?.first_name || user?.username}</p>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Membres', value: stats.members, icon: Users, color: 'text-blue-600 bg-blue-50' },
            { label: 'Événements', value: stats.events, icon: Calendar, color: 'text-green-600 bg-green-50' },
            { label: 'Documents', value: stats.documents, icon: FileText, color: 'text-purple-600 bg-purple-50' },
            { label: 'Médias', value: stats.gallery, icon: Camera, color: 'text-orange-600 bg-orange-50' },
          ].map(stat => (
            <motion.div key={stat.label} variants={fadeInUp} className="bg-white rounded-2xl p-5 border border-surface-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}><stat.icon className="w-5 h-5" /></div>
                <div>
                  <div className="text-2xl font-bold text-surface-900">{loading ? '...' : stat.value}</div>
                  <div className="text-xs text-surface-500">{stat.label}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
          <h2 className="text-xl font-bold text-surface-900 mb-4">Administration</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sections.filter(s => s.key !== '').map(s => (
              <motion.div key={s.key} variants={fadeInUp}>
                <Link to={s.path} className="block bg-white rounded-2xl p-6 border border-surface-100 hover:shadow-lg hover:border-primary-200 transition-all group">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-primary-50 text-primary-600 group-hover:scale-110 transition-transform"><s.icon className="w-6 h-6" /></div>
                  <h3 className="font-bold text-surface-900 mb-1">{s.label}</h3>
                  <p className="text-sm text-surface-500">Gérer cette section</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {showAdminSpaces && (
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="mt-8">
            <h2 className="text-xl font-bold text-surface-900 mb-4">Accès aux espaces spécialisés</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Link to="/espace-secretaire" className="block bg-gradient-to-br from-primary-700 to-primary-900 text-white rounded-2xl p-6 hover:opacity-95 transition-all">
                <h3 className="font-bold text-lg mb-1">Espace Secrétaire</h3>
                <p className="text-sm text-white/80">Messages, membres, présences, documents</p>
              </Link>
              <Link to="/espace-tresorier" className="block bg-gradient-to-br from-emerald-700 to-emerald-900 text-white rounded-2xl p-6 hover:opacity-95 transition-all">
                <h3 className="font-bold text-lg mb-1">Espace Trésorier</h3>
                <p className="text-sm text-white/80">Comptabilité, cotisations, exports</p>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default BureauDashboard;
