import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, FileText, Camera, Newspaper, Eye, Download, Upload, ChevronRight, User } from 'lucide-react';
import SectionHeader from '../../components/ui/SectionHeader';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const fadeInUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const positionLabels = {
  president: 'Président',
  vice_president: 'Vice-Président',
  treasurer: 'Trésorier',
  secretary: 'Secrétaire',
  member: 'Conseiller',
};

const positionOrder = ['president', 'vice_president', 'treasurer', 'secretary', 'member'];

function OrgChartMember({ member, position, isLast }) {
  return (
    <div className="flex flex-col items-center">
      <motion.div variants={fadeInUp} className="relative group">
        <div className="w-36 bg-white rounded-2xl border border-surface-200 p-4 text-center hover:shadow-lg hover:border-primary-300 transition-all">
          <div className="w-20 h-20 rounded-full bg-primary-100 mx-auto mb-3 overflow-hidden border-3 border-primary-200">
            {member.member?.photo ? (
              <img src={member.member.photo} alt={member.member.full_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-10 h-10 text-primary-400" />
              </div>
            )}
          </div>
          <h3 className="text-sm font-bold text-surface-900 mb-0.5">{member.member?.full_name || 'Non assigné'}</h3>
          <p className="text-xs font-semibold text-primary-500">{positionLabels[position] || position}</p>
        </div>
      </motion.div>
    </div>
  );
}

function BureauOrganigramme() {
  const [bureauMembers, setBureauMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/bureau/').then(({ data }) => {
      setBureauMembers(data.results || data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const sorted = [...bureauMembers].sort((a, b) => positionOrder.indexOf(a.position) - positionOrder.indexOf(b.position));
  const president = sorted.find(m => m.position === 'president');
  const others = sorted.filter(m => m.position !== 'president');

  if (loading) return <div className="text-center py-10 text-surface-400">Chargement...</div>;
  if (sorted.length === 0) return <div className="text-center py-10 text-surface-400">Aucun membre du bureau.</div>;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Président au sommet */}
      {president && (
        <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="flex justify-center mb-2">
          <OrgChartMember member={president} position={president.position} />
        </motion.div>
      )}

      {/* Ligne de connexion verticale */}
      {president && others.length > 0 && (
        <div className="flex justify-center mb-2">
          <div className="w-0.5 h-8 bg-primary-200" />
        </div>
      )}

      {/* Ligne horizontale */}
      {others.length > 0 && (
        <div className="flex justify-center mb-2">
          <div className="h-0.5 bg-primary-200" style={{ width: `${Math.min(others.length * 180, 700)}px` }} />
        </div>
      )}

      {/* Autres membres en ligne */}
      <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="flex flex-wrap justify-center gap-4">
        {others.map((m, i) => (
          <div key={m.id} className="flex flex-col items-center">
            <div className="w-0.5 h-8 bg-primary-200 mb-2" />
            <OrgChartMember member={m} position={m.position} isLast={i === others.length - 1} />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function MembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isBureau, member: currentUser } = useAuth();
  const [collectivePhoto, setCollectivePhoto] = useState(null);

  useEffect(() => {
    api.get('/members/directory/').then(({ data }) => {
      const list = data.results || data || [];
      setMembers(list.filter(m => m.role === 'member'));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('photo', file);
  };

  return (
    <div>
      {/* Photo collective */}
      {(isBureau || currentUser?.role === 'admin' || currentUser?.role === 'secretary') && (
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="mb-10">
          <div className="bg-white rounded-3xl border border-surface-100 p-8 text-center">
            <h3 className="text-lg font-bold text-surface-900 mb-4">Photo collective des membres</h3>
            {collectivePhoto ? (
              <img src={collectivePhoto} alt="Membres" className="w-full max-w-md mx-auto rounded-2xl object-cover" />
            ) : (
              <div className="w-full max-w-md mx-auto h-48 bg-surface-100 rounded-2xl flex flex-col items-center justify-center">
                <Upload className="w-10 h-10 text-surface-300 mb-2" />
                <p className="text-sm text-surface-400">Aucune photo collective</p>
              </div>
            )}
            <label className="mt-4 inline-flex items-center gap-2 bg-primary-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer hover:bg-primary-600 transition-all">
              <Upload className="w-4 h-4" />
              {collectivePhoto ? 'Changer la photo' : 'Uploader une photo'}
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>
        </motion.div>
      )}

      {loading ? <div className="text-center py-10 text-surface-400">Chargement...</div> : (
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {members.map((m, i) => (
            <motion.div key={m.id} variants={fadeInUp} className="bg-white rounded-2xl border border-surface-100 p-6 text-center hover:shadow-lg transition-all">
              <div className="w-16 h-16 rounded-full bg-primary-100 mx-auto mb-3 overflow-hidden">
                {m.photo ? (
                  <img src={m.photo} alt={m.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-8 h-8 text-primary-400" />
                  </div>
                )}
              </div>
              <h3 className="text-sm font-bold text-surface-900">{m.full_name}</h3>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    api.get('/documents/').then(({ data }) => {
      setDocuments(data.results || data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {loading ? <div className="text-center py-10 text-surface-400">Chargement...</div> : (
        <>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="space-y-4 max-w-3xl mx-auto">
            {documents.map((doc) => (
              <motion.div key={doc.id} variants={fadeInUp} className="bg-white rounded-2xl border border-surface-100 p-5 flex items-center justify-between hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-surface-900 text-sm">{doc.title}</h3>
                    <p className="text-xs text-surface-400 mt-0.5">{doc.category_display} - {doc.visible_to_display || 'Public'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {doc.file && (
                    <>
                      <button onClick={() => setPreviewDoc(doc)} className="flex items-center gap-1.5 px-3 py-2 bg-primary-50 text-primary-600 rounded-lg text-xs font-semibold hover:bg-primary-100 transition-all">
                        <Eye className="w-3.5 h-3.5" /> Lire
                      </button>
                      <a href={doc.file} download className="flex items-center gap-1.5 px-3 py-2 bg-surface-50 text-surface-600 rounded-lg text-xs font-semibold hover:bg-surface-100 transition-all">
                        <Download className="w-3.5 h-3.5" /> Télécharger
                      </a>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
            {documents.length === 0 && (
              <div className="text-center py-10 text-surface-400">Aucun document disponible.</div>
            )}
          </motion.div>

          {/* PDF Preview Modal */}
          {previewDoc && previewDoc.file && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setPreviewDoc(null)}>
              <div className="bg-white rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
                  <h3 className="font-bold text-surface-900">{previewDoc.title}</h3>
                  <div className="flex items-center gap-3">
                    <a href={previewDoc.file} download className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg text-xs font-semibold hover:bg-primary-100">
                      <Download className="w-3.5 h-3.5" /> Télécharger
                    </a>
                    <button onClick={() => setPreviewDoc(null)} className="text-surface-400 hover:text-surface-600 text-lg font-bold">&times;</button>
                  </div>
                </div>
                <iframe src={previewDoc.file} className="flex-1 w-full" title={previewDoc.title} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const pageConfigs = {
  bureau: {
    icon: Shield,
    title: 'Le Bureau',
    subtitle: "L'Association",
    description: "Découvrez les membres du bureau qui dirigent l'association.",
    type: 'organigramme',
  },
  membres: {
    icon: Users,
    title: 'Nos Membres',
    subtitle: "L'Association",
    description: 'Une communauté de 24 membres actifs et engagés.',
    type: 'members',
  },
  documents: {
    icon: FileText,
    title: 'Textes Officiels',
    subtitle: "L'Association",
    description: 'Consultez les documents officiels de l\'association.',
    type: 'documents',
  },
  archives: {
    icon: Camera,
    title: 'Galerie & Archives',
    subtitle: 'Vie Associative',
    description: 'Retrouvez les moments forts de nos événements passés.',
    type: 'archives',
  },
  actualites: {
    icon: Newspaper,
    title: 'Actualités',
    subtitle: 'Vie Associative',
    description: 'Suivez l\'actualité de l\'association et de ses projets.',
    type: 'actualites',
  },
};

const fallbackNews = [
  { id: 1, title: 'Nouveau partenariat avec la Ville', excerpt: 'L\'AFE signe un accord de partenariat historique avec la municipalité.', created_at: '2026-08-20T10:00:00Z' },
  { id: 2, title: 'Résultats de la collecte solidaire', excerpt: 'Grâce à votre générosité, plus de 5000€ récoltés.', created_at: '2026-08-15T10:00:00Z' },
  { id: 3, title: 'Assemblée Générale 2026', excerpt: 'Compte-rendu de notre AG annuelle.', created_at: '2026-08-10T10:00:00Z' },
];

function GenericPage({ pageKey }) {
  const config = pageConfigs[pageKey] || pageConfigs.bureau;
  const Icon = config.icon;

  return (
    <div className="pt-20">
      <section className="relative py-24 bg-gradient-to-br from-primary-800 to-primary-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10"><div className="absolute top-20 right-20 w-64 h-64 bg-accent-500 rounded-full blur-3xl" /></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="max-w-2xl">
            <span className="text-accent-400 font-bold text-sm uppercase tracking-widest">{config.subtitle}</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mt-3 mb-6 font-[var(--font-display)]">{config.title}</h1>
            <p className="text-lg text-white/70">{config.description}</p>
          </motion.div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          {config.type === 'organigramme' && <BureauOrganigramme />}
          {config.type === 'members' && <MembersPage />}
          {config.type === 'documents' && <DocumentsPage />}
          {config.type === 'archives' && (
            <div className="text-center py-16">
              <Camera className="w-16 h-16 text-surface-300 mx-auto mb-4" />
              <p className="text-surface-500 text-lg">La galerie photos sera bientôt disponible.</p>
            </div>
          )}
          {config.type === 'actualites' && (
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid md:grid-cols-3 gap-6">
              {fallbackNews.map((n) => (
                <motion.div key={n.id} variants={fadeInUp} className="card p-6">
                  <div className="text-xs text-surface-400 mb-3">{new Date(n.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  <h3 className="text-lg font-bold text-surface-900 mb-2">{n.title}</h3>
                  <p className="text-sm text-surface-500">{n.excerpt}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}

export default GenericPage;
