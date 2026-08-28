import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Users, ClipboardCheck, FileText, FolderOpen, Camera, ArrowLeft, LayoutDashboard, PenTool, CalendarDays, Newspaper, HandCoins } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import MessagesEditor from './sections/MessagesEditor';
import MembersManager from './sections/MembersManager';
import PresencesManager from './sections/PresencesManager';
import DocumentsManager from './sections/DocumentsManager';
import FichiersManager from './sections/FichiersManager';
import GalleryManager from './sections/GalleryManager';
import EventsManager from './sections/EventsManager';
import ActualitesManager from './sections/ActualitesManager';
import DonationsManager from './sections/DonationsManager';

const fadeInUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const sections = [
  { key: '', label: 'Tableau de bord', icon: LayoutDashboard, path: '/espace-secretaire' },
  { key: 'messages', label: 'Messages', icon: Mail, path: '/espace-secretaire/messages' },
  { key: 'agenda', label: 'Agenda', icon: CalendarDays, path: '/espace-secretaire/agenda' },
  { key: 'membres', label: 'Membres', icon: Users, path: '/espace-secretaire/membres' },
  { key: 'presences', label: 'Présences', icon: ClipboardCheck, path: '/espace-secretaire/presences' },
  { key: 'actualites', label: 'Actualités', icon: Newspaper, path: '/espace-secretaire/actualites' },
  { key: 'dons', label: 'Dons & Notifications', icon: HandCoins, path: '/espace-secretaire/dons' },
  { key: 'documents', label: 'Documents & PV', icon: FileText, path: '/espace-secretaire/documents' },
  { key: 'fichiers', label: 'Fichiers', icon: FolderOpen, path: '/espace-secretaire/fichiers' },
  { key: 'galerie', label: 'Galerie', icon: Camera, path: '/espace-secretaire/galerie' },
];

function SecretaryDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [stats, setStats] = useState({ members: 0, messages: 0, documents: 0, gallery: 0 });
  const [loading, setLoading] = useState(true);

  const current = sections.find(s => s.key && location.pathname.endsWith(s.key));
  const activeSection = current || sections[0];

  useEffect(() => {
    Promise.all([
      api.get('/members/').catch(() => ({ data: { count: 0 } })),
      api.get('/contact/').catch(() => ({ data: { count: 0 } })),
      api.get('/documents/').catch(() => ({ data: { count: 0 } })),
      api.get('/gallery/').catch(() => ({ data: { count: 0 } })),
    ]).then(([m, msg, d, g]) => {
      setStats({
        members: m.data.count || 0,
        messages: msg.data.count || 0,
        documents: d.data.count || 0,
        gallery: g.data.count || 0,
      });
    }).finally(() => setLoading(false));
  }, []);

  if (activeSection.key !== '') {
    return (
      <div className="min-h-screen bg-surface-50 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/espace-secretaire" className="text-sm text-surface-500 hover:text-primary-500 flex items-center gap-1 mb-3"><ArrowLeft className="w-4 h-4" /> Retour au tableau de bord</Link>
          <div className="flex gap-2 overflow-x-auto mb-6 pb-1">
            {sections.map(s => (
              <Link key={s.key} to={s.path} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${s.key === activeSection.key ? 'bg-primary-500 text-white' : 'bg-white text-surface-600 hover:bg-surface-100 border border-surface-100'}`}>
                <s.icon className="w-4 h-4" />{s.label}
              </Link>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-surface-100 p-6">
            {activeSection.key === 'messages' && <MessagesEditor />}
            {activeSection.key === 'agenda' && <EventsManager />}
            {activeSection.key === 'membres' && <MembersManager />}
            {activeSection.key === 'presences' && <PresencesManager />}
            {activeSection.key === 'actualites' && <ActualitesManager />}
            {activeSection.key === 'dons' && <DonationsManager />}
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
            <PenTool className="w-8 h-8 text-primary-500" />
            <h1 className="text-3xl font-bold text-surface-900 font-[var(--font-display)]">Espace Secrétaire</h1>
          </div>
          <p className="text-surface-500">Gestion du secrétariat - {user?.first_name || user?.username}</p>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Membres', value: stats.members, icon: Users, color: 'text-blue-600 bg-blue-50' },
            { label: 'Messages', value: stats.messages, icon: Mail, color: 'text-teal-600 bg-teal-50' },
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

        <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
          <h2 className="text-xl font-bold text-surface-900 mb-4">Tableau de bord du secrétariat</h2>
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
      </div>
    </div>
  );
}

export default SecretaryDashboard;
