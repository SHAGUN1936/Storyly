import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { templatesAPI } from '../api/api';
import TemplateCard from '../components/TemplateCard';

const CATEGORIES = ['All', 'Love', 'Friendship', 'Birthday', 'Memories', 'Wedding'];

export default function Dashboard() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await templatesAPI.list(category === 'All' ? undefined : category);
        setTemplates(data);
      } catch (_) {
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };
    setLoading(true);
    fetchTemplates();
  }, [category]);

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold gradient-text mb-2">Choose a website</h1>
        <p className="text-zinc-400 max-w-3xl">
          Each card is a <strong className="text-zinc-300">ready-made mini website</strong> — add your photos, text, and
          publish a shareable link. Some designs also export as video when you publish.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-wrap gap-2 mb-8"
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-xl font-medium transition ${
              category === cat
                ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-transparent'
            }`}
          >
            {cat}
          </button>
        ))}
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="aspect-video rounded-2xl bg-white/5 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {templates.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-zinc-500 text-center py-12"
            >
              No websites in this category yet.
            </motion.p>
          ) : (
            <motion.div
              key={category}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {templates.map((template, i) => (
                <motion.div
                  key={template._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link to={`/template/${template._id}`}>
                    <TemplateCard template={template} />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
