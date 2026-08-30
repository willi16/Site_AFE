import { useEffect, useState } from 'react';
import { Camera, X } from 'lucide-react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

function MemberMediatheque() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/gallery/', { params: { page_size: 100 } })
      .then(({ data }) => setItems(data.results || data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = ['all', ...new Set(items.map((i) => i.category).filter(Boolean))];
  const filtered = filter === 'all' ? items : items.filter((i) => i.category === filter);

  return (
    <div className="min-h-screen bg-surface-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-surface-900 font-[var(--font-display)] mb-2">Médiathèque</h1>
        <p className="text-surface-500 mb-6">Photos et vidéos de la vie de l'association.</p>

        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((c) => (
            <button key={c} onClick={() => setFilter(c)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === c ? 'bg-primary-500 text-white' : 'bg-white text-surface-600 hover:bg-primary-50 border border-surface-100'}`}>
              {c === 'all' ? 'Tout' : c}
            </button>
          ))}
        </div>

        {loading ? <LoadingSpinner className="py-16" /> : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Camera className="w-16 h-16 text-surface-300 mx-auto mb-4" />
            <p className="text-surface-500 text-lg">La médiathèque sera bientôt remplie.</p>
          </div>
        ) : (
          <div key={filter} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map((item) => (
              <div key={item.id} className="group relative bg-white rounded-2xl border border-surface-100 overflow-hidden cursor-pointer hover:shadow-lg transition-all" onClick={() => setPreview(item)}>
                {item.is_video ? (
                  item.media_url?.includes('youtube.com') ? (
                    <div className="relative aspect-video bg-black">
                      <img src={`https://img.youtube.com/vi/${item.media_url.split('/').pop()}/hqdefault.jpg`} alt={item.title} className="w-full h-full object-cover opacity-80" />
                    </div>
                  ) : item.media_url ? (
                    <video src={item.media_url} preload="none" poster={item.media_url} className="aspect-video w-full object-cover" muted />
                  ) : null
                ) : (
                  <img src={item.media_url || item.image} alt={item.caption || item.title} className="aspect-video w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                )}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
                  <p className="text-white text-xs font-semibold truncate">{item.caption || item.title}</p>
                  {item.category && <p className="text-white/70 text-[11px]">{item.category}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
              <div>
                <h3 className="font-bold text-surface-900">{preview.title}</h3>
                <p className="text-xs text-surface-400">{preview.caption || preview.category}</p>
              </div>
              <button onClick={() => setPreview(null)} className="p-2 bg-surface-50 rounded-lg text-surface-600 hover:bg-surface-100 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-black flex items-center justify-center p-4">
              {preview.is_video ? (
                preview.media_url?.includes('youtube.com') ? (
                  <iframe src={preview.media_url} title={preview.title} className="w-full aspect-video rounded-2xl" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen frameBorder="0" />
                ) : (
                  <video src={preview.media_url} controls autoPlay className="max-h-[70vh] w-full rounded-2xl" />
                )
              ) : (
                <img src={preview.media_url || preview.image} alt={preview.title} className="max-h-[70vh] rounded-2xl" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MemberMediatheque;