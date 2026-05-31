import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '../api/api';
import AdminTemplateCard from '../components/AdminTemplateCard';
import ConfirmDialog from '../components/ConfirmDialog';
import FloatingDecor from '../ui/FloatingDecor';
import { useMotion } from '../motion/MotionProvider';

/* Render in pages so a big library stays smooth — show this many first,
   then reveal more on "Load more" (keeps the DOM light, no lag). */
const PAGE_SIZE = 15;

export default function AdminTemplateLibrary() {
  const navigate = useNavigate();
  const { lenis } = useMotion();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [query, setQuery] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    adminAPI
      .getTemplates()
      .then((d) => setTemplates(Array.isArray(d) ? d : []))
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  /* Open at the top. The global ScrollToTop skips /admin → /admin/templates
     (same "admin" section), so reset here — via Lenis when it's driving the
     scroll, with a plain window fallback. */
  useEffect(() => {
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [lenis]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) => (t.name || '').toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q),
    );
  }, [templates, query]);

  // Reset the window when the filter changes so results start from the top.
  useEffect(() => { setVisible(PAGE_SIZE); }, [query]);

  const shown = filtered.slice(0, visible);
  const remaining = Math.max(0, filtered.length - visible);

  const handlePublish = async (id) => {
    try { await adminAPI.publishTemplate(id); toast.success('Website is live in the gallery.'); load(); }
    catch (e) { toast.error(e.message || 'Failed'); }
  };
  const handleUnpublish = async (id) => {
    try { await adminAPI.unpublishTemplate(id); toast.success('Website taken offline.'); load(); }
    catch (e) { toast.error(e.message || 'Failed'); }
  };
  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try { await adminAPI.deleteTemplate(deleteId); toast.success('Website removed.'); setDeleteId(null); load(); }
    catch (e) { toast.error(e.message || 'Failed'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <FloatingDecor density="low" />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <Link to="/admin" className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/5 px-3.5 py-1.5 text-sm font-bold text-slate-200 hover:bg-white/10 transition">
            <ArrowLeft size={15} strokeWidth={2.4} /> Back to studio
          </Link>
          <h1 className="mt-4 font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Template <span className="gradient-text">library</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {templates.length} {templates.length === 1 ? 'template' : 'templates'} · every published &amp; draft website.
          </p>
        </div>
        <Link to="/admin?new=1" className="btn-glow !py-2.5 !px-5 !text-sm shrink-0">✨ New website</Link>
      </div>

      {/* Search — same shell as the rest of the app */}
      <div className="search-shell mb-6 flex items-center gap-3 rounded-full px-5 py-3 backdrop-blur max-w-xl">
        <Search size={18} strokeWidth={2} className="search-icon shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or category…"
          className="search-input flex-1 bg-transparent outline-none text-sm font-medium"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="search-clear w-6 h-6 rounded-full inline-flex items-center justify-center text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-56 rounded-[1.5rem] bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-white/[0.03] p-12 text-center text-slate-400">
          {query ? `No templates match “${query}”.` : 'No templates yet. Create one from the studio.'}
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {shown.map((t) => (
              <AdminTemplateCard
                key={t._id}
                template={t}
                onEdit={(tpl) => navigate(`/admin?edit=${tpl._id}`)}
                onPublish={handlePublish}
                onUnpublish={handleUnpublish}
                onDelete={(tpl) => setDeleteId(tpl._id)}
              />
            ))}
          </div>

          {remaining > 0 && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="btn-glow !py-2.5 !px-6 !text-sm"
              >
                Load more — {remaining} more
              </button>
            </div>
          )}
          <p className="mt-3 text-center text-xs uppercase tracking-[0.18em] text-slate-500">
            Showing {shown.length} of {filtered.length}
          </p>
        </>
      )}

      <ConfirmDialog
        open={deleteId != null}
        title="Remove this website?"
        description="This cannot be undone. People who already published a page from it may need to create a new link."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        loading={deleting}
        onClose={() => { if (!deleting) setDeleteId(null); }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
