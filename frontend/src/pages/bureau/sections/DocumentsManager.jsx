import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload, X, Download, Trash2, Eye } from 'lucide-react';
import api from '../../../api/axios';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { useAuth } from '../../../context/AuthContext';
import { confirmAction, confirmDelete, showSuccess, showError, showLoading, closeLoading, extractError } from '../../../utils/swal';

const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const CATEGORIES = [
  { value: 'legal', label: 'Officiel' },
  { value: 'report', label: 'Compte-rendu' },
  { value: 'minutes', label: 'Procès-verbal' },
  { value: 'financial', label: 'Comptabilité' },
  { value: 'other', label: 'Autre' },
];

export default function DocumentsManager() {
  const { isSecretary, isAdmin } = useAuth();
  const canEdit = isSecretary || isAdmin;
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'legal', visible_to: 'members', file: null });

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/documents/', { params: { page_size: 100 } });
      setDocuments(data.results || data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!form.file) { showError('Fichier requis', 'Veuillez sélectionner un fichier à uploader.'); return; }
    if (!form.title) { showError('Titre requis', 'Veuillez indiquer un titre pour le document.'); return; }
    const ok = await confirmAction(
      'Uploader ce document ?',
      `« ${form.title} » (${CATEGORIES.find(c => c.value === form.category)?.label || form.category}) sera publié pour : ${form.visible_to === 'public' ? 'tout le monde' : form.visible_to === 'members' ? 'les membres' : 'le bureau uniquement'}.`,
      { icon: 'question', confirmText: 'Oui, uploader' }
    );
    if (!ok.isConfirmed) return;
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('description', form.description);
    fd.append('category', form.category);
    fd.append('visible_to', form.visible_to);
    fd.append('file', form.file);
    showLoading('Upload en cours...');
    try {
      await api.post('/documents/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      closeLoading();
      showSuccess('Document uploadé', `« ${form.title} » est maintenant disponible.`);
      setShowForm(false);
      setForm({ title: '', description: '', category: 'legal', visible_to: 'members', file: null });
      load();
    } catch (err) { closeLoading(); console.error(err); showError('Échec de l\'upload', extractError(err, 'Erreur lors de l\'upload du document.')); }
  };

  const handleDelete = async (d) => {
    const ok = await confirmDelete(`le document « ${d.title} »`, 'Cette action est irréversible et retirera le document du site.');
    if (!ok.isConfirmed) return;
    showLoading('Suppression en cours...');
    try {
      await api.delete(`/documents/${d.id}/`);
      closeLoading();
      showSuccess('Document supprimé');
      load();
    } catch (err) { closeLoading(); showError('Suppression impossible', extractError(err, 'Impossible de supprimer ce document.')); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-surface-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary-500" /> Documents & Procès-verbaux
        </h2>
        {canEdit && (
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-all">
            <Upload className="w-4 h-4" /> Uploader un document / PV
          </button>
        )}
      </div>

      {canEdit && showForm && (
        <motion.form initial="hidden" animate="visible" variants={fadeInUp} onSubmit={handleUpload} className="mb-6 bg-white rounded-2xl border border-surface-100 p-6 space-y-4">
          <h3 className="font-bold text-surface-900">Uploader un document</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="Titre du document" className="input" />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input">
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" className="input sm:col-span-2" />
            <select value={form.visible_to} onChange={e => setForm({ ...form, visible_to: e.target.value })} className="input">
              <option value="public">Public</option>
              <option value="members">Membres</option>
              <option value="bureau">Bureau</option>
            </select>
            <label className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-surface-300 cursor-pointer text-sm text-surface-500 hover:border-primary-400">
              <Upload className="w-4 h-4" /> {form.file ? form.file.name : 'Choisir un fichier (PDF...)'}
              <input type="file" onChange={e => setForm({ ...form, file: e.target.files[0] })} className="hidden" />
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-primary-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary-600">Uploader</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl border border-surface-200 text-surface-600">Annuler</button>
          </div>
        </motion.form>
      )}

      {loading ? <LoadingSpinner className="py-10" /> : documents.length === 0 ? (
        <p className="text-surface-500 text-center py-8">Aucun document.</p>
      ) : (
        <div className="space-y-3">
          {documents.map(d => (
            <div key={d.id} className="bg-white rounded-2xl border border-surface-100 p-5 flex items-center justify-between hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center shrink-0"><FileText className="w-5 h-5 text-primary-500" /></div>
                <div>
                  <p className="font-semibold text-surface-900 text-sm">{d.title}</p>
                  <p className="text-xs text-surface-400">
                    {d.category_display || d.category} · {d.visible_to_display || d.visible_to}
                    {d.file && <a href={d.file} target="_blank" rel="noopener noreferrer" className="ml-2 text-primary-500 hover:underline">· voir</a>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {d.file && <a href={d.file} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-primary-600 hover:bg-primary-50"><Download className="w-4 h-4" /></a>}
                {canEdit && <button onClick={() => handleDelete(d)} className="p-2 rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
