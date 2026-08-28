import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Clock, CheckCircle } from 'lucide-react';
import SectionHeader from '../../components/ui/SectionHeader';
import api from '../../api/axios';
import { confirmAction, showSuccess, showError, showLoading, closeLoading, extractError } from '../../utils/swal';

const fadeInUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

const contactSchema = z.object({
  full_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  subject: z.enum(['info', 'adhesion', 'partnership', 'other'], { required_error: 'Veuillez choisir un sujet' }),
  message: z.string().min(10, 'Le message doit contenir au moins 10 caractères'),
});

const contactInfo = [
  { icon: Mail, label: 'Email', value: 'associationfe@gmail.com', color: 'bg-blue-50 text-blue-600' },
  { icon: Phone, label: 'Téléphone', value: '91 08 90 82 / 92 07 59 13 / 98 15 05 42', color: 'bg-green-50 text-green-600' },
  { icon: MapPin, label: 'Adresse', value: 'Agodékè', color: 'bg-purple-50 text-purple-600' },
  { icon: Clock, label: 'Horaires', value: 'Lun - Ven : 9h - 18h', color: 'bg-orange-50 text-orange-600' },
];

function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm({ resolver: zodResolver(contactSchema) });

  const onSubmit = async (data) => {
    const ok = await confirmAction(
      'Envoyer le message ?',
      `Votre message sera transmis à l'association. Merci de vérifier vos informations.`,
      { icon: 'question', confirmText: 'Oui, envoyer' }
    );
    if (!ok.isConfirmed) return;
    try {
      setLoading(true);
      showLoading('Envoi du message...');
      await api.post('/contact/', data);
      closeLoading();
      showSuccess('Message envoyé', 'Merci, votre message a bien été transmis.');
      setSubmitted(true);
      reset();
    } catch (err) {
      closeLoading();
      console.error(err);
      showError('Échec de l\'envoi', extractError(err, 'Impossible d\'envoyer le message en ce moment.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-20">
      <section className="relative py-24 bg-gradient-to-br from-primary-800 to-primary-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-accent-500 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="max-w-2xl">
            <span className="text-accent-400 font-bold text-sm uppercase tracking-widest">Contact</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mt-3 mb-6 font-[var(--font-display)]">Parlons ensemble</h1>
            <p className="text-lg text-white/70">Une question, une suggestion ou envie de nous rejoindre ? Écrivez-nous.</p>
          </motion.div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              {submitted ? (
                <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="bg-green-50 border border-green-200 rounded-2xl p-12 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-green-800 mb-2">Message envoyé !</h3>
                  <p className="text-green-600">Merci pour votre message. Nous vous répondrons dans les plus brefs délais.</p>
                  <button onClick={() => setSubmitted(false)} className="mt-6 btn-primary">Envoyer un autre message</button>
                </motion.div>
              ) : (
                <motion.form initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-3xl border border-surface-100 shadow-sm">
                  <div className="grid sm:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-semibold text-surface-700 mb-2">Nom complet *</label>
                      <input {...register('full_name')} className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all" placeholder="Votre nom" />
                      {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-surface-700 mb-2">Email *</label>
                      <input {...register('email')} type="email" className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all" placeholder="votre@email.com" />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-surface-700 mb-2">Téléphone</label>
                      <input {...register('phone')} className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all" placeholder="91 08 90 82" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-surface-700 mb-2">Sujet *</label>
                      <select {...register('subject')} className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-white">
                        <option value="">Choisir un sujet</option>
                        <option value="info">Demande d'information</option>
                        <option value="adhesion">Adhésion</option>
                        <option value="partnership">Partenariat</option>
                        <option value="other">Autre</option>
                      </select>
                      {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>}
                    </div>
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-surface-700 mb-2">Message *</label>
                    <textarea {...register('message')} rows={6} className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all resize-none" placeholder="Votre message..." />
                    {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
                    <Send className="w-4 h-4 mr-2" />
                    {loading ? 'Envoi en cours...' : 'Envoyer le message'}
                  </button>
                </motion.form>
              )}
            </div>

            <div className="space-y-4">
              {contactInfo.map((info, i) => (
                <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-surface-100">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${info.color}`}>
                    <info.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-surface-400 uppercase tracking-wider">{info.label}</div>
                    <div className="text-sm font-semibold text-surface-900">{info.value}</div>
                  </div>
                </motion.div>
              ))}
              <div className="bg-surface-100 rounded-2xl h-48 flex items-center justify-center">
                <div className="text-center text-surface-400">
                  <MapPin className="w-8 h-8 mx-auto mb-2" />
                  <span className="text-sm">Carte interactive</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ContactPage;
