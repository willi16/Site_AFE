import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings, Users, FileText, DollarSign, Calendar, Mail, Upload, BarChart3, Send, ArrowLeft, Eye, Reply } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../api/axios';

const fadeInUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const adminActions = [
  { icon: Users, label: 'Gestion des Membres', description: 'Gérer les adhérents et les statuts', path: '/espace-bureau/membres', color: 'bg-blue-50 text-blue-600' },
  { icon: Calendar, label: 'Gestion des Événements', description: 'Créer et modifier les événements', path: '/espace-bureau/evenements', color: 'bg-green-50 text-green-600' },
  { icon: FileText, label: 'Documents & PV', description: 'Gérer les documents et procès-verbaux', path: '/espace-bureau/documents', color: 'bg-purple-50 text-purple-600' },
  { icon: Upload, label: 'Fichiers', description: 'Upload de bilans et justificatifs', path: '/espace-bureau/fichiers', color: 'bg-red-50 text-red-600' },
  { icon: Mail, label: 'Messages', description: 'Consulter et répondre aux messages', path: '/espace-bureau/messages', color: 'bg-teal-50 text-teal-600' },
];

const treasurerActions = [
  { icon: DollarSign, label: 'Comptabilité', description: 'Suivi financier de l\'association', path: '/espace-bureau/comptabilite', color: 'bg-orange-50 text-orange-600' },
];

function MessagesEditor() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [members, setMembers] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/contact/').then(({ data }) => setMessages(data.results || data || [])).catch(() => {}),
      api.get('/members/').then(({ data }) => setMembers(data.results || data || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const loadMessages = () => {
    api.get('/contact/').then(({ data }) => setMessages(data.results || data || [])).catch(() => {});
  };

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      await api.post('/contact/', { full_name: user?.first_name || '', email: 'associationfe@gmail.com', subject: 'other' || 'info', message: `${subject}\n\n${body}` });
      setRecipient(''); setSubject(''); setBody(''); setShowEditor(false);
    } catch (err) { console.error(err); }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!selected || !reply.trim()) return;
    try {
      await api.post('/contact/', { full_name: 'AFE Bureau', email: 'associationfe@gmail.com', subject: 'info', message: `Réponse à ${selected.full_name} (${selected.email}):\n\n${reply}` });
      setReply(''); setSelected(null);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="bg-white rounded-2xl border border-surface-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-surface-900 flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary-500" /> Messages
        </h2>
        <button onClick={() => setShowEditor(!showEditor)} className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-all">
          <Send className="w-4 h-4" /> Nouveau message
        </button>
      </div>

      {/* Composer */}
      {showEditor && (
        <div className="mb-6 bg-surface-50 rounded-2xl p-6 border border-surface-200">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-primary-500" />
            <h3 className="font-bold text-surface-900">Composer un message</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5">À</label>
              <select value={recipient} onChange={(e) => setRecipient(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-primary-500 outline-none text-sm">
                <option value="">Choisir un destinataire</option>
                {members.map(m => <option key={m.id} value={`${m.full_name} <${m.email}>`}>{m.full_name} ({m.email})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5">Objet</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-primary-500 outline-none text-sm" placeholder="Objet du message" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1.5">Message</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-primary-500 outline-none text-sm resize-y" placeholder="Saisissez votre message ici..." />
            </div>
            <button onClick={handleSend} className="flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-600 transition-all">
              <Send className="w-4 h-4" /> Envoyer le message
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? <LoadingSpinner className="py-10" /> : messages.length === 0 ? (
        <p className="text-surface-500 text-center py-8">Aucun message reçu.</p>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`py-4 px-5 rounded-xl border ${msg.is_read ? 'bg-surface-50 border-surface-100' : 'bg-primary-50/40 border-primary-100'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-primary-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-surface-900">{msg.full_name}</p>
                    <p className="text-xs text-surface-400">{msg.email} - {msg.created_at?.slice(0,10)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {msg.file && (
                    <a href={msg.file} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1"><Eye className="w-3.5 h-3.5" /></a>
                  )}
                  <button onClick={() => setSelected(msg)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg text-xs font-semibold hover:bg-primary-100"><Reply className="w-3.5 h-3.5" /> Répondre</button>
                </div>
              </div>
              <p className="text-sm text-surface-600 leading-relaxed">{msg.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reply modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-3xl w-full max-w-xl p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-surface-900">Répondre à {selected.full_name}</h3>
              <button onClick={() => setSelected(null)} className="text-surface-400 hover:text-surface-600"><ArrowLeft className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-surface-500 mb-1">Email : {selected.email}</p>
            <p className="text-sm text-surface-500 mb-4">Message reçu : {selected.message}</p>
            <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={6} className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-primary-500 outline-none text-sm resize-y mb-4" placeholder="Votre réponse..." />
            <button onClick={handleReply} className="flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-600 transition-all">
              <Send className="w-4 h-4" /> Envoyer la réponse
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BureauDashboard() {
  const { user, member } = useAuth();
  const location = useLocation();
  const [stats, setStats] = useState({ members: 0, events: 0, documents: 0, messages: 0 });
  const [loading, setLoading] = useState(true);
  const isTreasurerRole = member?.role === 'treasurer';
  const isSecretary = member?.role === 'secretary';
  const actions = isTreasurerRole ? treasurerActions : adminActions;
  const isMessagesPage = location.pathname.includes('/messages');

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

  // If we're on the messages page, show the message editor
  if (isMessagesPage && !isTreasurerRole) {
    return (
      <div className="min-h-screen bg-surface-50 pt-24 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link to="/espace-bureau" className="text-sm text-surface-500 hover:text-primary-500 flex items-center gap-1 mb-2"><ArrowLeft className="w-4 h-4" /> Retour</Link>
            <h1 className="text-2xl font-bold text-surface-900 font-[var(--font-display)]">Messages</h1>
          </div>
          <MessagesEditor />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-primary-500" />
            <h1 className="text-3xl font-bold text-surface-900 font-[var(--font-display)]">Espace Bureau</h1>
          </div>
          <p className="text-surface-500">{isTreasurerRole ? 'Gestion financière' : isSecretary ? 'Espace secrétaire' : 'Tableau de bord administrateur'} - {user?.first_name || user?.username}</p>
        </motion.div>

        {!isTreasurerRole && (
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
        )}

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
          <h2 className="text-xl font-bold text-surface-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-500" /> Actions rapides
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {actions.map((action) => (
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
