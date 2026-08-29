import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, FileText, Camera, Newspaper, Eye, Download, Upload, User, Edit3, X, Film, Play } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { confirmAction, showSuccess, showError, showLoading, closeLoading, extractError } from '../../utils/swal';

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

function canEditBureau() {
  // Handled inside component via useAuth
  return true;
}

function OrgChartMember({ member, position, editable, onEdit }) {
  return (
    <div className="flex flex-col items-center">
      <motion.div variants={fadeInUp} className="relative group">
        <div className="w-40 bg-white rounded-2xl border border-surface-200 p-4 text-center hover:shadow-lg hover:border-primary-300 transition-all">
          <div className="w-20 h-20 rounded-full bg-primary-100 mx-auto mb-3 overflow-hidden border-[3px] border-primary-200 relative">
            {member.member?.photo ? (
              <img src={member.member.photo} alt={member.member.full_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-10 h-10 text-primary-400" />
              </div>
            )}
            {editable && (
              <button
                onClick={() => onEdit(member)}
                className="absolute inset-0 bg-black/0 hover:bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-all"
                title="Modifier la photo"
              >
                <Edit3 className="w-6 h-6 text-white" />
              </button>
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
  const [editingMember, setEditingMember] = useState(null);
  const { isBureau, isSecretary } = useAuth();
  const editable = isBureau || isSecretary;

  const loadBureau = () => {
    api.get('/bureau/').then(({ data }) => {
      setBureauMembers(data.results || data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBureau();
  }, []);

  const sorted = [...bureauMembers].sort((a, b) => positionOrder.indexOf(a.position) - positionOrder.indexOf(b.position));
  const president = sorted.find(m => m.position === 'president');
  const others = sorted.filter(m => m.position !== 'president');

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !editingMember) return;
    const ok = await confirmAction(
      'Mettre à jour cette photo ?',
      `La photo de profil de ${editingMember.member?.full_name || 'ce membre'} sera remplacée.`,
      { icon: 'question', confirmText: 'Oui, mettre à jour' }
    );
    if (!ok.isConfirmed) { e.target.value = ''; return; }
    const memberId = editingMember.member?.id;
    const formData = new FormData();
    formData.append('photo', file);
    showLoading('Mise à jour de la photo...');
    try {
      await api.patch(`/members/${memberId}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      closeLoading();
      showSuccess('Photo mise à jour');
      setEditingMember(null);
      loadBureau();
    } catch (err) { closeLoading(); console.error(err); showError('Échec', extractError(err, 'Erreur lors de la mise à jour de la photo.')); }
  };

  if (loading) return <div className="text-center py-10 text-surface-400">Chargement...</div>;
  if (sorted.length === 0) return <div className="text-center py-10 text-surface-400">Aucun membre du bureau.</div>;

  return (
    <div className="max-w-4xl mx-auto">
      {editable && editingMember && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setEditingMember(null)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-surface-900">Modifier la photo</h3>
              <button onClick={() => setEditingMember(null)} className="text-surface-400 hover:text-surface-600"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-surface-500 mb-4">
              {editingMember.member?.full_name} - {positionLabels[editingMember.position]}
            </p>
            <div className="w-24 h-24 rounded-full bg-surface-100 mx-auto mb-4 overflow-hidden">
              {editingMember.member?.photo ? (
                <img src={editingMember.member.photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><User className="w-10 h-10 text-surface-300" /></div>
              )}
            </div>
            <label className="w-full flex items-center justify-center gap-2 bg-primary-500 text-white px-5 py-3 rounded-xl text-sm font-semibold cursor-pointer hover:bg-primary-600 transition-all">
              <Upload className="w-4 h-4" />
              Choisir une photo
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>
        </div>
      )}

      {/* Président au sommet */}
      {president && (
        <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="flex justify-center mb-2">
          <OrgChartMember member={president} position={president.position} editable={editable} onEdit={setEditingMember} />
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
          <div className="h-0.5 bg-primary-200" style={{ width: `${Math.min(others.length * 200, 800)}px` }} />
        </div>
      )}

      {/* Autres membres en ligne */}
      <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="flex flex-wrap justify-center gap-4">
        {others.map((m) => (
          <div key={m.id} className="flex flex-col items-center">
            <div className="w-0.5 h-8 bg-primary-200 mb-2" />
            <OrgChartMember member={m} position={m.position} editable={editable} onEdit={setEditingMember} />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function MembersPage({ onCount }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({ collective_photo: null });
  const { isBureau, isSecretary } = useAuth();
  const canUpload = isBureau || isSecretary;

  const loadData = () => {
    api.get('/members/directory/').then(({ data }) => {
      const list = data.results || data || [];
      const memberList = list.filter(m => m.role === 'member');
      setMembers(memberList);
      if (onCount) onCount(memberList.length);
    }).catch(() => {});
    api.get('/settings/').then(({ data }) => setSettings(data)).catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMemberPhoto = async (e, member) => {
    const file = e.target.files[0];
    if (!file) return;
    const ok = await confirmAction(
      'Mettre à jour cette photo ?',
      `La photo du membre ${member.full_name} sera remplacée.`,
      { icon: 'question', confirmText: 'Oui, mettre à jour' }
    );
    if (!ok.isConfirmed) { e.target.value = ''; return; }
    const formData = new FormData();
    formData.append('photo', file);
    showLoading('Mise à jour de la photo...');
    try {
      await api.patch(`/members/${member.id}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      closeLoading();
      showSuccess('Photo mise à jour');
      loadData();
    } catch (err) { closeLoading(); console.error(err); showError('Échec', extractError(err, 'Erreur lors de la mise à jour de la photo.')); }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ok = await confirmAction(
      settings.collective_photo ? 'Remplacer la photo collective ?' : 'Charger une photo collective ?',
      'Cette photo sera affichée en haut de la page Nos Membres.',
      { icon: 'question', confirmText: 'Oui, charger' }
    );
    if (!ok.isConfirmed) { e.target.value = ''; return; }
    const formData = new FormData();
    formData.append('collective_photo', file);
    showLoading('Chargement de la photo...');
    try {
      await api.post('/settings/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      closeLoading();
      showSuccess('Photo collective mise à jour');
      loadData();
    } catch (err) { closeLoading(); console.error(err); showError('Échec', extractError(err, 'Erreur lors du chargement de la photo.')); }
  };

  return (
    <div>
      {/* Photo collective */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="mb-10">
        <div className="relative w-full h-72 md:h-96 rounded-3xl border border-surface-100 overflow-hidden">
          {settings.collective_photo ? (
            <img src={settings.collective_photo} alt="Membres" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-surface-100 flex flex-col items-center justify-center">
              <Upload className="w-12 h-12 text-surface-300 mb-2" />
              <p className="text-sm text-surface-400">Aucune photo collective</p>
            </div>
          )}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent px-6 py-4">
            <h3 className="text-lg font-bold text-white">Photo collective des membres</h3>
          </div>
          {canUpload && (
            <label className="absolute bottom-4 right-4 inline-flex items-center gap-2 bg-white/90 backdrop-blur text-primary-600 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer hover:bg-white transition-all shadow-lg">
              <Upload className="w-4 h-4" />
              {settings.collective_photo ? 'Changer la photo' : 'Uploader une photo'}
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          )}
        </div>
      </motion.div>

      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {members.map((m) => (
          <motion.div key={m.id} variants={fadeInUp} className="relative aspect-[2/3] bg-white rounded-2xl border border-surface-100 overflow-hidden group hover:shadow-lg transition-all">
            {m.photo ? (
              <img src={m.photo} alt={m.full_name} className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-primary-50">
                <User className="w-16 h-16 text-primary-200" />
              </div>
            )}
            {canUpload && (
              <label className="absolute top-3 right-3 inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/90 backdrop-blur shadow cursor-pointer hover:bg-white transition-all" title="Changer la photo du membre">
                <Upload className="w-4 h-4 text-primary-600" />
                <input type="file" accept="image/*" onChange={e => handleMemberPhoto(e, m)} className="hidden" />
              </label>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pt-10 pb-4">
              <h3 className="text-sm font-bold text-white">{m.full_name}</h3>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    api.get('/documents/').then(({ data }) => {
      setDocuments(data.results || data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const openDoc = (doc) => {
    setPreview(doc);
  };

  return (
    <div>
      {loading ? <div className="text-center py-10 text-surface-400">Chargement...</div> : (
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="space-y-4 max-w-3xl mx-auto">
          {documents.map((doc) => (
            <motion.div key={doc.id} variants={fadeInUp} className="bg-white rounded-2xl border border-surface-100 p-5 flex items-center justify-between hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 text-sm">{doc.title}</h3>
                  <p className="text-xs text-surface-400 mt-0.5">{doc.category_display}</p>
                </div>
              </div>
              {doc.file && (
                <div className="flex items-center gap-2">
                  <button onClick={() => openDoc(doc)} className="flex items-center gap-1.5 px-3 py-2 bg-primary-50 text-primary-600 rounded-lg text-xs font-semibold hover:bg-primary-100 transition-all">
                    <Eye className="w-3.5 h-3.5" /> Visionner
                  </button>
                  <a href={doc.file} target="_blank" rel="noopener noreferrer" download className="flex items-center gap-1.5 px-3 py-2 bg-surface-50 text-surface-600 rounded-lg text-xs font-semibold hover:bg-surface-100 transition-all">
                    <Download className="w-3.5 h-3.5" /> Télécharger
                  </a>
                </div>
              )}
            </motion.div>
          ))}
          {documents.length === 0 && (
            <div className="text-center py-10 text-surface-400">Aucun document disponible.</div>
          )}
        </motion.div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
              <div>
                <h3 className="font-bold text-surface-900">{preview.title}</h3>
                <p className="text-xs text-surface-400">{preview.category_display}</p>
              </div>
              <div className="flex items-center gap-2">
                <a href={preview.file} target="_blank" rel="noopener noreferrer" download className="flex items-center gap-1.5 px-3 py-2 bg-primary-500 text-white rounded-lg text-xs font-semibold hover:bg-primary-600">
                  <Download className="w-3.5 h-3.5" /> Télécharger
                </a>
                <button onClick={() => setPreview(null)} className="p-2 bg-surface-50 rounded-lg text-surface-600 hover:bg-surface-100"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-surface-50 p-4">
              <iframe src={preview.file} title={preview.title} className="w-full h-[70vh] rounded-xl border border-surface-200 bg-white" />
            </div>
          </div>
        </div>
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
    description: "Une communauté de membres actifs et engagés.",
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

function PublicGallery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/gallery/', { params: { page_size: 100 } }).then(({ data }) => setItems(data.results || data || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const categories = ['all', ...new Set(items.map(i => i.category).filter(Boolean))];
  const filtered = filter === 'all' ? items : items.filter(i => i.category === filter);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === c ? 'bg-primary-500 text-white' : 'bg-white text-surface-600 hover:bg-primary-50 border border-surface-100'}`}>
            {c === 'all' ? 'Tout' : c}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-10 text-surface-400">Chargement...</div> : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Camera className="w-16 h-16 text-surface-300 mx-auto mb-4" />
          <p className="text-surface-500 text-lg">La galerie sera bientôt remplie.</p>
        </div>
      ) : (
        <motion.div key={filter} initial="hidden" animate="visible" variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map(item => (
            <motion.div key={item.id} variants={fadeInUp} className="group relative bg-white rounded-2xl border border-surface-100 overflow-hidden cursor-pointer hover:shadow-lg transition-all" onClick={() => setPreview(item)}>
              {item.is_video ? (
                <div className="relative aspect-video bg-black">
                  {item.media_url?.includes('youtube.com') ? (
                    <img src={`https://img.youtube.com/vi/${item.media_url.split('/').pop()}/hqdefault.jpg`} alt={item.title} className="w-full h-full object-cover opacity-80" />
                  ) : item.media_url ? (
                    <video src={item.media_url} preload="none" poster={item.media_url} className="w-full h-full object-cover" muted />
                  ) : null}
                  <div className="absolute inset-0 flex items-center justify-center"><div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-all"><Play className="w-6 h-6 text-primary-600 fill-primary-600" /></div></div>
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 text-white text-xs rounded flex items-center gap-1"><Film className="w-3 h-3" /> Vidéo</span>
                </div>
              ) : (
                <img src={item.media_url || item.image} alt={item.caption || item.title} className="w-full aspect-video object-cover" />
              )}
              <div className="p-3">
                <p className="text-sm font-semibold text-surface-800">{item.title}</p>
                {item.caption && item.caption !== item.title && <p className="text-xs text-surface-400">{item.caption}</p>}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-end mb-2"><button onClick={() => setPreview(null)} className="p-2 bg-white/20 rounded-lg text-white"><X className="w-5 h-5" /></button></div>
            {preview.is_video ? (
              preview.media_url?.includes('youtube.com') ? (
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe src={preview.media_url} title={preview.title} className="absolute inset-0 w-full h-full rounded-2xl" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen frameBorder="0" />
                </div>
              ) : (
                <video src={preview.media_url} controls autoPlay className="w-full rounded-2xl" />
              )
            ) : (
              <img src={preview.media_url || preview.image} alt={preview.title} className="w-full rounded-2xl" />
            )}
            <p className="text-white text-center mt-3 font-medium">{preview.title}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ActualitesPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/actualites/').then(({ data }) => setNews(data.results || data || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {loading ? <div className="text-center py-10 text-surface-400">Chargement...</div> : news.length === 0 ? (
        <p className="text-surface-500 text-center py-16">Aucune actualité pour le moment.</p>
      ) : (
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid md:grid-cols-3 gap-6">
          {news.map(n => (
            <motion.div key={n.id} variants={fadeInUp} className="card p-6">
              {n.image && <img src={n.image} alt={n.title} className="w-full h-40 object-cover rounded-xl mb-4" />}
              <div className="text-xs text-surface-400 mb-3">{new Date(n.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              <h3 className="text-lg font-bold text-surface-900 mb-2">{n.title}</h3>
              <p className="text-sm text-surface-500">{n.excerpt || n.content}</p>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function GenericPage({ pageKey }) {
  const config = pageConfigs[pageKey] || pageConfigs.bureau;
  const Icon = config.icon;
  const [memberCount, setMemberCount] = useState(null);
  const description = pageKey === 'membres' && memberCount != null
    ? `Une communauté de ${memberCount} membres actifs et engagés.`
    : config.description;

  return (
    <div className="pt-20">
      <section className="relative py-24 bg-gradient-to-br from-primary-800 to-primary-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10"><div className="absolute top-20 right-20 w-64 h-64 bg-accent-500 rounded-full blur-3xl" /></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="max-w-2xl">
            <span className="text-accent-400 font-bold text-sm uppercase tracking-widest">{config.subtitle}</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mt-3 mb-6 font-[var(--font-display)]">{config.title}</h1>
            <p className="text-lg text-white/70">{description}</p>
          </motion.div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          {config.type === 'organigramme' && <BureauOrganigramme />}
          {config.type === 'members' && <MembersPage onCount={setMemberCount} />}
          {config.type === 'documents' && <DocumentsPage />}
          {config.type === 'archives' && <PublicGallery />}
          {config.type === 'actualites' && <ActualitesPage />}
        </div>
      </section>
    </div>
  );
}

export default GenericPage;
