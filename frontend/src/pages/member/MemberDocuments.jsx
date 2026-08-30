import { useEffect, useState } from 'react';
import { FileText, Download, Eye, X } from 'lucide-react';
import api from '../../api/axios';
import { fetchFileUrl, revokeFileUrl } from '../../api/axios';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

function MemberDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    api.get('/documents/')
      .then(({ data }) => setDocuments(data.results || data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openDoc = async (doc) => {
    if (!doc.file) return;
    setViewing({ doc, url: null });
    const url = await fetchFileUrl(doc.file);
    setViewing((v) => (v && v.doc?.id === doc.id ? { doc, url } : v));
  };

  const closePreview = () => {
    setViewing((v) => {
      if (v) revokeFileUrl(v.url);
      return null;
    });
  };

  const downloadDoc = async (doc) => {
    if (!doc.file) return;
    const url = await fetchFileUrl(doc.file);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => revokeFileUrl(url), 2000);
  };

  const categoryColors = {
    report: 'bg-blue-50 text-blue-600',
    financial: 'bg-green-50 text-green-600',
    legal: 'bg-purple-50 text-purple-600',
    minutes: 'bg-orange-50 text-orange-600',
    other: 'bg-surface-50 text-surface-600',
  };

  return (
    <div className="min-h-screen bg-surface-50 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-surface-900 font-[var(--font-display)] mb-2">Documents</h1>
        <p className="text-surface-500 mb-8">Consultez les textes officiels, rapports et procès-verbaux de l'association.</p>

        {loading ? <LoadingSpinner className="py-16" /> : documents.length === 0 ? (
          <p className="text-surface-500 text-center py-16 bg-white rounded-2xl border border-surface-100">Aucun document disponible.</p>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="bg-white rounded-2xl border border-surface-100 p-5 flex items-center justify-between hover:shadow-md transition-all">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-primary-500" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-surface-900 text-sm truncate">{doc.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[doc.category] || 'bg-surface-50 text-surface-600'}`}>
                        {doc.category_display || doc.category}
                      </span>
                      {doc.updated_at && <span className="text-xs text-surface-400">{new Date(doc.updated_at).toLocaleDateString('fr-FR')}</span>}
                    </div>
                  </div>
                </div>
                {doc.file && (
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <button onClick={() => openDoc(doc)} className="flex items-center gap-1.5 px-3 py-2 bg-primary-50 text-primary-600 rounded-lg text-xs font-semibold hover:bg-primary-100 transition-all">
                      <Eye className="w-3.5 h-3.5" /> Visionner
                    </button>
                    <button onClick={() => downloadDoc(doc)} className="flex items-center gap-1.5 px-3 py-2 bg-surface-50 text-surface-600 rounded-lg text-xs font-semibold hover:bg-surface-100 transition-all">
                      <Download className="w-3.5 h-3.5" /> Télécharger
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4" onClick={closePreview}>
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
              <div className="min-w-0">
                <h3 className="font-bold text-surface-900 truncate">{viewing.doc.title}</h3>
                <p className="text-xs text-surface-400">{viewing.doc.category_display}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => downloadDoc(viewing.doc)} className="flex items-center gap-1.5 px-3 py-2 bg-primary-500 text-white rounded-lg text-xs font-semibold hover:bg-primary-600 transition-all">
                  <Download className="w-3.5 h-3.5" /> Télécharger
                </button>
                <button onClick={closePreview} className="p-2 bg-surface-50 rounded-lg text-surface-600 hover:bg-surface-100 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-surface-50 p-4">
              {viewing.url ? (
                <iframe src={viewing.url} title={viewing.doc.title} className="w-full h-[70vh] rounded-xl border border-surface-200 bg-white" />
              ) : (
                <div className="flex items-center justify-center h-[70vh] text-surface-400">Chargement du document...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MemberDocuments;