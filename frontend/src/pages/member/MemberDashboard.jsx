import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, FileText, Users, Camera, BookOpen, Download, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import DocumentCard from '../../components/ui/DocumentCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../api/axios';
import { formatDate } from '../../utils/helpers';

const fadeInUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const quickActions = [
  { icon: FileText, label: 'Documents', path: '/espace-membre/documents', color: 'bg-blue-50 text-blue-600' },
  { icon: Users, label: 'Annuaire', path: '/espace-membre/annuaire', color: 'bg-green-50 text-green-600' },
  { icon: Camera, label: 'Médiathèque', path: '/espace-membre/mediatheque', color: 'bg-purple-50 text-purple-600' },
];

function MemberDashboard() {
  const { user, member } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get('/documents/');
        setDocuments((data.results || data).slice(0, 5));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-surface-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <LayoutDashboard className="w-8 h-8 text-primary-500" />
            <h1 className="text-3xl font-bold text-surface-900 font-[var(--font-display)]">Espace Membre</h1>
          </div>
          <p className="text-surface-500">Bienvenue, {user?.first_name || user?.username}</p>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="grid grid-cols-3 gap-4 mb-8">
          {quickActions.map((action) => (
            <motion.div key={action.label} variants={fadeInUp}>
              <Link to={action.path} className="block bg-white rounded-2xl p-6 border border-surface-100 hover:shadow-lg hover:border-primary-200 transition-all text-center group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${action.color} group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold text-surface-700">{action.label}</span>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
          <h2 className="text-xl font-bold text-surface-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-500" /> Derniers documents
          </h2>
          {loading ? <LoadingSpinner className="py-10" /> : documents.length > 0 ? (
            <div className="space-y-3">{documents.map((doc) => <DocumentCard key={doc.id} document={doc} showDownload />)}</div>
          ) : (
            <p className="text-surface-500 text-center py-10 bg-white rounded-2xl border border-surface-100">Aucun document disponible.</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default MemberDashboard;
