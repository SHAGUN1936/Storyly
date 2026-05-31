import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { templatesAPI } from '../api/api';
import SlideshowBuilder from '../components/SlideshowBuilder';
import DeviceSelect from '../components/DeviceSelect';
import { extractSlotsFromStructure } from '../data/exampleSlideshowTemplate';
import { BREAKPOINT_PRESETS } from '../lib/visualTemplateBuilder';
import RecipientPromptModal from '../components/RecipientPromptModal';
import { StorylyMark } from '../components/StorylyLogo';
import FloatingDecor from '../ui/FloatingDecor';
import Button from '../ui/Button';
import GlassCard from '../ui/GlassCard';
import GradientText from '../ui/GradientText';
import NeonOrb from '../ui/NeonOrb';

/**
 * Public-facing preview for a template — read-only render of all pages
 * with a single "Customize" CTA. Clicking Customize opens the recipient
 * prompt; on confirm, we navigate to the page-by-page wizard.
 */
export default function TemplatePreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sourceType = searchParams.get('src') === 'BuilderTemplate' ? 'BuilderTemplate' : 'Template';

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState(false);
  const [activePage, setActivePage] = useState(0);
  /* Device the preview is shown in. The frame reshapes to this device's
     artboard and the responsive engine adapts the layout to match. */
  const [device, setDevice] = useState('mobile');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const tpl = await templatesAPI.get(id, sourceType);
        if (!cancelled) setTemplate(tpl);
      } catch {
        if (!cancelled) setTemplate(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, sourceType]);

  const structure = useMemo(() => {
    const raw = template?.structure;
    if (raw == null) return null;
    if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try { return JSON.parse(raw); } catch { return null; }
    }
    return null;
  }, [template?.structure]);

  /* Page count — used to drive the external nav. We rely on
     extractSlotsFromStructure (which already handles both builderState
     and legacy modes) so the count matches what the deck will render. */
  const pageCount = useMemo(() => {
    if (!structure) return 0;
    const slots = extractSlotsFromStructure(structure);
    return slots?.pages?.length || 1;
  }, [structure]);

  useEffect(() => {
    if (activePage >= pageCount) setActivePage(Math.max(0, pageCount - 1));
  }, [activePage, pageCount]);

  /* Device-view config. Prefer the template's own per-device artboard
     dimensions (responsive engine); fall back to the global presets so
     legacy templates still get a sensible mobile/tablet/desktop frame. */
  const responsiveCfg =
    structure && typeof structure === 'object' ? structure.builderState?.responsive : null;
  const artboard =
    (responsiveCfg?.enabled && responsiveCfg.breakpoints?.[device]) || BREAKPOINT_PRESETS[device];
  const aw = artboard?.width || 390;
  const ah = artboard?.height || 844;
  // On-screen cap per device so the frame always fits the viewport.
  const deviceMaxW = device === 'mobile' ? 420 : device === 'tablet' ? 720 : 1040;

  return (
    <div className="relative min-h-screen pb-16">
      <FloatingDecor density="low" />

      {/* Header — back link + themed hero card */}
      <header className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 sm:pt-10">
        <Link
          to="/studio"
          className="group inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3.5 py-1.5 text-sm font-bold text-slate-200 hover:bg-white/10 hover:border-pink-300/50 transition"
        >
          <span aria-hidden className="text-pink-400 transition-transform group-hover:-translate-x-0.5">←</span>
          <span>Back to templates</span>
        </Link>

        <GlassCard tone="strong" hover="none" className="!rounded-[2rem] mt-5 p-6 sm:p-8 relative overflow-hidden">
          <NeonOrb color="#EC4899" size="20rem" style={{ top: '-6rem', right: '-5rem' }} opacity={0.5} />
          <NeonOrb color="#8B5CF6" size="16rem" style={{ bottom: '-5rem', left: '-4rem' }} opacity={0.4} />
          <div className="absolute inset-0 bg-grid-soft opacity-20 pointer-events-none" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <span className="eyebrow"><span>Template preview</span></span>
              <h1 className="section-title mt-4">
                <GradientText variant="warm">{template?.name || (loading ? 'Loading…' : 'Template')}</GradientText>
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {template?.category && <span className="badge-pill badge-brand">{template.category}</span>}
                {pageCount > 0 && <span className="badge-pill">{pageCount} {pageCount === 1 ? 'page' : 'pages'}</span>}
              </div>
              {template?.description && (
                <p className="mt-4 max-w-xl text-slate-300 leading-7">{template.description}</p>
              )}
            </div>
            <Button variant="candy" size="lg" onClick={() => setPicked(true)} disabled={!template} className="shrink-0">
              ✨ Customize this template
            </Button>
          </div>
        </GlassCard>
      </header>

      {/* Preview canvas — full template, read-only, with device switching */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 mt-8">
        {/* Device-view toggle — see how it adapts to each screen size */}
        <div className="flex items-center justify-center mb-5">
          <DeviceSelect
            value={device}
            options={['mobile', 'tablet', 'desktop']}
            size="md"
            align="center"
            onChange={setDevice}
          />
        </div>

        {/* Device frame — sized to the active artboard but capped to the
            viewport (width AND height) so the preview never forces an
            awkward page scroll, on any device. */}
        <motion.div
          key={device}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center"
        >
          <div
            className={`relative p-3 bg-gradient-to-br from-white/15 via-white/[0.06] to-white/15 border border-white/15 shadow-[0_30px_80px_-20px_rgba(124,58,237,0.45)] backdrop-blur-xl ${
              device === 'mobile' ? 'rounded-[2.25rem]' : 'rounded-[1.5rem]'
            }`}
            style={{ width: `min(100%, ${deviceMaxW}px, calc(70vh * ${aw} / ${ah}))` }}
          >
            {/* Faux device notch — phone only */}
            {device === 'mobile' && (
              <div className="absolute left-1/2 -translate-x-1/2 top-[14px] z-10 h-1.5 w-16 rounded-full bg-white/20" />
            )}
            <div
              className={`overflow-hidden bg-black/60 relative ${device === 'mobile' ? 'rounded-[1.75rem]' : 'rounded-[1.1rem]'}`}
              style={{ aspectRatio: `${aw} / ${ah}` }}
            >
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-pulse">
                    <StorylyMark size={56} idSuffix="preview-loader" />
                  </div>
                </div>
              ) : !structure ? (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm px-6 text-center">
                  Couldn’t load this template.
                </div>
              ) : (
                /* The deck fills the device frame; the responsive engine
                   reshapes the artboard to the selected device via
                   `previewBreakpoint`. */
                <div className="absolute inset-0">
                  <SlideshowBuilder
                    structure={structure}
                    fills={{}}
                    themeOverrides={{}}
                    alwaysShowStoryDuringCountdown
                    embedded
                    previewBreakpoint={device}
                    activeIndex={activePage}
                    onActiveIndexChange={setActivePage}
                    className="!w-full !h-full [&_.html-deck-root]:!h-full [&_.html-deck-root]:!min-h-0 [&_.html-deck-root]:!border-0 [&_.html-deck-root]:!rounded-none [&_.html-template-root]:!h-full [&_.html-template-root]:!min-h-0 [&_.html-template-root]:!border-0 [&_.html-template-root]:!rounded-none"
                  />
                </div>
              )}
            </div>
          </div>
          {/* External page nav — rendered outside the card so the deck
              inside can stay clipped to its 9:16 frame. Only shown when
              the template has more than one page. */}
          {pageCount > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setActivePage((i) => Math.max(0, i - 1))}
                disabled={activePage <= 0}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeft size={18} strokeWidth={2.4} />
              </button>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: pageCount }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActivePage(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === activePage
                        ? 'w-7 bg-pink-300'
                        : 'w-1.5 bg-white/30 hover:bg-white/50'
                    }`}
                    aria-label={`Go to page ${i + 1}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setActivePage((i) => Math.min(pageCount - 1, i + 1))}
                disabled={activePage >= pageCount - 1}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight size={18} strokeWidth={2.4} />
              </button>
            </div>
          )}
          <p className="mt-3 text-center text-[10px] uppercase tracking-[0.22em] text-slate-400">
            Page {Math.min(activePage + 1, pageCount)} of {pageCount} · {device} preview
          </p>
        </motion.div>
      </main>

      {/* Recipient prompt — fires when the user commits to customizing.
          On confirm we hop into the wizard with the name + sourceType
          threaded through the URL. */}
      <RecipientPromptModal
        open={picked}
        template={template}
        onCancel={() => setPicked(false)}
        onConfirm={(name) => {
          setPicked(false);
          if (!template?._id) return;
          const qs = new URLSearchParams({ for: name });
          if (sourceType === 'BuilderTemplate') qs.set('src', 'BuilderTemplate');
          navigate(`/template/${template._id}/customize?${qs.toString()}`);
        }}
      />
    </div>
  );
}
