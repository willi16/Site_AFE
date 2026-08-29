import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Users, Target, Eye, Handshake, Award, Crown, Star, Sparkles } from 'lucide-react';
import api from '../../api/axios';
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

function FoundingMembers() {
  const [founders, setFounders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/members/founders/').then(({ data }) => {
      setFounders(data.results || data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (founders.length === 0) return null;

  const initiator = founders.find(f => f.is_initiator) || founders[0];
  const others = founders.filter(f => f.id !== initiator.id);

  return (
    <section className="section-padding bg-gradient-to-b from-primary-900 to-primary-950 text-white overflow-hidden relative">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-72 h-72 bg-accent-500 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-primary-500 rounded-full blur-3xl" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-14">
          <span className="inline-flex items-center gap-2 text-accent-400 font-bold text-sm uppercase tracking-widest">
            <Sparkles className="w-4 h-4" /> Héritage
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4 font-[var(--font-display)]">Nos Membres Fondateurs</h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            Les bâtisseurs qui ont porté l'association à bras-le-corps dès ses origines.
          </p>
        </motion.div>

        {/* Initiateur / 1er président mis en avant */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="flex justify-center mb-16">
          <div className="relative transform hover:-translate-y-1 transition-transform">
            <div className="absolute -inset-1 bg-gradient-to-r from-accent-400 to-accent-600 rounded-[2rem] blur-md opacity-60" aria-hidden />
            <div className="relative bg-white/10 backdrop-blur border border-white/20 rounded-[2rem] p-8 text-center w-72">
              <div className="relative w-36 h-36 mx-auto mb-5">
                <div className="w-36 h-36 rounded-full overflow-hidden ring-4 ring-accent-400/70 bg-primary-100">
                  {initiator.photo ? (
                    <img src={initiator.photo} alt={initiator.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Crown className="w-14 h-14 text-primary-400" /></div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-11 h-11 rounded-full bg-accent-500 flex items-center justify-center shadow-lg border-4 border-primary-900">
                  <Crown className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-500/20 text-accent-300 text-xs font-bold uppercase tracking-wide mb-3">
                <Star className="w-3.5 h-3.5" /> {initiator.founder_title || "Initiateur · 1er Président"}
              </div>
              <h3 className="text-xl font-bold">{initiator.full_name}</h3>
            </div>
          </div>
        </motion.div>

        {/* Autres fondateurs */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {others.map((f) => (
            <motion.div key={f.id} variants={fadeInUp} className="group bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 hover:border-accent-400/40 transition-all">
              <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-white/20 mx-auto mb-4 bg-primary-100 group-hover:ring-accent-400/60 transition-all">
                {f.photo ? (
                  <img src={f.photo} alt={f.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Users className="w-8 h-8 text-primary-400" /></div>
                )}
              </div>
              <h4 className="font-semibold text-white">{f.full_name}</h4>
              {f.founder_title && <p className="text-xs text-white/60 mt-1">{f.founder_title}</p>}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

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
              Découvrez l'histoire, les valeurs et la mission de l'Association de Fraternité et d'Entraide.
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
                Fondée le 25 juillet 2021 lors de notre première assemblée générale, l'Association de Fraternité et d'Entraide est née de la conviction profonde que la solidarité est la clé d'une société plus juste et plus humaine.
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

      {/* Membres Fondateurs */}
      <FoundingMembers />

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
