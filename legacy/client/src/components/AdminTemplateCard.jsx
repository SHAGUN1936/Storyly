import { motion } from 'framer-motion';
import { Pencil, Rocket, PowerOff, Trash2, PencilLine } from 'lucide-react';
import Button from '../ui/Button';

/**
 * One admin template card — thumbnail + status + Edit / Publish-or-Unlive /
 * Delete. Shared by the Admin studio (recent 4) and the full library page.
 *
 * Callbacks receive the template: onEdit(t), onPublish(id), onUnpublish(id),
 * onDelete(t).
 */
export default function AdminTemplateCard({ template: t, isEditing = false, onEdit, onPublish, onUnpublish, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`admin-tpl-card group rounded-[1.5rem] border bg-white relative ${isEditing ? 'is-selected' : ''}`}
    >
      <div className="relative aspect-[16/9] rounded-t-[1.5rem] bg-gradient-to-br from-brand-200 via-peach-200 to-sunset-400/40 overflow-hidden">
        {t.thumbnailUrl ? (
          <img src={t.thumbnailUrl} alt="" className="w-full h-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🎬</div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent pointer-events-none" />
        <span className={`absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold border backdrop-blur ${
          t.published ? 'bg-teal-500/85 border-teal-300 text-white' : 'bg-white/85 border-white/70 text-slate-700'
        }`}>
          {t.published ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.9)]" />
              Live
            </>
          ) : (
            <>
              <PencilLine size={11} strokeWidth={2.6} className="text-amber-500" />
              Draft
            </>
          )}
        </span>
        <h3 className="absolute inset-x-3 bottom-2 font-display font-extrabold text-white text-lg drop-shadow truncate">
          {t.name}
        </h3>
      </div>
      <div className="p-4">
        <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-3">{t.category}</p>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => onEdit?.(t)}
            size="sm"
            icon={<Pencil size={13} strokeWidth={2.4} />}
            className="flex-1"
          >
            Edit
          </Button>
          {t.published ? (
            <button
              type="button"
              onClick={() => onUnpublish?.(t._id)}
              data-tooltip="Take offline (unlive)"
              data-tooltip-pos="top"
              aria-label="Unlive"
              className="my-page-icon-btn"
              style={{ background: 'rgba(245,158,11,0.14)', borderColor: 'rgba(245,158,11,0.45)', color: '#B45309' }}
            >
              <PowerOff size={14} strokeWidth={2.2} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onPublish?.(t._id)}
              data-tooltip="Publish (go live)"
              data-tooltip-pos="top"
              aria-label="Publish"
              className="my-page-icon-btn"
              style={{ background: 'rgba(20,184,166,0.14)', borderColor: 'rgba(20,184,166,0.45)', color: '#0D9488' }}
            >
              <Rocket size={14} strokeWidth={2.2} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete?.(t)}
            aria-label={`Delete ${t.name}`}
            data-tooltip="Delete template"
            data-tooltip-pos="top"
            className="my-page-icon-btn my-page-icon-btn-danger"
          >
            <Trash2 size={14} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
