import { FileText, Download, Lock, Eye } from 'lucide-react';
import { fetchFileUrl, revokeFileUrl } from '../../api/axios';

function DocumentCard({ document: doc, showDownload = false, onView }) {
  const categoryColors = {
    report: 'bg-blue-50 text-blue-600',
    financial: 'bg-green-50 text-green-600',
    legal: 'bg-purple-50 text-purple-600',
    minutes: 'bg-orange-50 text-orange-600',
    other: 'bg-surface-50 text-surface-600',
  };

  const downloadDoc = async (e) => {
    e.preventDefault();
    e.stopPropagation();
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

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-surface-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all group">
      <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center group-hover:bg-primary-500 transition-colors">
        <FileText className="w-6 h-6 text-primary-500 group-hover:text-white transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-surface-900 truncate">{doc.title}</h4>
        <div className="flex items-center gap-3 mt-1">
          <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[doc.category] || 'bg-surface-50 text-surface-600'}`}>
            {doc.category_display || doc.category}
          </span>
          <span className="text-xs text-surface-400">
            {doc.visible_to === 'public' ? <Eye className="w-3 h-3 inline mr-1" /> : <Lock className="w-3 h-3 inline mr-1" />}
            {doc.visible_to_display || doc.visible_to}
          </span>
        </div>
      </div>
      {doc.file && (
        <div className="flex items-center gap-1 shrink-0">
          {onView && (
            <button onClick={onView} className="p-2 rounded-lg hover:bg-primary-100 text-primary-500 transition-all" title="Visionner">
              <Eye className="w-4 h-4" />
            </button>
          )}
          {showDownload && (
            <button onClick={downloadDoc} className="p-2 rounded-lg hover:bg-primary-100 text-surface-400 hover:text-primary-500 transition-all" title="Télécharger">
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default DocumentCard;