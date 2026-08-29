import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Users, Calendar, Award, HandHeart, CheckCircle, Shield,
  BookOpen, ArrowRight, ChevronDown, AlertTriangle, FileText,
  CircleDollarSign, Clock, BadgeCheck, Gavel, Shirt, Upload, FileCheck,
} from 'lucide-react';
import api from '../../api/axios';
import { confirmAction, showSuccess, showError, showLoading, closeLoading, extractError } from '../../utils/swal';

const fadeInUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const registerSchema = z.object({
  first_name: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  last_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères"),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  phone: z.string().optional(),
  motivation: z.string().optional(),
  rgpd_consent: z.literal(true, { errorMap: () => ({ message: 'Vous devez accepter la politique de confidentialité' }) }),
});

const benefits = [
  {
    icon: Heart,
    title: 'Soutien financier',
    color: 'from-red-500 to-rose-500',
    bgColor: 'bg-red-50',
    iconColor: 'text-red-500',
    items: [
      { label: 'Mariage', amount: '100 000 FCFA' },
      { label: 'Décès (père / mère / belle-famille)', amount: '250 000 FCFA' },
      { label: 'Nouvelle naissance', amount: '50 000 FCFA' },
      { label: 'Hospitalisation', amount: '50 000 – 150 000 FCFA' },
      { label: 'Libération d\'un membre ou de la femme', amount: '50 000 FCFA' },
    ],
  },
  {
    icon: Users,
    title: 'Communauté solidaire',
    color: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-500',
    items: [
      { label: 'Membres actifs unis par la fraternité', amount: '24 membres' },
      { label: 'Réunions mensuelles', amount: 'Dernier dimanche du mois' },
    ],
  },
  {
    icon: Calendar,
    title: 'Activités et événements',
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50',
    iconColor: 'text-amber-500',
    items: [
      { label: 'Événements sociaux, culturels et éducatifs', amount: null },
      { label: 'Réunions ordinaires et extraordinaires', amount: null },
    ],
  },
  {
    icon: Award,
    title: 'Développement personnel',
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    items: [
      { label: 'Promotion de l\'entreprenariat', amount: null },
      { label: 'Partage de compétences', amount: null },
    ],
  },
];

const adhesionConditions = [
  'Demande écrite d\'adhésion avec acceptation des statuts et du règlement intérieur',
  'Admission validée par le Bureau Exécutif',
  'Droit d\'adhésion : 50 000 FCFA + une bouteille de Grant\'s',
  'Les frais sont payables dans les 6 mois suivant la première réunion assistée',
  'La cotisation mensuelle est de 2 000 FCFA (réunion du dernier dimanche du mois)',
  'Les membres en retard de paiement n\'ont pas droit aux assistances',
  'Les membres en retard de 3 mois seront convoqués par le Bureau Exécutif',
];

const contributions = [
  { label: 'Mariage', amount: '5 000', icon: '💒' },
  { label: 'Nouvelle naissance', amount: '3 000', icon: '👶' },
  { label: 'Hospitalisation', amount: '5 000', icon: '🏥' },
  { label: 'Décès', amount: '10 000', icon: '🕊️' },
  { label: 'Libération', amount: '3 000', icon: '🤲' },
];

const rules = [
  {
    icon: Clock,
    title: 'Retards',
    items: [
      { text: 'Retard supérieur à 15 minutes', penalty: '200 FCFA' },
    ],
  },
  {
    icon: AlertTriangle,
    title: 'Absences',
    items: [
      { text: 'Absence non justifiée', penalty: '500 FCFA' },
      { text: 'Absence justifiée', penalty: '200 FCFA' },
      { text: '3 absences consécutives non justifiées', penalty: 'Avertissement' },
      { text: '4ème absence', penalty: 'Exclusion' },
    ],
  },
  {
    icon: Shirt,
    title: 'Tenue vestimentaire',
    items: [
      { text: 'Débardeur, sans manche ou short', penalty: '1 000 FCFA' },
    ],
  },
];

function AccordionItem({ rule, isOpen, onToggle, index }) {
  return (
    <div className="border border-surface-200 rounded-2xl overflow-hidden bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-surface-50 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
          <rule.icon className="w-5 h-5 text-red-500" />
        </div>
        <span className="font-semibold text-surface-800 flex-1">{rule.title}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-5 h-5 text-surface-400" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-3">
              {rule.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-4 py-3 px-4 bg-red-50/50 rounded-xl border border-red-100">
                  <span className="text-sm text-surface-600">{item.text}</span>
                  <span className="text-sm font-bold text-red-600 shrink-0 bg-white px-3 py-1 rounded-lg border border-red-100">
                    {item.penalty}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AdhesionPage() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openAccordion, setOpenAccordion] = useState(0);
  const [demandLetter, setDemandLetter] = useState(null);
  const [supportingDocs, setSupportingDocs] = useState(null);
  const [demandLetterName, setDemandLetterName] = useState('');
  const [supportingDocsName, setSupportingDocsName] = useState('');
  const [passportPhoto, setPassportPhoto] = useState(null);
  const [idFront, setIdFront] = useState(null);
  const [idBack, setIdBack] = useState(null);
  const [passportPhotoName, setPassportPhotoName] = useState('');
  const [idFrontName, setIdFrontName] = useState('');
  const [idBackName, setIdBackName] = useState('');
  const demandLetterRef = useRef(null);
  const supportingDocsRef = useRef(null);
  const passportPhotoRef = useRef(null);
  const idFrontRef = useRef(null);
  const idBackRef = useRef(null);
  const { register, handleSubmit, trigger, watch, setValue, formState: { errors } } = useForm({ resolver: zodResolver(registerSchema), defaultValues: { username: '' } });

  const [firstName, lastName, username] = watch(['first_name', 'last_name', 'username']);
  const usernameEdited = useRef(false);
  const lastSuggested = useRef('');

  useEffect(() => {
    if (usernameEdited.current) return;
    const strip = (s) => (s || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const fn = strip(firstName).replace(/[^a-z0-9]+/g, '.');
    const ln = strip(lastName).replace(/[^a-z0-9]+/g, '.');
    const base = [fn, ln].filter(Boolean).join('.');
    if (fn && ln) {
      const suggested = base.replace(/^\.+|\.+$/g, '');
      if (!username || username === lastSuggested.current) {
        lastSuggested.current = suggested;
        setValue('username', suggested, { shouldValidate: false });
      }
    }
  }, [firstName, lastName, username, setValue]);


  const backStep = () => {
    setError('');
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (data) => {
    if (step === 1) {
      const valid = await trigger(['first_name', 'last_name', 'username', 'email', 'password']);
      if (valid) {
        setError('');
        setStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }
    if (!passportPhoto || !idFront || !idBack) {
      setError('La photo passeport et la pièce d\'identité (recto et verso) sont obligatoires pour l\'adhésion.');
      return;
    }
    const ok = await confirmAction(
      'Soumettre votre candidature ?',
      `Confirmez l'envoi de la candidature d'adhésion de ${data.first_name} ${data.last_name} (${data.email}). Le bureau l'examinera prochainement.`,
      { icon: 'question', confirmText: 'Oui, soumettre' }
    );
    if (!ok.isConfirmed) return;
    try {
      setLoading(true);
      setError('');
      const formData = new FormData();
      formData.append('username', data.username);
      formData.append('email', data.email);
      formData.append('password', data.password);
      formData.append('first_name', data.first_name);
      formData.append('last_name', data.last_name);
      formData.append('rgpd_consent', 'true');
      if (data.phone) formData.append('phone', data.phone);
      if (data.motivation) formData.append('motivation', data.motivation);
      if (passportPhoto) formData.append('photo', passportPhoto);
      if (idFront) formData.append('id_front', idFront);
      if (idBack) formData.append('id_back', idBack);
      if (demandLetter) formData.append('demand_letter', demandLetter);
      if (supportingDocs) formData.append('supporting_documents', supportingDocs);
      showLoading('Envoi de la candidature...');
      await api.post('/members/apply/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      closeLoading();
      setSubmitted(true);
      showSuccess('Candidature soumise', 'Votre demande d\'adhésion a bien été transmise au bureau.');
    } catch (err) {
      closeLoading();
      const detail = err.response?.data?.detail || err.response?.data?.username?.[0] || err.response?.data?.email?.[0] || "Erreur lors de l'inscription. Veuillez réessayer.";
      setError(Array.isArray(detail) ? detail[0] : detail);
      showError('Échec de la soumission', Array.isArray(detail) ? detail[0] : detail);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e, setter, nameSetter) => {
    const file = e.target.files[0];
    if (file) {
      setter(file);
      nameSetter(file.name);
    }
  };

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="relative py-24 bg-gradient-to-br from-primary-800 to-primary-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-accent-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="max-w-3xl">
            <span className="text-accent-400 font-bold text-sm uppercase tracking-widest">Adhésion</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mt-3 mb-6 font-[var(--font-display)]">
              Rejoignez l'Association de Fraternité et d'Entraide
            </h1>
            <p className="text-lg text-white/70">
              Devenez membre de l'AFE et bénéficiez d'un soutien solidaire au sein d'une communauté fraternelle.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section-padding">
        <div className="container-custom">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-14">
            <span className="text-primary-500 font-bold text-sm uppercase tracking-widest">Nos avantages</span>
            <h2 className="text-3xl font-bold text-surface-900 mt-3 font-[var(--font-display)]">
              Pourquoi adhérer à l'AFE ?
            </h2>
            <p className="text-surface-500 mt-3 max-w-2xl mx-auto">
              L'AFE vous offre un cadre solidaire avec des avantages concrets définis par nos statuts.
            </p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="group relative bg-white rounded-3xl border border-surface-100 p-7 hover:shadow-lg hover:border-surface-200 transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-5">
                  <div className={`w-12 h-12 rounded-2xl ${benefit.bgColor} flex items-center justify-center`}>
                    <benefit.icon className={`w-6 h-6 ${benefit.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-bold text-surface-900">{benefit.title}</h3>
                </div>
                <div className="space-y-2.5">
                  {benefit.items.map((item, j) => (
                    <div key={j} className="flex items-center justify-between py-2.5 px-4 bg-surface-50/80 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <BadgeCheck className={`w-4 h-4 ${benefit.iconColor} shrink-0`} />
                        <span className="text-sm text-surface-600">{item.label}</span>
                      </div>
                      {item.amount && (
                        <span className={`text-sm font-bold ${benefit.iconColor} bg-white px-3 py-1 rounded-lg border border-surface-100 shrink-0`}>
                          {item.amount}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Conditions d'adhésion */}
      <section className="section-padding bg-surface-50">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
              <span className="text-primary-500 font-bold text-sm uppercase tracking-widest">Rejoignez-nous</span>
              <h2 className="text-3xl font-bold text-surface-900 mt-3 mb-6 font-[var(--font-display)]">
                Conditions d'adhésion
              </h2>
              <p className="text-surface-500 mb-8">
                Voici les conditions à remplir pour devenir membre de l'Association de Fraternité et d'Entraide, conformément à nos statuts.
              </p>
              <div className="space-y-3">
                {adhesionConditions.map((condition, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex gap-3 items-start"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary-600">{i + 1}</span>
                    </div>
                    <p className="text-sm text-surface-600 leading-relaxed">{condition}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Cotisations et contributions */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
              <div className="bg-white rounded-3xl border border-surface-100 p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center">
                    <CircleDollarSign className="w-5 h-5 text-accent-500" />
                  </div>
                  <h3 className="text-xl font-bold text-surface-900">Cotisations et contributions</h3>
                </div>
                <p className="text-sm text-surface-500 mb-6">
                  Montant versé par chaque membre lors d'un événement :
                </p>
                <div className="space-y-3">
                  {contributions.map((c, i) => (
                    <motion.div
                      key={i}
                      variants={fadeInUp}
                      className="flex items-center justify-between py-3.5 px-5 bg-gradient-to-r from-surface-50 to-white rounded-2xl border border-surface-100"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{c.icon}</span>
                        <span className="text-sm font-medium text-surface-700">{c.label}</span>
                      </div>
                      <span className="text-sm font-bold text-primary-600 bg-primary-50 px-4 py-1.5 rounded-xl">
                        {c.amount} FCFA
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Règles importantes */}
      <section className="section-padding">
        <div className="container-custom">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Gavel className="w-4 h-4" />
              Règlement intérieur
            </div>
            <h2 className="text-3xl font-bold text-surface-900 font-[var(--font-display)]">
              Règles importantes
            </h2>
            <p className="text-surface-500 mt-3 max-w-xl mx-auto">
              Le respect de ces règles est essentiel au bon fonctionnement de l'association.
            </p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="max-w-2xl mx-auto space-y-3">
            {rules.map((rule, i) => (
              <motion.div key={i} variants={fadeInUp}>
                <AccordionItem
                  rule={rule}
                  index={i}
                  isOpen={openAccordion === i}
                  onToggle={() => setOpenAccordion(openAccordion === i ? -1 : i)}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Formulaire d'inscription */}
      <section className="section-padding bg-surface-50">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left info */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
              <span className="text-primary-500 font-bold text-sm uppercase tracking-widest">Inscription</span>
              <h2 className="text-3xl font-bold text-surface-900 mt-3 mb-6 font-[var(--font-display)]">
                Formulaire d'adhésion
              </h2>
              <p className="text-surface-500 mb-8">
                Complétez le formulaire pour rejoindre l'AFE. Votre demande sera examinée par le Bureau Exécutif.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-surface-100">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-surface-800 text-sm">Demande écrite</h4>
                    <p className="text-xs text-surface-500 mt-1">Votre inscription vaut acceptation des statuts et du règlement intérieur.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-surface-100">
                  <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-accent-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-surface-800 text-sm">Validation du BE</h4>
                    <p className="text-xs text-surface-500 mt-1">Le Bureau Exécutif valide votre admission après réception du formulaire.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-surface-100">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <CircleDollarSign className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-surface-800 text-sm">Droit d'adhésion</h4>
                    <p className="text-xs text-surface-500 mt-1">50 000 FCFA + une bouteille de Grant's, payables en 6 mois.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Form */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
              {submitted ? (
                <div className="bg-green-50 border border-green-200 rounded-3xl p-12 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-green-800 mb-2">Inscription réussie !</h3>
                  <p className="text-green-600">
                    Bienvenue dans l'AFE. Votre demande sera examinée par le Bureau Exécutif.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-3xl border border-surface-100 shadow-sm">
                  <h2 className="text-xl font-bold text-surface-900 mb-2 font-[var(--font-display)]">
                    {step === 1 ? 'Créer votre compte' : 'Vos documents'}
                  </h2>
                  {/* Indicateur de progression */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary-600' : 'text-surface-300'}`}>
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-primary-500 text-white' : 'bg-surface-100 text-surface-400'}`}>1</span>
                      <span className="text-xs font-semibold">Identité & contact</span>
                    </div>
                    <div className={`h-0.5 flex-1 rounded ${step >= 2 ? 'bg-primary-400' : 'bg-surface-200'}`} />
                    <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary-600' : 'text-surface-300'}`}>
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-primary-500 text-white' : 'bg-surface-100 text-surface-400'}`}>2</span>
                      <span className="text-xs font-semibold">Documents & consentement</span>
                    </div>
                  </div>
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">{error}</div>
                  )}
                  {step === 1 ? (
                    <>
                      <div className="grid sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-semibold text-surface-700 mb-1.5">Prénom *</label>
                          <input
                            {...register('first_name')}
                            className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm"
                          />
                          {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-surface-700 mb-1.5">Nom *</label>
                          <input
                            {...register('last_name')}
                            className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm"
                          />
                          {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>}
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-surface-700 mb-1.5">Nom d'utilisateur *</label>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <input
                              {...register('username')}
                              onChange={(e) => { usernameEdited.current = true; register('username').onChange(e); }}
                              placeholder="generé automatiquement à partir de votre nom"
                              className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm"
                            />
                          </div>
                          {username && (
                            <button type="button" onClick={() => { usernameEdited.current = false; lastSuggested.current = ''; }} className="px-3 py-2.5 rounded-xl bg-surface-50 text-primary-600 text-xs font-semibold hover:bg-primary-50 border border-surface-100 whitespace-nowrap" title="Régénérer automatiquement">
                              Auto
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-surface-400 mt-1.5">Généré automatiquement à partir de votre prénom et nom (prenom.nom). Vous pouvez le modifier.</p>
                        {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-surface-700 mb-1.5">Email *</label>
                        <input
                          {...register('email')}
                          type="email"
                          className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm"
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-surface-700 mb-1.5">Mot de passe *</label>
                        <input
                          {...register('password')}
                          type="password"
                          className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm"
                        />
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-surface-700 mb-1.5">Téléphone</label>
                        <input
                          {...register('phone')}
                          className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm"
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-surface-700 mb-1.5">Motivation</label>
                        <textarea
                          {...register('motivation')}
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm resize-none"
                          placeholder="Décrivez votre motivation pour rejoindre l'AFE..."
                        />
                      </div>
                      <button type="submit" className="btn-accent w-full py-3.5">
                        <ArrowRight className="w-5 h-5 mr-2" />
                        Continuer
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-surface-700 mb-1.5">Lettre de demande</label>
                      <input
                        ref={demandLetterRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, setDemandLetter, setDemandLetterName)}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => demandLetterRef.current?.click()}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-surface-300 hover:border-primary-400 hover:bg-primary-50/30 transition-all text-sm"
                      >
                        {demandLetterName ? (
                          <>
                            <FileCheck className="w-5 h-5 text-primary-500 shrink-0" />
                            <span className="text-surface-700 truncate">{demandLetterName}</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-surface-400 shrink-0" />
                            <span className="text-surface-400">Choisir un fichier</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-surface-700 mb-1.5">Documents justificatifs</label>
                      <input
                        ref={supportingDocsRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, setSupportingDocs, setSupportingDocsName)}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => supportingDocsRef.current?.click()}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-surface-300 hover:border-primary-400 hover:bg-primary-50/30 transition-all text-sm"
                      >
                        {supportingDocsName ? (
                          <>
                            <FileCheck className="w-5 h-5 text-primary-500 shrink-0" />
                            <span className="text-surface-700 truncate">{supportingDocsName}</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-surface-400 shrink-0" />
                            <span className="text-surface-400">Choisir un fichier</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mb-6 bg-amber-50 border border-amber-100 rounded-2xl p-4">
                    <p className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Documents obligatoires
                    </p>
                    <div className="grid sm:grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-surface-700 mb-1.5">Photo passeport *</label>
                        <input
                          ref={passportPhotoRef}
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e, setPassportPhoto, setPassportPhotoName)}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => passportPhotoRef.current?.click()}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-surface-300 hover:border-primary-400 hover:bg-primary-50/30 transition-all text-sm"
                        >
                          {passportPhotoName ? (
                            <>
                              <FileCheck className="w-5 h-5 text-primary-500 shrink-0" />
                              <span className="text-surface-700 truncate">{passportPhotoName}</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-5 h-5 text-surface-400 shrink-0" />
                              <span className="text-surface-400">Choisir la photo passeport</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-surface-700 mb-1.5">Pièce d'identité — recto *</label>
                        <input
                          ref={idFrontRef}
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e, setIdFront, setIdFrontName)}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => idFrontRef.current?.click()}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-surface-300 hover:border-primary-400 hover:bg-primary-50/30 transition-all text-sm"
                        >
                          {idFrontName ? (
                            <>
                              <FileCheck className="w-5 h-5 text-primary-500 shrink-0" />
                              <span className="text-surface-700 truncate">{idFrontName}</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-5 h-5 text-surface-400 shrink-0" />
                              <span className="text-surface-400">Choisir le recto</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-surface-700 mb-1.5">Pièce d'identité — verso *</label>
                        <input
                          ref={idBackRef}
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(e, setIdBack, setIdBackName)}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => idBackRef.current?.click()}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-surface-300 hover:border-primary-400 hover:bg-primary-50/30 transition-all text-sm"
                        >
                          {idBackName ? (
                            <>
                              <FileCheck className="w-5 h-5 text-primary-500 shrink-0" />
                              <span className="text-surface-700 truncate">{idBackName}</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-5 h-5 text-surface-400 shrink-0" />
                              <span className="text-surface-400">Choisir le verso</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('rgpd_consent')}
                        className="mt-1 w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                      />
                      <span className="text-xs text-surface-500 leading-relaxed">
                        J'accepte la politique de protection des données personnelles (RGPD) et consens au traitement de mes données par l'AFE. *
                      </span>
                    </label>
                    {errors.rgpd_consent && <p className="text-red-500 text-xs mt-1">{errors.rgpd_consent.message}</p>}
                  </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={backStep}
                          className="btn-secondary flex-1 py-3.5"
                        >
                          Précédent
                        </button>
                        <button type="submit" disabled={loading} className="btn-accent flex-1 py-3.5">
                          <HandHeart className="w-5 h-5 mr-2" />
                          {loading ? 'Inscription en cours...' : "S'inscrire à l'AFE"}
                        </button>
                      </div>
                    </>
                  )}
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AdhesionPage;
