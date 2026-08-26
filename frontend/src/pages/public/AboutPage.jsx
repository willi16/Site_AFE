import { motion } from 'framer-motion';
import { Heart, Users, Target, Eye, Handshake, Award, BookOpen } from 'lucide-react';
import SectionHeader from '../../components/ui/SectionHeader';

const fadeInUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const values = [
  { icon: Heart, title: 'Fraternité', description: 'Nous cultivons des liens authentiques basés sur le respect, la bienveillance et la solidarité entre tous les membres.' },
  { icon: Handshake, title: 'Entraide', description: "L'entraide est au cœur de notre démarche. Nous nous supportons mutuellement dans les moments difficiles et célébrons ensemble les réussites." },
  { icon: Users, title: 'Communauté', description: 'Nous construisons une communauté forte et unie, où chacun trouve sa place et peut contribuer au bien commun.' },
  { icon: Target, title: 'Engagement', description: "Chaque membre s'engage activement dans les projets de l'association, avec passion et détermination." },
  { icon: Eye, title: 'Transparence', description: "Nous croyons en une gestion transparente et responsable, rendant compte de nos actions à l'ensemble des membres." },
  { icon: Award, title: 'Excellence', description: "Nous visons l'excellence dans chacune de nos actions pour maximiser notre impact positif sur la communauté." },
];

function AboutPage() {
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="relative py-24 bg-gradient-to-br from-primary-800 to-primary-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-64 h-64 bg-accent-500 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="max-w-2xl">
            <span className="text-accent-400 font-bold text-sm uppercase tracking-widest">L'Association</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mt-3 mb-6 font-[var(--font-display)]">Qui sommes-nous ?</h1>
            <p className="text-lg text-white/70 leading-relaxed">
              Découvrez l'histoire, les valeurs et la mission de l'Association Fraternité et Entraide.
            </p>
          </motion.div>
        </div>
      </section>

      {/* History */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
              <span className="text-accent-500 font-bold text-sm uppercase tracking-widest">Notre histoire</span>
              <h2 className="text-3xl font-bold text-surface-900 mt-3 mb-6 font-[var(--font-display)]">5 ans d'engagement</h2>
              <p className="text-surface-500 leading-relaxed mb-4">
                Fondée le 25 juillet 2021 lors de notre première assemblée générale, l'Association Fraternité et Entraide est née de la conviction profonde que la solidarité est la clé d'une société plus juste et plus humaine.
              </p>
              <p className="text-surface-500 leading-relaxed mb-4">
                De modestes débuts avec une poignée de bénévoles engagés, nous avons grandi pour devenir un acteur incontournable de la vie associative locale, regroupant aujourd'hui 24 membres actifs.
              </p>
              <p className="text-surface-500 leading-relaxed">
                Au fil des années, nous avons organisé des dizaines d'événements, lancé des projets solidaires et créé un réseau de confiance qui continue de s'étendre chaque jour.
              </p>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
              <div className="relative">
                <div className="aspect-square bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl overflow-hidden flex items-center justify-center">
                  <img src="/logo-afe.jpg" alt="AFE Logo" className="w-32 h-32 rounded-2xl object-cover opacity-20" />
                </div>
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-accent-500 rounded-2xl flex items-center justify-center shadow-xl">
                  <span className="text-2xl font-bold text-white">5+</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section-padding bg-surface-50">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="bg-white p-8 rounded-3xl shadow-sm border border-surface-100">
              <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-primary-500" />
              </div>
              <h3 className="text-2xl font-bold text-surface-900 mb-4 font-[var(--font-display)]">Notre Mission</h3>
              <p className="text-surface-500 leading-relaxed">
                Promouvoir la solidarité et l'entraide au sein de notre communauté en organisant des événements, en offrant un soutien aux personnes vulnérables et en créant des espaces de rencontre et de partage.
              </p>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="bg-white p-8 rounded-3xl shadow-sm border border-surface-100">
              <div className="w-14 h-14 bg-accent-50 rounded-2xl flex items-center justify-center mb-6">
                <Eye className="w-7 h-7 text-accent-500" />
              </div>
              <h3 className="text-2xl font-bold text-surface-900 mb-4 font-[var(--font-display)]">Notre Vision</h3>
              <p className="text-surface-500 leading-relaxed">
                Être une référence en matière d'association solidaire, reconnue pour son impact positif, sa gouvernance transparente et sa capacité à fédérer une communauté engagée autour de valeurs communes.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding">
        <div className="container-custom">
          <SectionHeader subtitle="Nos valeurs" title="Ce qui nous anime" description="Les valeurs fondamentales qui guident chacune de nos actions." />
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid md:grid-cols-3 gap-6">
            {values.map((value, i) => (
              <motion.div key={i} variants={fadeInUp} className="bg-white p-8 rounded-2xl border border-surface-100 hover:shadow-xl hover:border-primary-200 transition-all group">
                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-primary-500 transition-colors">
                  <value.icon className="w-7 h-7 text-primary-500 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-surface-900 mb-3">{value.title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default AboutPage;
