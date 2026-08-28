import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, Plus, Pencil, Trash2, X } from 'lucide-react';
import api from '../../../api/axios';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { confirmAction, confirmDelete, showSuccess, showError, showLoading, closeLoading, extractError } from '../../../utils/swal';

const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function ActualitesManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', excerpt: '', content: '', is_published: true });
  const [image, setImage] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/actualites/', { params: { page_size: 100 } });
      setItems(data.results || data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', excerpt: '', content: '', is_published: true });
    setImage(null);
    setShowForm(true);
  };

  const openEdit = (a) => {
    setEditing(a);
    setForm({ title: a.title, excerpt: a.excerpt, content: a.content, is_published: a.is_published });
    setImage(null);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const verb = editing ? 'modifier' : 'publier';
    const ok = await confirmAction(`Publier cette actualité ?`, `Confirmez pour ${verb} « ${form.title} ».`, { icon: 'question', confirmText: `Oui, ${verb}` });
    if (!ok.isConfirmed) return;
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('excerpt', form.excerpt || '');
    fd.append('content', form.content);
    fd.append('is_published', form.is_published ? 'true' : 'false');
    if (image) fd.append('image', image);
    showLoading(editing ? 'Mise à jour...' : 'Publication...');
    try {
      if (editing) await api.patch(`/actualites/${editing.id}/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      else await api.post('/actualites/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      closeLoading();
      showSuccess('Actualité publiée', `« ${form.title} » a été ${editing ? 'mis à jour' : 'publié'}.`);
      setShowForm(false);
      load();
    } catch (err) {
      closeLoading();
      showError('Échec', extractError(err, 'Erreur lors de l\'enregistrement.'));
    }
  };

  const handleDelete = async (a) => {
    const ok = await confirmDelete(`l'actualité « ${a.title} »`);
    if (!ok.isConfirmed) return;
    showLoading('Suppression...');
    try {
      await api.delete(`/actualites/${a.id}/`);
      closeLoading();
      showSuccess('Actualité supprimée');
      load();
    } catch (err) { closeLoading(); showError('Échec', extractError(err, 'Suppression impossible.')); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-surface-900 flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-primary-500" /> Gestion des actualités
        </h2>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-all">
          <Plus className="w-4 h-4" /> Nouvelle actualité
        </button>
      </div>

      {showForm && (
        <motion.form initial="hidden" animate="visible" variants={fadeInUp} onSubmit={handleSubmit} className="mb-6 bg-white rounded-2xl border border-surface-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-surface-900">{editing ? 'Modifier l\'actualité' : 'Nouvelle actualité'}</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-surface-400 hover:text-surface-600"><X className="w-5 h-5" /></button>
          </div>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="Titre" className="input" />
          <textarea value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} rows={2} placeholder="Résumé (extrait)" className="input resize-none" />
          <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={5} required placeholder="Contenu de l'actualité" className="input resize-none" />
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">Image (facultatif)</label>
            <input type="file" accept="image/*" onChange={e => setImage(e.target.files[0] || null)} className="input" />
          </div>
          <label className="flex items-center gap-2 text-sm text-surface-700">
            <input type="checkbox" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500" />
            Publié
          </label>
          <div className="flex gap-2">
            <button type="submit" className="bg-primary-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary-600 transition-all">{editing ? 'Mettre à jour' : 'Publier'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl border border-surface-200 text-surface-600">Annuler</button>
          </div>
        </motion.form>
      )}

      {loading ? <LoadingSpinner className="py-10" /> : items.length === 0 ? (
        <p className="text-surface-500 text-center py-8">Aucune actualité.</p>
      ) : (
        <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 text-surface-500 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Titre</th>
                <th className="px-4 py-3 font-semibold">Extrait</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {items.map(a => (
                <tr key={a.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-surface-800">{a.title}</td>
                  <td className="px-4 py-3 text-surface-500">{a.excerpt}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${a.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                      {a.is_published ? 'Publié' : 'Brouillon'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(a)} title="Modifier" className="p-2 rounded-lg hover:bg-surface-100 text-surface-500"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(a)} title="Supprimer" className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
