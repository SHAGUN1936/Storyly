import { motion } from 'framer-motion';

export default function TemplateCard({ template }) {
  return (
    <motion.article
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="glass rounded-2xl overflow-hidden group cursor-pointer"
    >
      <div className="aspect-video relative bg-dark-700 overflow-hidden">
        {template.thumbnailUrl || template.previewVideoUrl ? (
          <>
            <img
              src={template.thumbnailUrl || template.previewVideoUrl}
              alt={template.name}
              className="w-full h-full object-cover transition group-hover:scale-105"
            />
            {template.previewVideoUrl && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <span className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-2xl">▶</span>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-500/20 to-pink-500/20">
            <span className="text-4xl text-brand-400/50">🎬</span>
          </div>
        )}
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/50 text-xs font-medium text-white">
          {template.category}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-white group-hover:text-brand-400 transition">{template.name}</h3>
        {template.description && (
          <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{template.description}</p>
        )}
        <p className="text-xs text-brand-400/80 mt-3 font-medium">Open to customize →</p>
      </div>
    </motion.article>
  );
}
