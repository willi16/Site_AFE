import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Heart, Users, Calendar, Award, Shield, Handshake, BookOpen, Camera, Phone } from 'lucide-react';
import SectionHeader from '../../components/ui/SectionHeader';
import EventCard from '../../components/ui/EventCard';

const stats = [
  { icon: Users, value: '24', label: 'Membres actifs' },
  { icon: Calendar, value: '5', label: "Années d'engagement" },
  { icon: Award, value: '5', label: 'Membres au bureau' },
  { icon: Heart, value: '25 Juillet 2021', label: 'Première Assemblée Générale' },
];

const featuredEvents = [
  { id: 1, title: 'Gala de la Fraternité 2026', short_description: 'Soirée de gala réunissant tous les membres et partenaires pour célébrer nos accomplissements.', event_date: '2026-09-15T19:00:00Z', location: 'Palais des Congrès', status: 'upcoming' },
  { id: 2, title: 'Journée Portes Ouvertes', short_description: 'Découvrez nos activités et rencontrez les bénévoles lors de cette journée conviviale.', event_date: '2026-10-05T10:00:00Z', location: 'Siège de l\'AFE', status: 'upcoming' },
  { id: 3, title: 'Atelier Entraide Solidaire', short_description: 'Participez à notre atelier pratique dédié à l\'entraide et au mutualisme.', event_date: '2026-10-20T14:00:00Z', location: 'Centre Communautaire', status: 'upcoming' },
];

const latestNews = [
  { id: 1, title: 'Nouveau partenariat avec la Ville', excerpt: 'L\'AFE signe un accord de partenariat historique avec la municipalité pour renforcer nos actions sociales.', created_at: '2026-08-20T10:00:00Z' },
  { id: 2, title: 'Résultats de la collecte solidaire', excerpt: 'Grâce à votre générosité, nous avons récolté plus de 5000€ pour les familles dans le besoin.', created_at: '2026-08-15T10:00:00Z' },
  { id: 3, title: 'Assemblée Générale 2026', excerpt: 'Retrouvez le compte-rendu de notre AG annuelle et les perspectives pour l\'année à venir.', created_at: '2026-08-10T10:00:00Z' },
];

const fadeInUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.15 } } };

function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-accent-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-3xl">
            <motion.div variants={fadeInUp} className="flex items-center gap-2 mb-6">
              <img src="/logo-afe.jpg" alt="AFE Logo" className="w-12 h-12 rounded-xl object-cover" />
              <span className="text-white/80 font-medium">Association de Fraternité et d'Entraide</span>
            </motion.div>
            <motion.h1 variants={fadeInUp} className="text-4xl sm:text-5xl md:text-7xl font-bold text-white leading-tight mb-6 font-[var(--font-display)]">
              Ensemble pour la{' '}
              <span className="text-accent-400">Fraternité</span>{' '}
              & l'Entraide
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-lg md:text-xl text-white/70 mb-10 max-w-xl leading-relaxed">
              Nous agissons au quotidien pour créer des liens solides, soutenir ceux qui en ont besoin et bâtir une communauté unie par les valeurs de solidarité et de partage.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
              <Link to="/association" className="btn-accent text-base px-8 py-4">
                Découvrir l'AFE
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link to="/adhesion" className="inline-flex items-center justify-center px-8 py-4 rounded-xl border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-all">
                <Handshake className="w-5 h-5 mr-2" />
                Devenir Membre
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative -mt-16 z-10">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <motion.div key={i} variants={fadeInUp} className="bg-white rounded-2xl shadow-xl p-6 text-center hover:-translate-y-1 transition-transform">
                <stat.icon className="w-8 h-8 text-accent-500 mx-auto mb-3" />
                <div className="text-3xl font-bold text-primary-500 mb-1">{stat.value}</div>
                <div className="text-sm text-surface-500">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* About */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
              <div className="relative">
                <div className="aspect-[4/3] bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl overflow-hidden">
                  <img src="/logo-afe.jpg" alt="AFE" className="w-full h-full object-cover opacity-30" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Handshake className="w-24 h-24 text-white/40" />
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 bg-accent-500 rounded-2xl p-6 shadow-xl">
                  <div className="text-3xl font-bold text-white">5+</div>
                  <div className="text-sm text-white/80">Ans d'engagement</div>
                </div>
              </div>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
              <motion.div variants={fadeInUp}>
                <span className="text-accent-500 font-bold text-sm uppercase tracking-widest">Qui sommes-nous</span>
                <h2 className="text-3xl md:text-4xl font-bold text-surface-900 mt-3 mb-6 font-[var(--font-display)]">
                  Une communauté unie par la solidarité
                </h2>
              </motion.div>
              <motion.p variants={fadeInUp} className="text-surface-500 leading-relaxed mb-4">
                Fondée le 25 juillet 2021 lors de notre première assemblée générale, l'AFE est née de la conviction profonde que la solidarité est la clé d'une société plus juste et plus humaine.
              </motion.p>
              <motion.p variants={fadeInUp} className="text-surface-500 leading-relaxed mb-8">
                Notre mission : promouvoir l'entraide, organiser des événements solidaires et offrir un soutien concret aux personnes qui en ont besoin. Rejoignez-nous et participez à cette belle aventure collective. Aujourd'hui, l'AFE compte 24 membres actifs.
              </motion.p>
              <motion.div variants={fadeInUp} className="flex flex-wrap gap-3">
                {[
                  { icon: Heart, text: 'Solidarité' },
                  { icon: Users, text: 'Communauté' },
                  { icon: Shield, text: 'Confiance' },
                ].map((item) => (
                  <span key={item.text} className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-500 text-sm font-medium">
                    <item.icon className="w-4 h-4" />
                    {item.text}
                  </span>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Events */}
      <section className="section-padding bg-surface-50">
        <div className="container-custom">
          <SectionHeader
            subtitle="Nos événements"
            title="Prochains événements"
            description="Participez à nos événements et contribuez à renforcer les liens de notre communauté."
          />
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid md:grid-cols-3 gap-6">
            {featuredEvents.map((event) => (
              <motion.div key={event.id} variants={fadeInUp}>
                <EventCard event={event} />
              </motion.div>
            ))}
          </motion.div>
          <div className="text-center mt-10">
            <Link to="/evenements" className="btn-outline">
              Voir tous les événements
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Actualités */}
      <section className="section-padding">
        <div className="container-custom">
          <SectionHeader
            subtitle="Actualités"
            title="Les dernières nouvelles"
            description="Restez informé de l'actualité de l'association et de nos projets."
          />
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid md:grid-cols-3 gap-6">
            {latestNews.map((news) => (
              <motion.div key={news.id} variants={fadeInUp} className="card p-6">
                <div className="flex items-center gap-2 text-xs text-surface-400 mb-3">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(news.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <h3 className="text-lg font-bold text-surface-900 mb-2">{news.title}</h3>
                <p className="text-sm text-surface-500 line-clamp-3">{news.excerpt}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Don */}
      <section className="section-padding bg-surface-50">
        <div className="container-custom">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl p-10 md:p-16 text-center">
            <Heart className="w-12 h-12 text-white/80 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4 font-[var(--font-display)]">Soutenez l'AFE</h2>
            <p className="text-white/80 max-w-2xl mx-auto mb-6 leading-relaxed">
              Votre générosité nous permet de poursuivre nos actions solidaires. Chaque don, quelle que soit sa taille, fait la différence pour notre communauté.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <div className="bg-white/20 rounded-xl px-6 py-3 text-white">
                <p className="text-sm opacity-80">Président</p>
                <p className="text-lg font-bold">92 07 59 13</p>
              </div>
              <div className="bg-white/20 rounded-xl px-6 py-3 text-white">
                <p className="text-sm opacity-80">Secrétaire</p>
                <p className="text-lg font-bold">91 08 90 82</p>
              </div>
            </div>
            <Link to="/don" className="inline-flex items-center gap-2 bg-white text-primary-600 px-8 py-3.5 rounded-xl font-bold hover:bg-surface-50 transition-all">
              En savoir plus <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 overflow-hidden bg-gradient-to-br from-accent-600 to-accent-800">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
            <motion.div variants={fadeInUp}>
              <Handshake className="w-16 h-16 text-white/30 mx-auto mb-6" />
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 font-[var(--font-display)]">
                Rejoignez le mouvement
              </h2>
              <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
                Devenez membre de l'AFE et participez activement à nos projets solidaires. Ensemble, nous pouvons faire la différence.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/adhesion" className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white text-accent-600 font-bold hover:shadow-xl transition-all hover:-translate-y-0.5">
                  Devenir Membre
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                <Link to="/contact" className="inline-flex items-center justify-center px-8 py-4 rounded-xl border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-all">
                  Nous contacter
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
