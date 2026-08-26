import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings, Users, FileText, DollarSign, Calendar, Mail, Upload, BarChart3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../api/axios';

const fadeInUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const adminActions = [
  { icon: Users, label: 'Gestion des Membres', description: 'Gérer les adhérents et les statuts', path: '/espace-bureau/membres', color: 'bg-blue-50 text-blue-600' },
  { icon: Calendar, label: 'Gestion des Événements', description: 'Créer et modifier les événements', path: '/espace-bureau/evenements', color: 'bg-green-50 text-green-600' },
  { icon: FileText, label: 'Documents & PV', description: 'Gérer les documents et procès-verbaux', path: '/espace-bureau/documents', color: 'bg-purple-50 text-purple-600' },
  { icon: DollarSign, label: 'Comptabilité', description: 'Suivi financier de l\'association', path: '/espace-bureau/comptabilite', color: 'bg-orange-50 text-orange-600' },
  { icon: Upload, label: 'Fichiers', description: 'Upload de bilans et justificatifs', path: '/espace-bureau/fichiers', color: 'bg-red-50 text-red-600' },
  { icon: Mail, label: 'Messages', description: 'Consulter les messages de contact', path: '/espace-bureau/messages', color: 'bg-teal-50 text-teal-600' },
];

function BureauDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ members: 0, events: 0, documents: 0, messages: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [members, events, docs, messages] = await Promise.all([
          api.get('/members/').catch(() => ({ data: { count: 0 } })),
          api.get('/events/').catch(() => ({ data: { count: 0 } })),
          api.get('/documents/').catch(() => ({ data: { count: 0 } })),
          api.get('/contact/').catch(() => ({ data: { count: 0 } })),
        ]);
        setStats({
          members: members.data.count || (members.data.results || members.data).length || 0,
          events: events.data.count || (events.data.results || events.data).length || 0,
          documents: docs.data.count || (docs.data.results || docs.data).length || 0,
          messages: messages.data.count || (messages.data.results || messages.data).length || 0,
        });
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-surface-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-primary-500" />
            <h1 className="text-3xl font-bold text-surface-900 font-[var(--font-display)]">Espace Bureau</h1>
          </div>
          <p className="text-surface-500">Tableau de bord administrateur - {user?.first_name || user?.username}</p>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Membres', value: stats.members, icon: Users, color: 'text-blue-600 bg-blue-50' },
            { label: 'Événements', value: stats.events, icon: Calendar, color: 'text-green-600 bg-green-50' },
            { label: 'Documents', value: stats.documents, icon: FileText, color: 'text-purple-600 bg-purple-50' },
            { label: 'Messages', value: stats.messages, icon: Mail, color: 'text-orange-600 bg-orange-50' },
          ].map((stat) => (
            <motion.div key={stat.label} variants={fadeInUp} className="bg-white rounded-2xl p-5 border border-surface-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-surface-900">{loading ? '...' : stat.value}</div>
                  <div className="text-xs text-surface-500">{stat.label}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
          <h2 className="text-xl font-bold text-surface-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-500" /> Actions rapides
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminActions.map((action) => (
              <motion.div key={action.label} variants={fadeInUp}>
                <Link to={action.path} className="block bg-white rounded-2xl p-6 border border-surface-100 hover:shadow-lg hover:border-primary-200 transition-all group">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${action.color} group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-surface-900 mb-1">{action.label}</h3>
                  <p className="text-sm text-surface-500">{action.description}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default BureauDashboard;
