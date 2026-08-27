import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, Upload, Trash2, Download, File as FileIcon } from 'lucide-react';
import api from '../../../api/axios';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { useAuth } from '../../../context/AuthContext';
import { confirmAction, confirmDelete, showSuccess, showError, showLoading, closeLoading, extractError } from '../../../utils/swal';

const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function FichiersManager() {
  const { isSecretary, isAdmin } = useAuth();
  const canEdit = isSecretary || isAdmin;
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/documents/', { params: { page_size: 100 } });
      setFiles((data.results || data || []).filter(d => d.category === 'other'));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { showError('Fichier requis', 'Veuillez choisir un fichier à uploader.'); return; }
    const ok = await confirmAction('Uploader ce fichier ?', `« ${title || file.name} » sera ajouté aux fichiers du bureau.`, { icon: 'question', confirmText: 'Oui, uploader' });
    if (!ok.isConfirmed) return;
    const fd = new FormData();
    fd.append('title', title || file.name);
    fd.append('description', 'Fichier du bureau');
    fd.append('category', 'other');
    fd.append('visible_to', 'bureau');
    fd.append('file', file);
    showLoading('Upload en cours...');
    try {
      await api.post('/documents/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      closeLoading();
      showSuccess('Fichier uploadé');
      setTitle(''); setFile(null); setShowForm(false); load();
    } catch (err) { closeLoading(); console.error(err); showError('Échec de l\'upload', extractError(err, 'Erreur lors de l\'upload du fichier.')); }
  };

  const handleDelete = async (f) => {
    const ok = await confirmDelete(`le fichier « ${f.title} »`, 'Cette action est irréversible.');
    if (!ok.isConfirmed) return;
    showLoading('Suppression en cours...');
    try {
      await api.delete(`/documents/${f.id}/`);
      closeLoading();
      showSuccess('Fichier supprimé');
      load();
    } catch (err) { closeLoading(); showError('Suppression impossible', extractError(err, 'Impossible de supprimer ce fichier.')); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-surface-900 flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-primary-500" /> Fichiers du bureau
        </h2>
        {canEdit && (
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-all">
            <Upload className="w-4 h-4" /> Uploader un fichier
          </button>
        )}
      </div>

      {canEdit && showForm && (
        <motion.form initial="hidden" animate="visible" variants={fadeInUp} onSubmit={handleUpload} className="mb-6 bg-white rounded-2xl border border-surface-100 p-6 space-y-4">
          <h3 className="font-bold text-surface-900">Nouveau fichier</h3>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nom du fichier" className="input" />
          <label className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-surface-300 cursor-pointer text-sm text-surface-500 hover:border-primary-400">
            <Upload className="w-4 h-4" /> {file ? file.name : 'Choisir un fichier'}
            <input type="file" onChange={e => setFile(e.target.files[0])} className="hidden" />
          </label>
          <div className="flex gap-2">
            <button type="submit" className="bg-primary-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary-600">Uploader</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl border border-surface-200 text-surface-600">Annuler</button>
          </div>
        </motion.form>
      )}

      {loading ? <LoadingSpinner className="py-10" /> : files.length === 0 ? (
        <p className="text-surface-500 text-center py-8">Aucun fichier.</p>
      ) : (
        <div className="space-y-3">
          {files.map(f => (
            <div key={f.id} className="bg-white rounded-2xl border border-surface-100 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center"><FileIcon className="w-5 h-5 text-surface-500" /></div>
                <div>
                  <p className="font-medium text-surface-800 text-sm">{f.title}</p>
                  <p className="text-xs text-surface-400">{f.created_at?.slice(0,10)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {f.file && <a href={f.file} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-primary-600 hover:bg-primary-50"><Download className="w-4 h-4" /></a>}
                {canEdit && <button onClick={() => handleDelete(f)} className="p-2 rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
