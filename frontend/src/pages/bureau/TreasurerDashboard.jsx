import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, FileText, BarChart3, Clock, ArrowLeft, LayoutDashboard, HandCoins, ClipboardCheck, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import CotisationsManager from './sections/CotisationsManager';
import PresencesManager from './sections/PresencesManager';
import TresorierPresenceCotisations from './sections/TresorierPresenceCotisations';
import { confirmAction, showSuccess, showError, showLoading, closeLoading, extractError } from '../../utils/swal';

const fadeInUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const sections = [
  { key: '', label: 'Tableau de bord', icon: LayoutDashboard, path: '/espace-tresorier' },
  { key: 'cotisations', label: 'Cotisations', icon: HandCoins, path: '/espace-tresorier/cotisations' },
  { key: 'presences', label: 'Présences', icon: ClipboardCheck, path: '/espace-tresorier/presences' },
  { key: 'presence-cotisations', label: 'Présence + Cotisations', icon: HandCoins, path: '/espace-tresorier/presence-cotisations' },
];

function FinancialEditor({ onAdded }) {
  const [form, setForm] = useState({ title: '', amount: '', record_type: 'income', category: '', date: '', description: '' });
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.amount || !form.date) { showError('Champs manquants', 'Veuillez renseigner le libellé, le montant et la date.'); return; }
    const ok = await confirmAction(
      'Ajouter cet enregistrement ?',
      `${form.record_type === 'income' ? 'Recette' : 'Dépense'} de ${form.amount} FCFA — ${form.title}`,
      { icon: 'question', confirmText: 'Oui, ajouter' }
    );
    if (!ok.isConfirmed) return;
    showLoading('Ajout de l\'enregistrement...');
    try {
      await api.post('/financial-records/', { ...form, amount: parseFloat(form.amount) });
      closeLoading();
      showSuccess('Enregistrement ajouté');
      setForm({ title: '', amount: '', record_type: 'income', category: '', date: '', description: '' });
      onAdded();
    } catch (err) { closeLoading(); showError('Échec de l\'ajout', extractError(err, 'Erreur lors de l\'ajout de l\'enregistrement.')); }
  };
  return (
    <motion.form initial="hidden" animate="visible" variants={fadeInUp} onSubmit={handleSubmit} className="mb-6 bg-white rounded-2xl border border-surface-100 p-6 space-y-4">
      <h3 className="font-bold text-surface-900 flex items-center gap-2"><Plus className="w-4 h-4" /> Nouvel enregistrement</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="Libellé" className="input" />
        <input value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} type="number" required placeholder="Montant (FCFA)" className="input" />
        <select value={form.record_type} onChange={e => setForm({ ...form, record_type: e.target.value })} className="input">
          <option value="income">Recette</option>
          <option value="expense">Dépense</option>
        </select>
        <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Catégorie" className="input" />
        <input value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} type="date" required className="input" />
        <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" className="input" />
      </div>
      <button type="submit" className="bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-emerald-600">Ajouter</button>
    </motion.form>
  );
}

function TreasurerDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [records, setRecords] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const current = sections.find(s => s.key && location.pathname.endsWith(s.key));
  const activeSection = current || sections[0];

  const fetchData = async () => {
    try {
      const [finRes, repRes] = await Promise.all([
        api.get('/financial-records/').catch(() => ({ data: { results: [] } })),
        api.get('/meeting-reports/').catch(() => ({ data: { results: [] } })),
      ]);
      setRecords(finRes.data.results || finRes.data || []);
      setReports(repRes.data.results || repRes.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const totalIncome = records.filter(r => r.record_type === 'income').reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
  const totalExpense = records.filter(r => r.record_type === 'expense').reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  const tabs = [
    { key: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
    { key: 'records', label: 'Enregistrements', icon: FileText },
    { key: 'reports', label: 'Rapports de réunion', icon: Clock },
  ];

  if (activeSection.key !== '') {
    return (
      <div className="min-h-screen bg-surface-50 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/espace-tresorier" className="text-sm text-surface-500 hover:text-primary-500 flex items-center gap-1 mb-3"><ArrowLeft className="w-4 h-4" /> Retour au tableau de bord</Link>
          <div className="flex gap-2 overflow-x-auto mb-6 pb-1">
            {sections.map(s => (
              <Link key={s.key} to={s.path} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${s.key === activeSection.key ? 'bg-emerald-500 text-white' : 'bg-white text-surface-600 hover:bg-surface-100 border border-surface-100'}`}>
                <s.icon className="w-4 h-4" />{s.label}
              </Link>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-surface-100 p-6">
            {activeSection.key === 'cotisations' && <CotisationsManager />}
            {activeSection.key === 'presences' && <PresencesManager />}
            {activeSection.key === 'presence-cotisations' && <TresorierPresenceCotisations />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-8 h-8 text-emerald-500" />
            <h1 className="text-3xl font-bold text-surface-900 font-[var(--font-display)]">Espace Trésorier</h1>
          </div>
          <p className="text-surface-500">Gestion financière - {user?.first_name || user?.username}</p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {sections.map(s => (
            <motion.div key={s.key} variants={fadeInUp}>
              <Link to={s.path} className="block bg-white rounded-2xl p-6 border border-surface-100 hover:shadow-lg hover:border-emerald-200 transition-all group">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform"><s.icon className="w-6 h-6" /></div>
                <h3 className="font-bold text-surface-900 mb-1">{s.label}</h3>
                <p className="text-sm text-surface-500">Gérer cette section</p>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div variants={fadeInUp} className="bg-white rounded-2xl p-6 border border-surface-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
              <span className="text-sm text-surface-500">Recettes totales</span>
            </div>
            <div className="text-2xl font-bold text-emerald-600">{loading ? '...' : totalIncome.toLocaleString('fr-FR')} FCFA</div>
          </motion.div>
          <motion.div variants={fadeInUp} className="bg-white rounded-2xl p-6 border border-surface-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center"><TrendingDown className="w-5 h-5 text-red-600" /></div>
              <span className="text-sm text-surface-500">Dépenses totales</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{loading ? '...' : totalExpense.toLocaleString('fr-FR')} FCFA</div>
          </motion.div>
          <motion.div variants={fadeInUp} className="bg-white rounded-2xl p-6 border border-surface-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><DollarSign className="w-5 h-5 text-blue-600" /></div>
              <span className="text-sm text-surface-500">Solde</span>
            </div>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{loading ? '...' : balance.toLocaleString('fr-FR')} FCFA</div>
          </motion.div>
        </motion.div>

        <div className="flex gap-2 mb-6">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-emerald-500 text-white' : 'bg-white text-surface-600 hover:bg-surface-50 border border-surface-100'}`}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>

        {loading ? <LoadingSpinner className="py-10" /> : (
          <>
            {activeTab === 'overview' && (
              <div>
                <FinancialEditor onAdded={fetchData} />
                <div className="bg-white rounded-2xl border border-surface-100 p-6">
                  <h2 className="text-lg font-bold text-surface-900 mb-4">Derniers enregistrements</h2>
                  {records.length === 0 ? <p className="text-surface-500 text-center py-8">Aucun enregistrement financier.</p> : (
                    <div className="space-y-3">
                      {records.slice(0, 6).map(r => (
                        <div key={r.id} className="flex items-center justify-between py-3 px-4 bg-surface-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${r.record_type === 'income' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                              {r.record_type === 'income' ? <TrendingUp className="w-4 h-4 text-emerald-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
                            </div>
                            <div><p className="text-sm font-medium text-surface-800">{r.title}</p><p className="text-xs text-surface-400">{r.date}</p></div>
                          </div>
                          <span className={`text-sm font-bold ${r.record_type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {r.record_type === 'income' ? '+' : '-'}{parseFloat(r.amount).toLocaleString('fr-FR')} FCFA
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'records' && (
              <div className="bg-white rounded-2xl border border-surface-100 p-6">
                <h2 className="text-lg font-bold text-surface-900 mb-4">Tous les enregistrements</h2>
                {records.length === 0 ? <p className="text-surface-500 text-center py-8">Aucun enregistrement.</p> : (
                  <div className="space-y-2">
                    {records.map(r => (
                      <div key={r.id} className="flex items-center justify-between py-3 px-4 bg-surface-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${r.record_type === 'income' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                            {r.record_type === 'income' ? <TrendingUp className="w-4 h-4 text-emerald-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
                          </div>
                          <div><p className="text-sm font-medium text-surface-800">{r.title}</p><p className="text-xs text-surface-400">{r.category} - {r.date}</p></div>
                        </div>
                        <span className={`text-sm font-bold ${r.record_type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>{r.record_type === 'income' ? '+' : '-'}{parseFloat(r.amount).toLocaleString('fr-FR')} FCFA</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'reports' && (
              <div className="bg-white rounded-2xl border border-surface-100 p-6">
                <h2 className="text-lg font-bold text-surface-900 mb-4">Rapports de réunion</h2>
                {reports.length === 0 ? <p className="text-surface-500 text-center py-8">Aucun rapport de réunion.</p> : (
                  <div className="space-y-3">
                    {reports.map(r => (
                      <div key={r.id} className="py-3 px-4 bg-surface-50 rounded-xl">
                        <div className="flex items-center justify-between mb-1"><p className="text-sm font-medium text-surface-800">{r.title}</p><p className="text-xs text-surface-400">{r.date}</p></div>
                        <p className="text-sm text-surface-500">{r.summary}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default TreasurerDashboard;
