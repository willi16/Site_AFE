import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, Trash2, Play, Film, Image as ImageIcon, X } from 'lucide-react';
import api from '../../../api/axios';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { useAuth } from '../../../context/AuthContext';
import { confirmAction, confirmDelete, showSuccess, showError, showLoading, closeLoading, extractError } from '../../../utils/swal';

const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function GalleryManager() {
  const { isSecretary, isAdmin } = useAuth();
  const canEdit = isSecretary || isAdmin;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({ title: '', caption: '', category: '', file_type: 'image', file: null });

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/gallery/', { params: { page_size: 100 } });
      setItems(data.results || data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!form.file) { showError('Média requis', 'Veuillez choisir une image ou une vidéo.'); return; }
    const ok = await confirmAction(
      'Ajouter ce média ?',
      `« ${form.title || form.file.name} » sera ajouté à la galerie en tant que ${form.file_type === 'image' ? 'image' : 'vidéo'}.`,
      { icon: 'question', confirmText: 'Oui, ajouter' }
    );
    if (!ok.isConfirmed) return;
    const fd = new FormData();
    fd.append('title', form.title || form.file.name);
    fd.append('caption', form.caption);
    fd.append('category', form.category);
    fd.append('file_type', form.file_type);
    if (form.file_type === 'image') fd.append('image', form.file);
    else fd.append('video', form.file);
    showLoading('Ajout du média...');
    try {
      await api.post('/gallery/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      closeLoading();
      showSuccess('Média ajouté', 'Le média est visible dans la galerie.');
      setShowForm(false);
      setForm({ title: '', caption: '', category: '', file_type: 'image', file: null });
      load();
    } catch (err) { closeLoading(); console.error(err); showError('Échec de l\'ajout', extractError(err, 'Erreur lors de l\'ajout du média.')); }
  };

  const handleDelete = async (it) => {
    const ok = await confirmDelete(`le média « ${it.title} »`, 'Cette action est irréversible et retirera le média de la galerie.');
    if (!ok.isConfirmed) return;
    showLoading('Suppression en cours...');
    try {
      await api.delete(`/gallery/${it.id}/`);
      closeLoading();
      showSuccess('Média supprimé');
      load();
    } catch (err) { closeLoading(); showError('Suppression impossible', extractError(err, 'Impossible de supprimer ce média.')); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-surface-900 flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary-500" /> Galerie & Médiathèque
        </h2>
        {canEdit && (
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-all">
            <Upload className="w-4 h-4" /> Ajouter une image / vidéo
          </button>
        )}
      </div>

      {canEdit && showForm && (
        <motion.form initial="hidden" animate="visible" variants={fadeInUp} onSubmit={handleUpload} className="mb-6 bg-white rounded-2xl border border-surface-100 p-6 space-y-4">
          <h3 className="font-bold text-surface-900">Nouveau média</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="Titre" className="input" />
            <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Catégorie (Événements, Solidarité...)" className="input" />
            <input value={form.caption} onChange={e => setForm({ ...form, caption: e.target.value })} placeholder="Légende" className="input" />
            <select value={form.file_type} onChange={e => setForm({ ...form, file_type: e.target.value })} className="input">
              <option value="image">Image</option>
              <option value="video">Vidéo</option>
            </select>
            <label className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-surface-300 cursor-pointer text-sm text-surface-500 hover:border-primary-400 sm:col-span-2">
              {form.file_type === 'image' ? <ImageIcon className="w-4 h-4" /> : <Film className="w-4 h-4" />}
              {form.file ? form.file.name : `Choisir ${form.file_type === 'image' ? 'une image' : 'une vidéo'}`}
              <input type="file" accept={form.file_type === 'image' ? 'image/*' : 'video/*'} onChange={e => setForm({ ...form, file: e.target.files[0] })} className="hidden" />
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-primary-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary-600">Ajouter</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl border border-surface-200 text-surface-600">Annuler</button>
          </div>
        </motion.form>
      )}

      {loading ? <LoadingSpinner className="py-10" /> : items.length === 0 ? (
        <p className="text-surface-500 text-center py-8">Aucun média. Ajoutez des images ou vidéos.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(it => (
            <motion.div key={it.id} variants={fadeInUp} className="group relative bg-white rounded-2xl border border-surface-100 overflow-hidden">
              {it.is_video ? (
                <div className="relative aspect-video bg-black cursor-pointer" onClick={() => setPreview(it)}>
                  {it.media_url?.includes('youtube.com') ? (
                    <img src={`https://img.youtube.com/vi/${it.media_url.split('/').pop()}/hqdefault.jpg`} alt={it.title} className="w-full h-full object-cover opacity-90" />
                  ) : it.media_url ? (
                    <video src={it.media_url} className="w-full h-full object-cover" muted />
                  ) : null}
                  <div className="absolute inset-0 flex items-center justify-center"><div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center"><Play className="w-6 h-6 text-primary-600 fill-primary-600" /></div></div>
                </div>
              ) : (
                <img src={it.media_url || it.image} alt={it.caption || it.title} className="w-full aspect-video object-cover cursor-pointer" onClick={() => setPreview(it)} />
              )}
              <div className="p-3">
                <p className="text-sm font-semibold text-surface-800 flex items-center gap-1">
                  {it.is_video ? <Film className="w-3.5 h-3.5 text-primary-500" /> : <ImageIcon className="w-3.5 h-3.5 text-primary-500" />}
                  {it.title}
                </p>
                {it.caption && <p className="text-xs text-surface-400">{it.caption}</p>}
              </div>
              {canEdit && <button onClick={() => handleDelete(it)} className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all">
                <Trash2 className="w-4 h-4" />
              </button>}
            </motion.div>
          ))}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
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
            <p className="text-white/90 text-center mt-3">{preview.title}</p>
          </div>
        </div>
      )}
    </div>
  );
}
