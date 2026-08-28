import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Trash2, Pencil, Upload } from 'lucide-react';
import api from '../../../api/axios';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { useAuth } from '../../../context/AuthContext';
import { confirmAction, confirmDelete, showSuccess, showError, showLoading, closeLoading, extractError } from '../../../utils/swal';

const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const EMPTY_FORM = { title: '', description: '', short_description: '', event_date: '', end_date: '', location: '', status: 'upcoming', image: null };

export default function EventsManager() {
  const { isSecretary, isAdmin } = useAuth();
  const canEdit = isSecretary || isAdmin;
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/events/', { params: { page_size: 100 } });
      setEvents(data.results || data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = async (ev) => {
    try {
      const { data } = await api.get(`/events/${ev.id}/`);
      setForm({
        title: data.title || '',
        description: data.description || '',
        short_description: data.short_description || '',
        event_date: data.event_date ? data.event_date.slice(0, 16) : '',
        end_date: data.end_date ? data.end_date.slice(0, 16) : '',
        location: data.location || '',
        status: data.status || 'upcoming',
        image: null,
      });
      setEditingId(ev.id);
      setShowForm(true);
    } catch (err) {
      showError('Erreur', extractError(err, 'Impossible de charger l\'événement.'));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!editingId;
    const ok = await confirmAction(
      isEdit ? 'Modifier cet événement ?' : 'Créer cet événement ?',
      `« ${form.title} » programmé le ${form.event_date ? new Date(form.event_date + (form.event_date.length === 16 ? ':00' : '')).toLocaleString('fr-FR') : 'date à définir'} à ${form.location || 'lieu à définir'}.`,
      { icon: 'question', confirmText: isEdit ? 'Oui, modifier' : 'Oui, créer' }
    );
    if (!ok.isConfirmed) return;
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v && k !== 'image') fd.append(k, v); });
    if (form.image) fd.append('image', form.image);
    showLoading(isEdit ? 'Modification de l\'événement...' : 'Création de l\'événement...');
    try {
      let data;
      if (isEdit) {
        const res = await api.patch(`/events/${editingId}/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        data = res.data;
      } else {
        const res = await api.post('/events/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        data = res.data;
      }
      if (form.image && data.id) {
        const imgFd = new FormData();
        imgFd.append('image', form.image);
        imgFd.append('caption', form.title);
        await api.post(`/events/${data.id}/images/`, imgFd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      closeLoading();
      showSuccess(isEdit ? 'Événement modifié' : 'Événement créé', `L'événement « ${form.title} » a été ${isEdit ? 'mis à jour' : 'publié'}.`);
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      load();
    } catch (err) { closeLoading(); console.error(err); showError(isEdit ? 'Échec de la modification' : 'Échec de la création', extractError(err, 'Erreur lors de l\'enregistrement de l\'événement.')); }
  };

  const handleDelete = async (ev) => {
    const ok = await confirmDelete(`l'événement « ${ev.title} »`, 'Cette action est irréversible.');
    if (!ok.isConfirmed) return;
    showLoading('Suppression en cours...');
    try { await api.delete(`/events/${ev.id}/`); closeLoading(); showSuccess('Événement supprimé'); load(); }
    catch (err) { closeLoading(); showError('Suppression impossible', extractError(err, 'Impossible de supprimer cet événement.')); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-surface-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-500" /> Gestion des Événements
        </h2>
        {canEdit && (
          <button onClick={openCreate} className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-all">
            <Plus className="w-4 h-4" /> Créer un événement
          </button>
        )}
      </div>

      {canEdit && showForm && (
        <motion.form initial="hidden" animate="visible" variants={fadeInUp} onSubmit={onSubmit} className="mb-6 bg-white rounded-2xl border border-surface-100 p-6 space-y-4">
          <h3 className="font-bold text-surface-900">{editingId ? 'Modifier l\'événement' : 'Nouvel événement'}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="Titre" className="input sm:col-span-2" />
            <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Lieu" className="input" />
            <input value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} type="datetime-local" className="input" />
            <input value={form.short_description} onChange={e => setForm({ ...form, short_description: e.target.value })} placeholder="Résumé court" className="input" />
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input">
              <option value="upcoming">À venir</option>
              <option value="past">Passé</option>
            </select>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={3} className="input sm:col-span-2" />
            <label className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-surface-300 cursor-pointer text-sm text-surface-500 hover:border-primary-400 sm:col-span-2">
              <Upload className="w-4 h-4" /> {form.image ? form.image.name : 'Image de l\'événement (optionnel)'}
              <input type="file" accept="image/*" onChange={e => setForm({ ...form, image: e.target.files[0] })} className="hidden" />
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-primary-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary-600">{editingId ? 'Modifier' : 'Créer'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2.5 rounded-xl border border-surface-200 text-surface-600">Annuler</button>
          </div>
        </motion.form>
      )}

      {loading ? <LoadingSpinner className="py-10" /> : events.length === 0 ? (
        <p className="text-surface-500 text-center py-8">Aucun événement.</p>
      ) : (
        <div className="space-y-3">
          {events.map(ev => (
            <div key={ev.id} className="bg-white rounded-2xl border border-surface-100 p-5 flex items-center justify-between hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center shrink-0"><Calendar className="w-5 h-5 text-primary-500" /></div>
                <div>
                  <p className="font-semibold text-surface-900 text-sm flex items-center gap-2">
                    {ev.title}
                    {ev.is_monthly_assembly && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">Assemblée mensuelle</span>
                    )}
                  </p>
                  <p className="text-xs text-surface-400">
                    {ev.event_date?.slice(0,10)} · {ev.location} · {ev.status === 'upcoming' ? 'À venir' : 'Passé'}
                  </p>
                </div>
              </div>
              {canEdit && (
                <div className="flex gap-1">
                  <button onClick={() => openEdit(ev)} title="Modifier" className="p-2 rounded-lg text-primary-500 hover:bg-primary-50"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(ev)} className="p-2 rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
