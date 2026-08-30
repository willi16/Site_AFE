import { useEffect, useMemo, useState } from 'react';
import { Users, Search, MapPin, Phone, BadgeCheck, Calendar } from 'lucide-react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const roleStyles = {
  admin: 'bg-purple-100 text-purple-700',
  bureau: 'bg-amber-100 text-amber-700',
  secretary: 'bg-blue-100 text-blue-700',
  treasurer: 'bg-green-100 text-green-700',
  member: 'bg-surface-100 text-surface-600',
};

function initials(name) {
  return (name || '?').split(' ').filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

function MemberAnnuaire() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.get('/members/')
      .then(({ data }) => setMembers(data.results || data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => (m.full_name || '').toLowerCase().includes(q));
  }, [members, query]);

  return (
    <div className="min-h-screen bg-surface-50 pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-surface-900 font-[var(--font-display)] mb-2">Annuaire des membres</h1>
        <p className="text-surface-500 mb-6">
          Retrouvez les coordonnées de tous les membres de l'association.
        </p>

        <div className="relative max-w-md mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un membre par nom..."
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
          />
        </div>

        {loading ? <LoadingSpinner className="py-16" /> : filtered.length === 0 ? (
          <p className="text-surface-500 text-center py-16 bg-white rounded-2xl border border-surface-100">Aucun membre trouvé.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((m) => (
              <div key={m.id} className="bg-white rounded-2xl border border-surface-100 p-5 hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {initials(m.full_name)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-surface-900 text-sm truncate">{m.full_name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${roleStyles[m.role] || 'bg-surface-100 text-surface-600'}`}>
                      {m.role_display || m.role}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-surface-500">
                  {m.phone && (
                    <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-surface-400" /> {m.phone}</p>
                  )}
                  {m.address && (
                    <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-surface-400" /> {m.address}</p>
                  )}
                  {m.membership_date && (
                    <p className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-surface-400" /> Adhésion : {new Date(m.membership_date).toLocaleDateString('fr-FR')}</p>
                  )}
                </div>
                {m.bio && <p className="text-xs text-surface-500 mt-3 pt-3 border-t border-surface-100">{m.bio}</p>}
                {m.membership_status && (
                  <p className="flex items-center gap-1.5 text-[11px] text-green-600 font-medium mt-3">
                    <BadgeCheck className="w-3.5 h-3.5" /> Cotisation à jour
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MemberAnnuaire;