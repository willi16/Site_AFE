import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, ArrowLeft, Eye } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function MessagesEditor() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipient, setRecipient] = useState('');
  const [members, setMembers] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/contact/').then(({ data }) => setMessages(data.results || data || [])).catch(() => {}),
      api.get('/members/directory/').then(({ data }) => setMembers(data.results || data || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const loadMessages = () => {
    api.get('/contact/').then(({ data }) => setMessages(data.results || data || [])).catch(() => {});
  };

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      await api.post('/contact/', {
        full_name: user?.first_name || user?.username || 'AFE',
        email: 'associationfe@gmail.com',
        subject: 'info',
        message: `À: ${recipient}\nObjet: ${subject}\n\n${body}`,
      });
      setSubject(''); setBody(''); setRecipient(''); setShowEditor(false);
      loadMessages();
    } catch (err) { console.error(err); }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!selected || !reply.trim()) return;
    try {
      await api.post('/contact/', {
        full_name: 'AFE Bureau',
        email: 'associationfe@gmail.com',
        subject: 'info',
        message: `Réponse à ${selected.full_name} (${selected.email}):\n\n${reply}`,
      });
      setReply(''); setSelected(null); loadMessages();
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-surface-900 flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary-500" /> Messages
        </h2>
        <button onClick={() => setShowEditor(!showEditor)} className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-all">
          <Send className="w-4 h-4" /> Nouveau message
        </button>
      </div>

      {showEditor && (
        <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="mb-6 bg-white rounded-2xl border border-surface-100 p-6">
          <h3 className="font-bold text-surface-900 mb-4">Composer un message</h3>
          <div className="space-y-4">
            <select value={recipient} onChange={e => setRecipient(e.target.value)} className="input">
              <option value="">Choisir un destinataire</option>
              {members.map(m => <option key={m.id} value={`${m.full_name} <${m.email}>`}>{m.full_name} ({m.email})</option>)}
            </select>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Objet" className="input" />
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={8} placeholder="Votre message..." className="input resize-y" />
            <button onClick={handleSend} className="flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-600">
              <Send className="w-4 h-4" /> Envoyer le message
            </button>
          </div>
        </motion.div>
      )}

      {loading ? <LoadingSpinner className="py-10" /> : messages.length === 0 ? (
        <p className="text-surface-500 text-center py-8">Aucun message reçu.</p>
      ) : (
        <div className="space-y-3">
          {messages.map(msg => (
            <div key={msg.id} className="bg-white rounded-2xl border border-surface-100 p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center"><Mail className="w-4 h-4 text-primary-500" /></div>
                  <div>
                    <p className="text-sm font-bold text-surface-900">{msg.full_name}</p>
                    <p className="text-xs text-surface-400">{msg.email} - {msg.created_at?.slice(0,10)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {msg.file && <a href={msg.file} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-600"><Eye className="w-4 h-4" /></a>}
                  <button onClick={() => setSelected(msg)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg text-xs font-semibold hover:bg-primary-100">
                    <Send className="w-3.5 h-3.5" /> Répondre
                  </button>
                </div>
              </div>
              <p className="text-sm text-surface-600 leading-relaxed">{msg.message}</p>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-3xl w-full max-w-xl p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-surface-900">Répondre à {selected.full_name}</h3>
              <button onClick={() => setSelected(null)} className="text-surface-400 hover:text-surface-600"><ArrowLeft className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-surface-500 mb-1">Email : {selected.email}</p>
            <p className="text-sm text-surface-500 mb-4">Message reçu : {selected.message}</p>
            <textarea value={reply} onChange={e => setReply(e.target.value)} rows={6} className="input resize-y mb-4" placeholder="Votre réponse..." />
            <button onClick={handleReply} className="flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-600">
              <Send className="w-4 h-4" /> Envoyer la réponse
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
