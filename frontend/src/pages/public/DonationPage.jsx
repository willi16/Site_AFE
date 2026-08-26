import { motion } from 'framer-motion';
import { Heart, Phone, CreditCard, Shield, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const fadeInUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const phoneNumbers = [
  { name: 'Président', number: '91 08 90 82', role: 'Président de l\'AFE' },
  { name: 'Secrétaire', number: '92 07 59 13', role: 'Secrétaire de l\'AFE' },
];

const donationMethods = [
  {
    icon: Phone,
    title: 'Mobile Money',
    description: 'Envoyez votre don via Mobile Money aux numéros ci-dessous',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: CreditCard,
    title: 'Virement bancaire',
    description: 'Contactez-nous pour les coordonnées bancaires',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Users,
    title: 'Don en espèces',
    description: 'Remettez votre don directement au siège de l\'association',
    color: 'bg-amber-50 text-amber-600',
  },
];

function DonationPage() {
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="relative py-24 bg-gradient-to-br from-accent-600 to-accent-800 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-primary-500 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="max-w-3xl text-center mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Heart className="w-4 h-4" />
              Soutenez l'AFE
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 font-[var(--font-display)]">
              Faites un don à l'AFE
            </h1>
            <p className="text-lg text-white/80 leading-relaxed">
              Votre générosité nous permet de poursuivre nos actions solidaires et d'aider ceux qui en ont besoin. Chaque don, quelle que soit sa taille, fait la différence.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Phone Numbers */}
      <section className="section-padding">
        <div className="container-custom">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-12">
            <span className="text-primary-500 font-bold text-sm uppercase tracking-widest">Numéros de contact</span>
            <h2 className="text-3xl font-bold text-surface-900 mt-3 font-[var(--font-display)]">Envoyez votre don</h2>
            <p className="text-surface-500 mt-3 max-w-xl mx-auto">
              Utilisez ces numéros pour envoyer votre don via Mobile Money ou pour contacter le bureau.
            </p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {phoneNumbers.map((phone, i) => (
              <motion.div key={i} variants={fadeInUp} className="bg-white rounded-3xl border border-surface-100 p-8 text-center hover:shadow-lg transition-all">
                <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-primary-500" />
                </div>
                <h3 className="text-lg font-bold text-surface-900 mb-1">{phone.role}</h3>
                <p className="text-2xl font-bold text-primary-500 mb-2">{phone.number}</p>
                <p className="text-sm text-surface-400">Cliquez pour appeler</p>
                <a href={`tel:${phone.number.replace(/\s/g, '')}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary-500 hover:text-primary-600">
                  Appeler <ArrowRight className="w-4 h-4" />
                </a>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Donation Methods */}
      <section className="section-padding bg-surface-50">
        <div className="container-custom">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-12">
            <span className="text-primary-500 font-bold text-sm uppercase tracking-widest">Modes de don</span>
            <h2 className="text-3xl font-bold text-surface-900 mt-3 font-[var(--font-display)]">Comment donner ?</h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid md:grid-cols-3 gap-6">
            {donationMethods.map((method, i) => (
              <motion.div key={i} variants={fadeInUp} className="bg-white rounded-3xl border border-surface-100 p-8 text-center hover:shadow-lg transition-all">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${method.color}`}>
                  <method.icon className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-surface-900 mb-3">{method.title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{method.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Impact */}
      <section className="section-padding">
        <div className="container-custom">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl p-10 md:p-16 text-center">
            <Shield className="w-12 h-12 text-white/80 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4 font-[var(--font-display)]">Votre don compte</h2>
            <p className="text-white/80 max-w-2xl mx-auto mb-8 leading-relaxed">
              Chaque franc CFA contribue à nos actions : soutien aux membres en difficulté, organisation d'événements, projets solidaires et développement de notre communauté.
            </p>
            <Link to="/adhesion" className="inline-flex items-center gap-2 bg-white text-primary-600 px-8 py-3.5 rounded-xl font-bold hover:bg-surface-50 transition-all">
              Devenir membre <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default DonationPage;
