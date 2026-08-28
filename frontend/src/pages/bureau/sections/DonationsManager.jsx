import { useState, useEffect, useCallback } from 'react';
import { HandCoins, Bell, CheckCheck, RefreshCw } from 'lucide-react';
import api from '../../../api/axios';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { showSuccess } from '../../../utils/swal';

export default function DonationsManager() {
  const [donations, setDonations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dons');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, n] = await Promise.all([
        api.get('/donations/').catch(() => ({ data: [] })),
        api.get('/notifications/').catch(() => ({ data: [] })),
      ]);
      setDonations(d.data || []);
      setNotifications(Array.isArray(n.data) ? n.data : n.data.results || []);
      setUnread(notifications.filter(nn => !nn.is_read).length);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read/');
      showSuccess('Notifications lues', 'Toutes les notifications ont été marquées comme lues.');
      load();
    } catch (e) { console.error(e); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setTab('dons')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === 'dons' ? 'bg-primary-500 text-white' : 'bg-surface-50 text-surface-600'}`}
          >
            <HandCoins className="w-4 h-4" /> Dons reçus
          </button>
          <button
            onClick={() => setTab('notifications')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === 'notifications' ? 'bg-primary-500 text-white' : 'bg-surface-50 text-surface-600'}`}
          >
            <Bell className="w-4 h-4" /> Notifications
            {unread > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{unread}</span>
            )}
          </button>
        </div>
        <div className="flex items-center gap-2">
          {tab === 'notifications' && unread > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700">
              <CheckCheck className="w-4 h-4" /> Tout marquer comme lu
            </button>
          )}
          <button onClick={load} className="p-2 rounded-lg border border-surface-200 text-surface-500 hover:bg-surface-50"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>

      {loading ? <LoadingSpinner className="py-10" /> : tab === 'dons' ? (
        donations.length === 0 ? (
          <p className="text-surface-500 text-center py-8">Aucun don pour le moment.</p>
        ) : (
          <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-50 text-surface-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Donateur</th>
                  <th className="px-4 py-3 font-semibold">Montant</th>
                  <th className="px-4 py-3 font-semibold">Numéro / Méthode</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {donations.map(d => (
                  <tr key={d.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-surface-800">{d.donor_name}</div>
                      {d.donor_phone && <div className="text-xs text-surface-400">{d.donor_phone}</div>}
                    </td>
                    <td className="px-4 py-3 font-bold text-primary-600">{d.amount} FCFA</td>
                    <td className="px-4 py-3 text-surface-500">{d.target_number || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${d.status === 'received' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {d.status_display || d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-surface-500">{new Date(d.created_at).toLocaleString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : notifications.length === 0 ? (
        <p className="text-surface-500 text-center py-8">Aucune notification.</p>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div key={n.id} className={`bg-white rounded-2xl border p-4 ${n.is_read ? 'border-surface-100' : 'border-primary-200 bg-primary-50/30'}`}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4 text-primary-500" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-surface-800 text-sm">{n.title}</div>
                  <p className="text-sm text-surface-500 mt-1">{n.message}</p>
                  <div className="text-xs text-surface-400 mt-2">{new Date(n.created_at).toLocaleString('fr-FR')}</div>
                </div>
                {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-2" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
