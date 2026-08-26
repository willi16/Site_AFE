import { motion } from 'framer-motion';
import { Shield, Users, FileText, Camera, Newspaper } from 'lucide-react';
import SectionHeader from '../../components/ui/SectionHeader';
import MemberCard from '../../components/ui/MemberCard';
import DocumentCard from '../../components/ui/DocumentCard';

const fadeInUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const pageConfigs = {
  bureau: {
    icon: Shield,
    title: 'Le Bureau',
    subtitle: "L'Association",
    description: "Découvrez les membres du bureau qui dirigent l'association.",
    members: [
      { full_name: 'Président', role: 'Président', bio: 'Responsable des orientations et du bon fonctionnement de l\'Association.' },
      { full_name: 'Secrétaire', role: 'Secrétaire', bio: 'Gère la correspondance, rédige les procès-verbaux et tient les archives.' },
      { full_name: 'Trésorier', role: 'Trésorier', bio: 'Gère les finances et rend compte de la situation financière.' },
      { full_name: 'Conseiller 1', role: 'Conseiller', bio: 'Membre du Bureau Exécutif, conseil et soutien aux projets.' },
      { full_name: 'Conseiller 2', role: 'Conseiller', bio: 'Membre du Bureau Exécutif, conseil et soutien aux projets.' },
    ],
  },
  membres: {
    icon: Users,
    title: 'Nos Membres',
    subtitle: "L'Association",
    description: 'Une communauté de 24 membres actifs et engagés.',
    members: [
      { full_name: 'Président', role: 'Président' },
      { full_name: 'Secrétaire', role: 'Secrétaire' },
      { full_name: 'Trésorier', role: 'Trésorier' },
      { full_name: 'Conseiller 1', role: 'Conseiller' },
      { full_name: 'Conseiller 2', role: 'Conseiller' },
    ],
  },
  documents: {
    icon: FileText,
    title: 'Textes Officiels',
    subtitle: "L'Association",
    description: 'Consultez les documents officiels de l\'association.',
    documents: [
      { id: 1, title: 'Statuts de l\'AFE', category: 'legal', category_display: 'Officiel', visible_to: 'public', visible_to_display: 'Public' },
      { id: 2, title: 'Règlement Intérieur de l\'AFE', category: 'legal', category_display: 'Officiel', visible_to: 'public', visible_to_display: 'Public' },
    ],
  },
  archives: {
    icon: Camera,
    title: 'Galerie & Archives',
    subtitle: 'Vie Associative',
    description: 'Retrouvez les moments forts de nos événements passés.',
  },
  actualites: {
    icon: Newspaper,
    title: 'Actualités',
    subtitle: 'Vie Associative',
    description: 'Suivez l\'actualité de l\'association et de ses projets.',
    news: [
      { id: 1, title: 'Nouveau partenariat avec la Ville', excerpt: 'L\'AFE signe un accord de partenariat historique avec la municipalité.', created_at: '2026-08-20T10:00:00Z' },
      { id: 2, title: 'Résultats de la collecte solidaire', excerpt: 'Grâce à votre générosité, plus de 5000€ récoltés.', created_at: '2026-08-15T10:00:00Z' },
      { id: 3, title: 'Assemblée Générale 2026', excerpt: 'Compte-rendu de notre AG annuelle.', created_at: '2026-08-10T10:00:00Z' },
    ],
  },
};

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
          {config.members && (
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {config.members.map((m, i) => (
                <motion.div key={i} variants={fadeInUp}><MemberCard member={m} /></motion.div>
              ))}
            </motion.div>
          )}
          {config.documents && (
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="space-y-3 max-w-3xl mx-auto">
              {config.documents.map((doc) => (
                <motion.div key={doc.id} variants={fadeInUp}><DocumentCard document={doc} showDownload /></motion.div>
              ))}
            </motion.div>
          )}
          {config.news && (
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid md:grid-cols-3 gap-6">
              {config.news.map((n) => (
                <motion.div key={n.id} variants={fadeInUp} className="card p-6">
                  <div className="text-xs text-surface-400 mb-3">{new Date(n.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  <h3 className="text-lg font-bold text-surface-900 mb-2">{n.title}</h3>
                  <p className="text-sm text-surface-500">{n.excerpt}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
          {pageKey === 'archives' && (
            <div className="text-center py-16">
              <Camera className="w-16 h-16 text-surface-300 mx-auto mb-4" />
              <p className="text-surface-500 text-lg">La galerie photos sera bientôt disponible.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default GenericPage;
