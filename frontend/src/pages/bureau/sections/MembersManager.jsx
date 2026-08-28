import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Upload, X, Pencil, Trash2, Search, UserCheck, UserX, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../../api/axios';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { useAuth } from '../../../context/AuthContext';
import { confirmAction, confirmDelete, showSuccess, showError, showLoading, closeLoading, extractError } from '../../../utils/swal';

const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function MembersManager({ canRegister = true }) {
  const { isSecretary, isAdmin, isTreasurer } = useAuth();
  const canEdit = isSecretary || isAdmin || isTreasurer;
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [form, setForm] = useState({ username: '', first_name: '', last_name: '', email: '', password: '', phone: '', role: 'member' });
  const [roleFilter, setRoleFilter] = useState('all');

  const pageSize = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (roleFilter !== 'all') params.role = roleFilter;
      if (search.trim()) params.search = search.trim();
      const { data } = await api.get('/members/', { params });
      setMembers(data.results || data || []);
      setCount(data.count ?? 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  const handleSearch = (e) => {
    if (e.key === 'Enter') { setPage(1); load(); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const ok = await confirmAction(
      'Enregistrer ce membre ?',
      `Ajouter « ${form.first_name} ${form.last_name} » (${form.username}) en tant que ${form.role} ?`,
      { icon: 'question', confirmText: 'Oui, enregistrer' }
    );
    if (!ok.isConfirmed) return;
    showLoading('Enregistrement du membre...');
    try {
      await api.post('/members/staff-create/', form);
      closeLoading();
      showSuccess('Membre enregistré', `${form.first_name} ${form.last_name} a bien été ajouté.`);
      setShowForm(false);
      setForm({ username: '', first_name: '', last_name: '', email: '', password: '', phone: '', role: 'member' });
      load();
    } catch (err) {
      closeLoading();
      const msg = extractError(err, 'Erreur lors de l\'ajout du membre.');
      showError('Échec de l\'enregistrement', msg);
    }
  };

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file || !editingPhoto) return;
    const ok = await confirmAction(
      'Mettre à jour la photo ?',
      'La photo de profil du membre sera remplacée.',
      { icon: 'question', confirmText: 'Oui, mettre à jour' }
    );
    if (!ok.isConfirmed) return;
    const formData = new FormData();
    formData.append('photo', file);
    showLoading('Mise à jour de la photo...');
    try {
      await api.patch(`/members/${editingPhoto}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      closeLoading();
      showSuccess('Photo mise à jour');
      setEditingPhoto(null);
      load();
    } catch (err) { closeLoading(); console.error(err); showError('Échec', extractError(err, 'Erreur lors de l\'upload de la photo.')); }
  };

  const handleStatus = async (m, action, verb) => {
    const ok = await confirmAction(
      `${verb} le compte ?`,
      `Le compte de « ${m.full_name} » sera ${verb.toLowerCase()} et il ne pourra plus se connecter.`,
      { icon: 'warning', confirmText: `Oui, ${verb.toLowerCase()}` }
    );
    if (!ok.isConfirmed) return;
    showLoading('Mise à jour du statut...');
    try {
      await api.post(`/members/${m.id}/${action}/`);
      closeLoading();
      showSuccess('Compte mis à jour', `${m.full_name} a été ${verb.toLowerCase()}.`);
      load();
    } catch (err) {
      closeLoading();
      showError('Échec', extractError(err, 'Impossible de modifier le statut.'));
    }
  };

  const handleActivate = async (m) => {
    const ok = await confirmAction(
      'Activer le compte ?',
      `Le compte de « ${m.full_name} » sera réactivé et il pourra de nouveau se connecter.`,
      { icon: 'question', confirmText: 'Oui, activer' }
    );
    if (!ok.isConfirmed) return;
    showLoading('Activation...');
    try {
      await api.post(`/members/${m.id}/activate/`);
      closeLoading();
      showSuccess('Compte activé', `${m.full_name} peut de nouveau se connecter.`);
      load();
    } catch (err) { closeLoading(); showError('Échec', extractError(err, 'Impossible d\'activer le compte.')); }
  };

  const handleDelete = async (m) => {
    const ok = await confirmDelete(
      `le membre ${m.full_name}`,
      'Cette action est irréversible et retirera le membre de l\'association.'
    );
    if (!ok.isConfirmed) return;
    showLoading('Suppression en cours...');
    try {
      await api.delete(`/members/${m.id}/`);
      closeLoading();
      showSuccess('Membre supprimé', `${m.full_name} a été retiré.`);
      load();
    } catch (err) {
      closeLoading();
      const msg = extractError(err, 'Impossible de supprimer ce membre.');
      showError('Suppression impossible', msg);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-xl font-bold text-surface-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary-500" /> Gestion des Membres
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Rechercher un membre..."
              className="pl-9 pr-3 py-2 rounded-xl border border-surface-200 text-sm w-56"
            />
          </div>
          <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} className="px-3 py-2 rounded-xl border border-surface-200 text-sm">
            <option value="all">Tous</option>
            <option value="member">Adhérents</option>
            <option value="bureau">Président</option>
            <option value="secretary">Secrétaire</option>
            <option value="treasurer">Trésorier</option>
            <option value="admin">Admin</option>
          </select>
          {canRegister && canEdit && (
            <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-all">
              <UserPlus className="w-4 h-4" /> Enregistrer un membre
            </button>
          )}
        </div>
      </div>

      {showForm && canRegister && canEdit && (
        <motion.form initial="hidden" animate="visible" variants={fadeInUp} onSubmit={handleCreate} className="mb-6 bg-white rounded-2xl border border-surface-100 p-6 space-y-4">
          <h3 className="font-bold text-surface-900">Nouveau membre</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required placeholder="Prénom" className="input" />
            <input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} required placeholder="Nom" className="input" />
            <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required placeholder="Nom d'utilisateur" className="input" />
            <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" required placeholder="Email" className="input" />
            <input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} type="password" required placeholder="Mot de passe" className="input" />
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Téléphone" className="input" />
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="input">
              <option value="member">Adhérent</option>
              <option value="bureau">Président</option>
              <option value="secretary">Secrétaire</option>
              <option value="treasurer">Trésorier</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-primary-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary-600 transition-all">Enregistrer</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl border border-surface-200 text-surface-600">Annuler</button>
          </div>
        </motion.form>
      )}

      {loading ? <LoadingSpinner className="py-10" /> : members.length === 0 ? (
        <p className="text-surface-500 text-center py-8">Aucun membre.</p>
      ) : (
        <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 text-surface-500 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Membre</th>
                <th className="px-4 py-3 font-semibold">Rôle</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
                <th className="px-4 py-3 font-semibold">Cotisation</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {members.map(m => (
                <tr key={m.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-100 overflow-hidden shrink-0">
                        {m.photo ? <img src={m.photo} alt="" className="w-full h-full object-cover" /> : <Users className="w-4 h-4 text-primary-400 m-auto" />}
                      </div>
                      <div>
                        <div className="font-medium text-surface-800">{m.full_name}</div>
                        <div className="text-xs text-surface-400">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-surface-500">{m.role_display || m.role}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${m.account_status === 'active' ? 'bg-emerald-100 text-emerald-700' : m.account_status === 'suspended' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {m.account_status_display || m.account_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${m.membership_status ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                      {m.membership_status ? 'À jour' : 'Non à jour'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {canEdit && m.account_status !== 'active' && (
                        <button onClick={() => handleActivate(m)} title="Activer" className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-500"><UserCheck className="w-4 h-4" /></button>
                      )}
                      {canEdit && m.account_status === 'active' && (
                        <button onClick={() => handleStatus(m, 'suspend', 'Suspendre')} title="Suspendre" className="p-2 rounded-lg hover:bg-amber-50 text-amber-500"><Pause className="w-4 h-4" /></button>
                      )}
                      {canEdit && m.account_status !== 'deactivated' && (
                        <button onClick={() => handleStatus(m, 'deactivate', 'Désactiver')} title="Désactiver" className="p-2 rounded-lg hover:bg-orange-50 text-orange-500"><UserX className="w-4 h-4" /></button>
                      )}
                      {canEdit && <button onClick={() => setEditingPhoto(m.id)} title="Changer la photo" className="p-2 rounded-lg hover:bg-surface-100 text-surface-500"><Upload className="w-4 h-4" /></button>}
                      {canEdit && <button onClick={() => handleDelete(m)} title="Supprimer" className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-surface-100 text-sm text-surface-500">
              <span>{count} membre(s) · page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="p-2 rounded-lg border border-surface-200 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="p-2 rounded-lg border border-surface-200 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {editingPhoto && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setEditingPhoto(null)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-surface-900"><Pencil className="w-4 h-4 inline mr-2" />Changer la photo</h3>
              <button onClick={() => setEditingPhoto(null)} className="text-surface-400 hover:text-surface-600"><X className="w-5 h-5" /></button>
            </div>
            <label className="w-full flex items-center justify-center gap-2 bg-primary-500 text-white px-5 py-3 rounded-xl text-sm font-semibold cursor-pointer hover:bg-primary-600">
              <Upload className="w-4 h-4" /> Choisir une photo
              <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
