import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Trash2,
  Undo2, Redo2, Plus, Image as ImageIcon, Files, Layers, Sparkles,
  Shapes as ShapesIcon, Music, Settings2, Palette,
  MousePointer2, Save, Rocket, X as XIcon, ChevronLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { templatesAPI, videosAPI } from '../api/api';
import { getLikedTemplateSnapshot } from '../hooks/useLikedTemplates';
import {
  validateBuilderState,
  defaultVisualBuilderState,
  normalizeBuilderState,
  updateBuilderTextBySlot,
  updateBuilderBlockPositionPctSynced,
  bringBlockToFrontBySlot,
  arrangeBuilderPage,
  updateBuilderBlockSizeForDevice,
  updateBuilderBlockRotateSynced,
  defaultResponsiveConfig,
  FILTER_PRESETS,
  ENTER_ANIM_PRESETS,
  STICKER_PRESETS,
  SHAPE_PRESETS,
  MUSIC_LIBRARY,
  TEXT_EFFECT_PRESETS,
  LOOP_ANIM_PRESETS,
  PAGE_EFFECT_PRESETS,
  MEDIA_SHAPE_PRESETS,
  BUILDER_FONT_OPTIONS,
  VIEWPORT_PRESETS,
} from '../lib/visualTemplateBuilder';
import { cloneBuilderStateFromTemplate, buildStructureSnapshot } from '../lib/userStudioDraft';
import { DARK_INPUT_CLASS, DARK_SELECT_CLASS } from '../lib/uiClasses';
import DeviceSelect from '../components/DeviceSelect';
import SlideshowBuilder from '../components/SlideshowBuilder';
import FabricEditorCanvas from '../components/FabricEditorCanvas';
import LayersPanel from '../components/LayersPanel';
import TextStudioPanel from '../components/TextStudioPanel';
import TypographyPresetsPanel from '../components/TypographyPresetsPanel';
import GameStudioPanel, { GAME_TYPES } from '../components/GameStudioPanel';
import ArrangeMenu from '../components/ArrangeMenu';
import MusicEngine from '../components/MusicEngine';
import ViewLiveMenu from '../components/ViewLiveMenu';
import FontBar from '../components/FontBar';
import ButtonStudioPanel from '../components/ButtonStudioPanel';
import { MOTION_BG_PRESETS, normalizeMotionBg } from '../lib/motionBackgrounds';
import { StorylyMark } from '../components/StorylyLogo';
import FloatingDecor from '../ui/FloatingDecor';
import useLockBodyScroll from '../hooks/useLockBodyScroll';

/* One-tap theme presets — copied from the admin editor so the user's Studio
   offers the exact same looks. (Kept local; the admin file owns its own copy
   and must not be touched.) */
const THEME_PRESETS = [
  { id: 'candy',     name: 'Candy',     bgMotion: true,  gradientFrom: '#fdf2f8', gradientTo: '#a78bfa', gradientAngle: 150, textColor: '#3b0764', headingColor: '#7c2d70', buttonBackground: '#d946ef', buttonText: '#ffffff', fontFamily: '"Fredoka", system-ui, sans-serif', pageAnimation: 'fade' },
  { id: 'sunset',    name: 'Sunset',    bgMotion: true,  gradientFrom: '#fb7185', gradientTo: '#7c3aed', gradientAngle: 145, textColor: '#fff5f7', headingColor: '#ffd166', buttonBackground: '#ffd166', buttonText: '#3b0764', fontFamily: '"Poppins", system-ui, sans-serif', pageAnimation: 'fade' },
  { id: 'ocean',     name: 'Ocean',     bgMotion: true,  gradientFrom: '#0ea5e9', gradientTo: '#6366f1', gradientAngle: 160, textColor: '#ecfeff', headingColor: '#a5f3fc', buttonBackground: '#a5f3fc', buttonText: '#083344', fontFamily: '"Inter", system-ui, sans-serif', pageAnimation: 'slideUp' },
  { id: 'lavender',  name: 'Lavender',  bgMotion: false, gradientFrom: '#ede9fe', gradientTo: '#c4b5fd', gradientAngle: 155, textColor: '#3b0764', headingColor: '#6d28d9', buttonBackground: '#8b5cf6', buttonText: '#ffffff', fontFamily: '"Playfair Display", Georgia, serif', pageAnimation: 'fade' },
  { id: 'midnight',  name: 'Midnight',  bgMotion: true,  gradientFrom: '#0f172a', gradientTo: '#7c3aed', gradientAngle: 150, textColor: '#e2e8f0', headingColor: '#c4b5fd', buttonBackground: '#a78bfa', buttonText: '#0f172a', fontFamily: '"Space Grotesk", system-ui, sans-serif', pageAnimation: 'zoom' },
  { id: 'forest',    name: 'Forest',    bgMotion: false, gradientFrom: '#064e3b', gradientTo: '#0ea5e9', gradientAngle: 160, textColor: '#ecfdf5', headingColor: '#6ee7b7', buttonBackground: '#34d399', buttonText: '#064e3b', fontFamily: '"Inter", system-ui, sans-serif', pageAnimation: 'slideUp' },
  { id: 'peach',     name: 'Peach',     bgMotion: false, gradientFrom: '#ffedd5', gradientTo: '#fbcfe8', gradientAngle: 150, textColor: '#7c2d12', headingColor: '#be185d', buttonBackground: '#fb7185', buttonText: '#ffffff', fontFamily: '"Quicksand", system-ui, sans-serif', pageAnimation: 'fade' },
  { id: 'aurora',    name: 'Aurora',    bgMotion: true,  gradientFrom: '#22d3ee', gradientTo: '#d946ef', gradientAngle: 135, textColor: '#f0fdfa', headingColor: '#f5d0fe', buttonBackground: '#e879f9', buttonText: '#083344', fontFamily: '"Fredoka", system-ui, sans-serif', pageAnimation: 'drift' },
  { id: 'rosegold',  name: 'Rose Gold',  bgMotion: true,  gradientFrom: '#fde2e4', gradientTo: '#e8b4bc', gradientAngle: 150, textColor: '#5c2a35', headingColor: '#a8324a', buttonBackground: '#d98a9a', buttonText: '#ffffff', fontFamily: '"Cormorant Garamond", serif', pageAnimation: 'fade' },
  { id: 'mint',      name: 'Mint',       bgMotion: false, gradientFrom: '#d1fae5', gradientTo: '#99f6e4', gradientAngle: 155, textColor: '#064e3b', headingColor: '#0f766e', buttonBackground: '#10b981', buttonText: '#ffffff', fontFamily: '"Quicksand", system-ui, sans-serif', pageAnimation: 'slideUp' },
  { id: 'galaxy',    name: 'Galaxy',     bgMotion: true,  gradientFrom: '#1e1b4b', gradientTo: '#be185d', gradientAngle: 160, textColor: '#ede9fe', headingColor: '#f0abfc', buttonBackground: '#a855f7', buttonText: '#ffffff', fontFamily: '"Space Grotesk", system-ui, sans-serif', pageAnimation: 'zoom' },
  { id: 'cyberpunk', name: 'Cyberpunk',  bgMotion: true,  gradientFrom: '#05d9e8', gradientTo: '#ff2a6d', gradientAngle: 135, textColor: '#eafcff', headingColor: '#fee715', buttonBackground: '#ff2a6d', buttonText: '#0b0c10', fontFamily: '"Audiowide", cursive', pageAnimation: 'drift' },
  { id: 'coffee',    name: 'Coffee',     bgMotion: false, gradientFrom: '#3e2723', gradientTo: '#a1887f', gradientAngle: 150, textColor: '#efebe9', headingColor: '#ffcc80', buttonBackground: '#bcaaa4', buttonText: '#3e2723', fontFamily: '"Merriweather", Georgia, serif', pageAnimation: 'fade' },
  { id: 'sky',       name: 'Sky',        bgMotion: true,  gradientFrom: '#bae6fd', gradientTo: '#e0f2fe', gradientAngle: 165, textColor: '#0c4a6e', headingColor: '#0369a1', buttonBackground: '#0ea5e9', buttonText: '#ffffff', fontFamily: '"Nunito", system-ui, sans-serif', pageAnimation: 'slideUp' },
  { id: 'cherry',    name: 'Cherry',     bgMotion: true,  gradientFrom: '#be123c', gradientTo: '#fb7185', gradientAngle: 145, textColor: '#fff1f2', headingColor: '#ffe4e6', buttonBackground: '#fda4af', buttonText: '#881337', fontFamily: '"Pacifico", cursive', pageAnimation: 'fade' },
  { id: 'emerald',   name: 'Emerald',    bgMotion: false, gradientFrom: '#022c22', gradientTo: '#059669', gradientAngle: 155, textColor: '#d1fae5', headingColor: '#6ee7b7', buttonBackground: '#34d399', buttonText: '#022c22', fontFamily: '"Cinzel", serif', pageAnimation: 'zoom' },
  { id: 'mono',      name: 'Mono',       bgMotion: false, gradientFrom: '#111827', gradientTo: '#374151', gradientAngle: 160, textColor: '#f9fafb', headingColor: '#ffffff', buttonBackground: '#f9fafb', buttonText: '#111827', fontFamily: '"Inter", system-ui, sans-serif', pageAnimation: 'fade' },
  { id: 'bubblegum', name: 'Bubblegum',  bgMotion: true,  gradientFrom: '#f9a8d4', gradientTo: '#a5b4fc', gradientAngle: 150, textColor: '#4a044e', headingColor: '#9d174d', buttonBackground: '#ec4899', buttonText: '#ffffff', fontFamily: '"Bungee", cursive', pageAnimation: 'drift' },
  { id: 'gold',      name: 'Gold Luxe',  bgMotion: true,  gradientFrom: '#1a1a1a', gradientTo: '#b8860b', gradientAngle: 150, textColor: '#fdf6e3', headingColor: '#f5d67a', buttonBackground: '#d4af37', buttonText: '#1a1a1a', fontFamily: '"Playfair Display", Georgia, serif', pageAnimation: 'fade' },
];

function ShapePreview({ kind }) {
  const size = 28;
  const fill = '#d946ef';
  switch (kind) {
    case 'circle':
      return <svg width={size} height={size} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill={fill} /></svg>;
    case 'pill':
      return <svg width={size} height={size * 0.5} viewBox="0 0 24 12"><rect x="0" y="0" width="24" height="12" rx="6" fill={fill} /></svg>;
    case 'heart':
      return <svg width={size} height={size} viewBox="0 0 24 24"><path d="M12 21s-7-4.35-7-10.5C5 7.46 7.46 5 10.5 5c1.5 0 2.86.7 3.7 1.86C15.04 5.7 16.4 5 17.9 5c3.05 0 5.5 2.46 5.5 5.5 0 6.15-7 10.5-7 10.5H12z" fill={fill} transform="translate(-2,0)" /></svg>;
    case 'star':
      return <svg width={size} height={size} viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={fill} /></svg>;
    case 'blob':
      return <svg width={size} height={size} viewBox="0 0 200 200"><path d="M44.5,-58.8C57.4,-50.3,67.1,-36.8,71.5,-21.7C75.9,-6.6,75,9.9,68.5,23.2C62,36.4,49.9,46.4,36.6,55.7C23.3,65,8.7,73.5,-7.7,75.6C-24.2,77.7,-42.5,73.5,-54.1,62.6C-65.7,51.6,-70.4,33.9,-71.3,17.3C-72.2,0.8,-69.2,-14.7,-61.6,-27.5C-54,-40.3,-41.8,-50.4,-28.4,-58.2C-15,-66,-0.5,-71.5,12.7,-71.2C25.9,-71,40.6,-67.2,44.5,-58.8Z" transform="translate(100 100)" fill={fill} /></svg>;
    case 'speech':
      return <svg width={size} height={size * 0.8} viewBox="0 0 200 160"><path d="M20,20 H180 a20,20 0 0 1 20,20 V100 a20,20 0 0 1 -20,20 H80 L50,150 V120 H20 a20,20 0 0 1 -20,-20 V40 a20,20 0 0 1 20,-20 z" fill={fill} /></svg>;
    case 'rect':
    default:
      return <svg width={size} height={size} viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="4" fill={fill} /></svg>;
  }
}

/**
 * UserStudio — the user-facing visual editor. Same admin-style canvas
 * (SlideshowBuilder preview + FabricEditorCanvas drag/resize/rotate overlay,
 * Precision/Preview toggle, full add/edit/background/song tooling), but it
 * edits a PRIVATE copy of the template's builderState and persists it into the
 * user's own draft (a GeneratedVideo job). The master template is never
 * touched. Routes: /template/:id/edit and /template/:id/customize.
 */
export default function UserStudio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const recipientName = (searchParams.get('for') || '').trim();
  const sourceType = searchParams.get('src') === 'BuilderTemplate' ? 'BuilderTemplate' : 'Template';

  /* ── Load / page state ─────────────────────────────────────── */
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadedRecipient, setLoadedRecipient] = useState('');
  const usedLikedFallbackRef = useRef(false);
  /* Suppress the load effect re-firing when WE change `?edit=` after the
     first auto-create (else it would reload the empty draft and wipe edits). */
  const skipNextLoadRef = useRef(false);

  /* ── Editor state (mirrors the admin editor) ───────────────── */
  const [builderState, setBuilderState] = useState(() => defaultVisualBuilderState());
  const [activePage, setActivePage] = useState(0);
  const [themeScope, setThemeScope] = useState('page');
  const [selectedBlockIndex, setSelectedBlockIndex] = useState(null);
  const [selectedLayerIndices, setSelectedLayerIndices] = useState([]);
  const [fabricMode, setFabricMode] = useState(true);
  const editorArtboardRef = useRef(null);
  const blockClipboard = useRef(null);
  const [hasClipboard, setHasClipboard] = useState(false);
  const [musicOpen, setMusicOpen] = useState(false);
  const [musicTarget, setMusicTarget] = useState('theme'); // 'theme' | 'block'
  const [fontBarOpen, setFontBarOpen] = useState(false);
  const [previewBreakpoint, setPreviewBreakpoint] = useState(null);
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const [bgUploading, setBgUploading] = useState(false);
  const [picker, setPicker] = useState(null);            // 'sticker' | 'shape' | 'music' | null
  const [leftPanel, setLeftPanel] = useState(null);       // 'elements'|'media'|'pages'|'layers'|'themes'|null
  const [rightPanel, setRightPanel] = useState(null);     // 'properties'|null
  const [publishing, setPublishing] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  const [history, setHistory] = useState({ past: [], future: [] });
  const lastSnapshotRef = useRef(null);
  const skipNextHistoryRef = useRef(false);
  const HISTORY_LIMIT = 80;

  const normalizedBuilder = useMemo(() => normalizeBuilderState(builderState), [builderState]);

  useLockBodyScroll(true);

  /* Responsive engine derived state (same as admin). */
  const responsiveCfg = normalizedBuilder.responsive;
  const responsiveEnabled = !!responsiveCfg?.enabled;
  const baseBp = responsiveEnabled ? responsiveCfg.base : null;
  const activeBp = responsiveEnabled ? (previewBreakpoint || baseBp) : null;
  const activeArtboard = responsiveEnabled
    ? (responsiveCfg.breakpoints[activeBp] || responsiveCfg.breakpoints[baseBp])
    : null;

  const previewStructure = useMemo(
    () => ({
      mode: 'html',
      html: '',
      type: 'slideshow',
      builderState: normalizeBuilderState(builderState),
      deck: { pageTimerEnabled: true, autoPlay: false, pageMode: true },
    }),
    [builderState]
  );
  const builderPreviewError = validateBuilderState(builderState);
  const templateName = template?.name || loadedRecipient || 'My page';
  const effectiveRecipient = (loadedRecipient || recipientName || '').trim();

  /* ── Load the template + (optionally) resume a draft ───────── */
  useEffect(() => {
    if (skipNextLoadRef.current) { skipNextLoadRef.current = false; return; }
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    (async () => {
      usedLikedFallbackRef.current = false;
      let tpl = null;
      try {
        tpl = await templatesAPI.get(id, sourceType);
      } catch {
        // Live template gone — fall back to the user's liked snapshot.
        const snap = getLikedTemplateSnapshot(id);
        if (snap) { tpl = snap; usedLikedFallbackRef.current = true; }
      }
      if (cancelled) return;
      if (!tpl) { setNotFound(true); setLoading(false); return; }
      setTemplate(tpl);

      let nextBuilder = cloneBuilderStateFromTemplate(tpl);
      if (editId) {
        try {
          const job = await videosAPI.get(editId);
          if (cancelled) return;
          const jobTplId = String(job.templateId?._id || job.templateId || job.customizations?.templateId || '');
          if (jobTplId && jobTplId !== id) {
            setNotFound(true); setLoading(false); return;
          }
          const savedBs = job.customizations?.builderState
            || job.customizations?.structureSnapshot?.builderState;
          if (savedBs && typeof savedBs === 'object') {
            try { nextBuilder = normalizeBuilderState(JSON.parse(JSON.stringify(savedBs))); }
            catch { nextBuilder = normalizeBuilderState(savedBs); }
          }
          if (job.recipientName) setLoadedRecipient(job.recipientName);
          if (job._id) draftJobIdRef.current = job._id;
        } catch {
          /* Couldn't load the draft — start from the template clone. */
        }
      }
      if (cancelled) return;
      skipNextHistoryRef.current = true;
      setBuilderState(nextBuilder);
      setActivePage(0);
      setSelectedBlockIndex(null);
      setSelectedLayerIndices([]);
      setHistory({ past: [], future: [] });
      lastSnapshotRef.current = null;
      setLoaded(true);
      setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, editId, sourceType]);

  /* Upgrade legacy (non-responsive) templates so the device picker works —
     same as the admin editor. */
  useEffect(() => {
    if (!loaded || responsiveEnabled) return;
    setBuilderState((prev) => {
      const n = normalizeBuilderState(prev);
      if (n.responsive?.enabled) return prev;
      return { ...n, responsive: defaultResponsiveConfig(n.viewport || 'desktop') };
    });
  }, [loaded, responsiveEnabled]);

  /* ── Undo / redo history (snapshots of builderState) ───────── */
  useEffect(() => {
    if (skipNextHistoryRef.current) {
      skipNextHistoryRef.current = false;
      lastSnapshotRef.current = JSON.stringify(builderState);
      return;
    }
    const snap = JSON.stringify(builderState);
    if (snap === lastSnapshotRef.current) return;
    if (lastSnapshotRef.current != null) {
      const prev = lastSnapshotRef.current;
      setHistory((h) => ({ past: [...h.past.slice(-(HISTORY_LIMIT - 1)), prev], future: [] }));
    }
    lastSnapshotRef.current = snap;
  }, [builderState]);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (!h.past.length) return h;
      const prevSnap = h.past[h.past.length - 1];
      const currentSnap = JSON.stringify(builderState);
      skipNextHistoryRef.current = true;
      setBuilderState(JSON.parse(prevSnap));
      return { past: h.past.slice(0, -1), future: [...h.future, currentSnap].slice(-HISTORY_LIMIT) };
    });
  }, [builderState]);

  const redo = useCallback(() => {
    setHistory((h) => {
      if (!h.future.length) return h;
      const nextSnap = h.future[h.future.length - 1];
      const currentSnap = JSON.stringify(builderState);
      skipNextHistoryRef.current = true;
      setBuilderState(JSON.parse(nextSnap));
      return { past: [...h.past, currentSnap].slice(-HISTORY_LIMIT), future: h.future.slice(0, -1) };
    });
  }, [builderState]);

  /* ── Selection housekeeping (ported from admin) ────────────── */
  useEffect(() => {
    setSelectedLayerIndices((prev) => {
      if (selectedBlockIndex == null) return prev.length ? [] : prev;
      if (prev.includes(selectedBlockIndex)) return prev;
      return [selectedBlockIndex];
    });
  }, [selectedBlockIndex]);

  useEffect(() => { setSelectedLayerIndices([]); setSelectedBlockIndex(null); }, [activePage]);

  useEffect(() => {
    if (!fabricMode) { setSelectedBlockIndex(null); setSelectedLayerIndices([]); }
  }, [fabricMode]);

  useEffect(() => {
    if (activePage >= normalizedBuilder.pages.length) setActivePage(Math.max(0, normalizedBuilder.pages.length - 1));
  }, [activePage, normalizedBuilder.pages.length]);

  useEffect(() => {
    const blocks = normalizedBuilder.pages[activePage]?.blocks || [];
    if (selectedBlockIndex != null && selectedBlockIndex >= blocks.length) {
      setSelectedBlockIndex(blocks.length ? blocks.length - 1 : null);
    }
  }, [normalizedBuilder, activePage, selectedBlockIndex]);

  const selectedSlotForCanvas = useMemo(() => {
    if (selectedBlockIndex == null) return null;
    return `p${activePage + 1}_b${selectedBlockIndex}`;
  }, [activePage, selectedBlockIndex]);

  /* ── builderState mutation helpers (ported from admin) ─────── */
  const setPageAt = (pageIndex, nextPage) => {
    const pages = [...normalizedBuilder.pages];
    pages[pageIndex] = nextPage;
    setBuilderState({ ...normalizedBuilder, pages });
  };
  const patchPage = (pageIndex, patch) => {
    const page = normalizedBuilder.pages[pageIndex];
    if (!page) return;
    setPageAt(pageIndex, { ...page, ...patch });
  };
  const patchTheme = (patch) =>
    setBuilderState((prev) => {
      const n = normalizeBuilderState(prev);
      return { ...n, theme: { ...n.theme, ...patch } };
    });
  const patchActivePage = (patch) =>
    setBuilderState((prev) => {
      const n = normalizeBuilderState(prev);
      const pages = [...n.pages];
      if (!pages[activePage]) return n;
      pages[activePage] = { ...pages[activePage], ...patch };
      return { ...n, pages };
    });

  const newGroupId = () => `g_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36)}`;

  /* ── Add elements ──────────────────────────────────────────── */
  const addBlockQuick = (kind) => {
    const page = normalizedBuilder.pages[activePage];
    if (!page) return;
    let block = { type: 'text', text: 'Text' };
    if (kind === 'text') block = { type: 'text', text: 'Type your text' };
    if (kind === 'heading') block = { type: 'heading', text: 'Heading' };
    if (kind === 'gallery') block = { type: 'gallery', count: 6, slotPrefix: `gal${activePage + 1}`, galleryAnimation: 'fade', photoDurationMs: 1200 };
    if (kind === 'image') block = { type: 'image', slotKey: 'photo', label: 'Photo', defaultUrl: '', mediaFit: 'cover', mediaRadius: 12, mediaShadow: true };
    if (kind === 'gif') block = { type: 'gif', slotKey: 'gif', label: 'GIF', defaultUrl: '', mediaFit: 'cover', mediaRadius: 12, mediaShadow: true };
    if (kind === 'video') block = { type: 'video', slotKey: 'video', label: 'Video', defaultUrl: '', mediaFit: 'cover', mediaRadius: 12, mediaShadow: true };
    if (kind === 'button') {
      const targetRaw = window.prompt(`Go to which page? (1 - ${normalizedBuilder.pages.length})`, String(Math.min(activePage + 2, normalizedBuilder.pages.length)));
      const target = Number(targetRaw);
      block = { type: 'button', label: 'Tap', navPage: Number.isFinite(target) && target > 0 ? target : 1, buttonStyle: 'stable' };
    }
    const GAME_DEFAULTS = {
      trickyn: { type: 'trickyn', question: 'Do you love me? 💕', yesText: 'Yes 🥰', noText: 'No', successText: "Yay! I knew it! 💖", loopAnimation: 'none' },
      reveal: { type: 'reveal', coverText: 'Tap to reveal 🎁', message: 'Surprise! 🎉', loopAnimation: 'none' },
      quiz: { type: 'quiz', question: 'Which one is correct?', options: ['Paris', 'London', 'Rome'], correctIndex: 0, loopAnimation: 'none' },
      poll: { type: 'poll', question: 'What do you think?', options: ['Yes', 'No', 'Maybe'], loopAnimation: 'none' },
      memory: { type: 'memory', emojis: ['🍎', '⭐', '🎈', '🌸', '🐱', '🍩'], loopAnimation: 'none' },
      spot: { type: 'spot', emoji: '😀', odd: '😈', count: 20, loopAnimation: 'none' },
      wheel: { type: 'wheel', segments: ['Prize 🎁', 'Again', 'Win! 🏆', 'Oops', 'Lucky ⭐', 'Try'], loopAnimation: 'none' },
      giftbox: { type: 'giftbox', message: "🎉 You're invited!", boxEmoji: '🎁', loopAnimation: 'none' },
      flip: { type: 'flip', front: 'Tap me 👆', back: 'Surprise! 🎉', loopAnimation: 'none' },
      slot: { type: 'slot', symbols: ['🍒', '🍋', '🔔', '⭐', '7️⃣', '🍀'], loopAnimation: 'none' },
      puzzle: { type: 'puzzle', puzzleImageUrl: '', loopAnimation: 'none' },
      rps: { type: 'rps', question: 'Rock · Paper · Scissors', loopAnimation: 'none' },
      tapsong: { type: 'tapsong', icon: '🎵', label: 'Tap to play', songUrl: '', tapImage: '', loopAnimation: 'none' },
    };
    if (GAME_DEFAULTS[kind]) block = GAME_DEFAULTS[kind];
    block = { loopAnimation: 'float', ...block };
    const blocks = [...(page.blocks || []), block];
    setPageAt(activePage, { ...page, blocks });
    setSelectedBlockIndex(blocks.length - 1);
  };

  const addStickerQuick = (emoji) => {
    const page = normalizedBuilder.pages[activePage];
    if (!page) return;
    const block = { type: 'sticker', emoji: emoji || '✨', size: 88, enterAnimation: 'pop', loopAnimation: 'float' };
    const blocks = [...(page.blocks || []), block];
    setPageAt(activePage, { ...page, blocks });
    setSelectedBlockIndex(blocks.length - 1);
    setPicker(null);
  };

  const addShapeQuick = (kind) => {
    const page = normalizedBuilder.pages[activePage];
    if (!page) return;
    const block = {
      type: 'shape', shapeKind: kind || 'rect',
      width: kind === 'pill' ? 220 : 160, height: kind === 'pill' ? 64 : 160,
      fillColor: '#d946ef', strokeColor: 'transparent', strokeWidth: 0, opacity: 1,
      enterAnimation: 'zoom', loopAnimation: 'float',
    };
    const blocks = [...(page.blocks || []), block];
    setPageAt(activePage, { ...page, blocks });
    setSelectedBlockIndex(blocks.length - 1);
    setPicker(null);
  };

  const addCountdownQuick = () => {
    const page = normalizedBuilder.pages[activePage];
    if (!page) return;
    const t = new Date(Date.now() + 7 * 86400 * 1000);
    const pad = (n) => String(n).padStart(2, '0');
    const targetLocal = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}T${pad(t.getHours())}:${pad(t.getMinutes())}`;
    const block = { type: 'countdown', targetISO: new Date(targetLocal).toISOString(), title: 'Counting down to', style: 'card', accentColor: '#d946ef', enterAnimation: 'pop' };
    const blocks = [...(page.blocks || []), block];
    setPageAt(activePage, { ...page, blocks });
    setSelectedBlockIndex(blocks.length - 1);
  };

  /* ── Block ops ─────────────────────────────────────────────── */
  const updateSelectedBlock = (patch) => {
    const page = normalizedBuilder.pages[activePage];
    if (!page) return;
    const blocks = [...(page.blocks || [])];
    const current = blocks[selectedBlockIndex];
    if (!current) return;
    blocks[selectedBlockIndex] = { ...current, ...patch };
    setPageAt(activePage, { ...page, blocks });
  };

  const removeSelectedBlock = () => {
    const page = normalizedBuilder.pages[activePage];
    if (!page) return;
    const blocks = (page.blocks || []).filter((_, i) => i !== selectedBlockIndex);
    setPageAt(activePage, { ...page, blocks });
    setSelectedBlockIndex(blocks.length ? Math.max(0, selectedBlockIndex - 1) : null);
  };

  const reorderBlock = (pageIndex, fromIdx, toIdx) => {
    const page = normalizedBuilder.pages[pageIndex];
    if (!page) return;
    const blocks = [...(page.blocks || [])];
    if (fromIdx < 0 || fromIdx >= blocks.length) return;
    if (toIdx < 0 || toIdx >= blocks.length) return;
    const [moved] = blocks.splice(fromIdx, 1);
    blocks.splice(toIdx, 0, moved);
    setPageAt(pageIndex, { ...page, blocks });
    setSelectedBlockIndex(toIdx);
  };

  const duplicateBlockAt = (pageIndex, idx) => {
    const page = normalizedBuilder.pages[pageIndex];
    if (!page) return;
    const blocks = [...(page.blocks || [])];
    const src = blocks[idx];
    if (!src) return;
    const copy = JSON.parse(JSON.stringify(src));
    if (Number.isFinite(Number(copy.x))) copy.x = Number(copy.x) + 24;
    if (Number.isFinite(Number(copy.y))) copy.y = Number(copy.y) + 24;
    blocks.splice(idx + 1, 0, copy);
    setPageAt(pageIndex, { ...page, blocks });
    setSelectedBlockIndex(idx + 1);
  };

  const copyBlockAt = (pageIndex, idx) => {
    const src = normalizedBuilder.pages[pageIndex]?.blocks?.[idx];
    if (!src) return;
    blockClipboard.current = JSON.parse(JSON.stringify(src));
    setHasClipboard(true);
    toast.success('Copied');
  };

  const pasteBlock = (pageIndex) => {
    const src = blockClipboard.current;
    if (!src) return;
    const page = normalizedBuilder.pages[pageIndex];
    if (!page) return;
    const blocks = [...(page.blocks || [])];
    const copy = JSON.parse(JSON.stringify(src));
    if (Number.isFinite(Number(copy.x))) copy.x = Number(copy.x) + 24;
    if (Number.isFinite(Number(copy.y))) copy.y = Number(copy.y) + 24;
    if (Number.isFinite(Number(copy.xPct))) copy.xPct = Math.min(96, Number(copy.xPct) + 4);
    if (Number.isFinite(Number(copy.yPct))) copy.yPct = Math.min(96, Number(copy.yPct) + 4);
    blocks.push(copy);
    setPageAt(pageIndex, { ...page, blocks });
    setSelectedBlockIndex(blocks.length - 1);
  };

  const deleteBlockAt = (pageIndex, idx) => {
    const page = normalizedBuilder.pages[pageIndex];
    if (!page) return;
    const blocks = (page.blocks || []).filter((_, i) => i !== idx);
    setPageAt(pageIndex, { ...page, blocks });
    if (selectedBlockIndex >= blocks.length) setSelectedBlockIndex(blocks.length ? blocks.length - 1 : null);
  };

  const handleSelectionChange = useCallback((slot) => {
    if (!slot) { setSelectedBlockIndex(null); return; }
    const m = /^p(\d+)_b(\d+)$/.exec(String(slot));
    if (!m) return;
    const pageIdx = Number(m[1]) - 1;
    const blockIdx = Number(m[2]);
    if (pageIdx !== activePage) setActivePage(pageIdx);
    setLeftPanel(null);
    setPicker(null);
    setSelectedBlockIndex(blockIdx);
  }, [activePage]);

  /* ── Layers panel ops ──────────────────────────────────────── */
  const selectLayers = (indices) => {
    const arr = Array.isArray(indices) ? indices : [];
    setSelectedLayerIndices(arr);
    setSelectedBlockIndex(arr.length ? arr[arr.length - 1] : null);
  };
  const writeBlocks = (mutate, nextSelObjs) => {
    const page = normalizedBuilder.pages[activePage];
    if (!page) return;
    const blocks = page.blocks || [];
    const next = mutate(blocks);
    if (!next) return;
    setPageAt(activePage, { ...page, blocks: next });
    if (nextSelObjs) {
      const sel = nextSelObjs.map((o) => next.indexOf(o)).filter((i) => i >= 0).sort((a, b) => a - b);
      setSelectedLayerIndices(sel);
      setSelectedBlockIndex(sel.length ? sel[sel.length - 1] : null);
    }
  };
  const reorderLayerRows = (descriptors) => {
    const page = normalizedBuilder.pages[activePage];
    if (!page) return;
    const blocks = page.blocks || [];
    const selObjs = selectedLayerIndices.map((i) => blocks[i]).filter(Boolean);
    const bottomToTop = [...descriptors].reverse();
    const used = new Set();
    const next = [];
    bottomToTop.forEach((d) => (d.indices || []).forEach((i) => {
      if (blocks[i] && !used.has(i)) { used.add(i); next.push(blocks[i]); }
    }));
    blocks.forEach((b, i) => { if (!used.has(i)) next.push(b); });
    writeBlocks(() => next, selObjs);
  };
  const setLayerName = (index, name) =>
    writeBlocks((blocks) => blocks.map((b, i) => (i === index ? { ...b, name: String(name).slice(0, 60) } : b)));
  const toggleLayersField = (indices, field) => {
    const set = new Set(indices);
    writeBlocks((blocks) => {
      const allOn = indices.every((i) => blocks[i] && blocks[i][field]);
      return blocks.map((b, i) => (set.has(i) ? { ...b, [field]: !allOn } : b));
    });
  };
  const duplicateLayers = (indices) => {
    const idxs = [...new Set(indices)].sort((a, b) => a - b);
    if (!idxs.length) return;
    const page = normalizedBuilder.pages[activePage];
    const blocks = page?.blocks || [];
    const gidMap = {};
    const copies = idxs.map((i) => {
      const c = JSON.parse(JSON.stringify(blocks[i]));
      if (c.groupId) { gidMap[c.groupId] = gidMap[c.groupId] || newGroupId(); c.groupId = gidMap[c.groupId]; }
      if (Number.isFinite(Number(c.xPct))) c.xPct = Math.min(96, Number(c.xPct) + 4);
      if (Number.isFinite(Number(c.yPct))) c.yPct = Math.min(96, Number(c.yPct) + 4);
      if (Number.isFinite(Number(c.x))) c.x = Number(c.x) + 24;
      if (Number.isFinite(Number(c.y))) c.y = Number(c.y) + 24;
      return c;
    });
    const at = Math.max(...idxs) + 1;
    writeBlocks((bl) => [...bl.slice(0, at), ...copies, ...bl.slice(at)], copies);
  };
  const deleteLayers = (indices) => {
    const set = new Set(indices);
    writeBlocks((blocks) => blocks.filter((_, i) => !set.has(i)));
    setSelectedLayerIndices([]);
    setSelectedBlockIndex(null);
  };
  const groupLayers = (indices) => {
    const idxs = [...new Set(indices)].filter((i) => normalizedBuilder.pages[activePage]?.blocks?.[i]).sort((a, b) => a - b);
    if (idxs.length < 2) return;
    const gid = newGroupId();
    const blocks = normalizedBuilder.pages[activePage].blocks;
    const members = idxs.map((i) => ({ ...blocks[i], groupId: gid }));
    const rest = blocks.filter((_, i) => !idxs.includes(i));
    const maxIdx = idxs[idxs.length - 1];
    let at = 0;
    blocks.forEach((_, i) => { if (i <= maxIdx && !idxs.includes(i)) at++; });
    writeBlocks(() => [...rest.slice(0, at), ...members, ...rest.slice(at)], members);
  };
  const ungroupLayers = (groupId) => {
    if (!groupId) return;
    writeBlocks((blocks) => blocks.map((b) => (b.groupId === groupId ? { ...b, groupId: '' } : b)));
  };

  /* ── Pages ─────────────────────────────────────────────────── */
  const addPageQuick = () => {
    let nextIndex = 0;
    setBuilderState((prev) => {
      const n = normalizeBuilderState(prev);
      nextIndex = n.pages.length;
      const pages = [...n.pages, {
        id: `p_${Date.now()}`, pageTitle: `Page ${nextIndex + 1}`, pageDurationMs: '', pageBackground: '',
        blocks: [{ type: 'heading', text: 'New page', xPct: 50, yPct: 28, anchor: 'center' }],
      }];
      return { ...n, pages };
    });
    setActivePage(nextIndex);
    setSelectedBlockIndex(null);
    setSelectedLayerIndices([]);
  };
  const deletePageAt = (idx) => {
    if (normalizedBuilder.pages.length <= 1) { toast.error('A page needs at least one slide.'); return; }
    setBuilderState((prev) => {
      const n = normalizeBuilderState(prev);
      if (n.pages.length <= 1) return n;
      return { ...n, pages: n.pages.filter((_, i) => i !== idx) };
    });
    setActivePage((cur) => (cur > idx ? cur - 1 : cur));
    setSelectedBlockIndex(null);
    setSelectedLayerIndices([]);
  };
  const duplicatePageAt = (idx) => {
    setBuilderState((prev) => {
      const n = normalizeBuilderState(prev);
      const src = n.pages[idx];
      if (!src) return n;
      const copy = JSON.parse(JSON.stringify(src));
      copy.id = `p_${Date.now()}`;
      copy.pageTitle = `${src.pageTitle || 'Page'} copy`;
      return { ...n, pages: [...n.pages.slice(0, idx + 1), copy, ...n.pages.slice(idx + 1)] };
    });
    setActivePage(idx + 1);
    setSelectedBlockIndex(null);
    setSelectedLayerIndices([]);
  };
  const movePage = (idx, dir) => {
    const to = idx + dir;
    setBuilderState((prev) => {
      const n = normalizeBuilderState(prev);
      if (to < 0 || to >= n.pages.length) return n;
      const pages = [...n.pages];
      const [m] = pages.splice(idx, 1);
      pages.splice(to, 0, m);
      return { ...n, pages };
    });
    setActivePage((cur) => (cur === idx ? to : cur === to ? idx : cur));
  };

  /* ── Media + background uploads ────────────────────────────── */
  const uploadGameImage = async (file) => {
    if (!file) return null;
    try { const { url } = await videosAPI.uploadMedia(file); return url; }
    catch (err) { toast.error(err.message || 'Upload failed'); return null; }
  };

  const addUploadedMediaBlock = async (file, mediaType) => {
    if (!file) return;
    const page = normalizedBuilder.pages[activePage];
    if (!page) return;
    const tmpId = `up_${Date.now()}_${Math.round(performance.now())}`;
    const placeholder = {
      type: mediaType,
      slotKey: mediaType === 'gif' ? 'gif' : mediaType === 'video' ? 'video' : 'photo',
      label: mediaType === 'gif' ? 'GIF' : mediaType === 'video' ? 'Video' : 'Photo',
      defaultUrl: '', mediaFit: 'cover', mediaRadius: 12, mediaShadow: true,
      loopAnimation: 'float', uploading: true, _tmpId: tmpId,
    };
    const startBlocks = [...(page.blocks || []), placeholder];
    setPageAt(activePage, { ...page, blocks: startBlocks });
    setSelectedBlockIndex(startBlocks.length - 1);
    setUploadingAsset(true);
    try {
      const { url } = await videosAPI.uploadMedia(file);
      setBuilderState((prev) => {
        const n = normalizeBuilderState(prev);
        const pages = n.pages.map((pg) => ({
          ...pg,
          blocks: (pg.blocks || []).map((b) => b._tmpId === tmpId ? { ...b, defaultUrl: url, uploading: false, _tmpId: undefined } : b),
        }));
        return { ...n, pages };
      });
    } catch (err) {
      setBuilderState((prev) => {
        const n = normalizeBuilderState(prev);
        const pages = n.pages.map((pg) => ({ ...pg, blocks: (pg.blocks || []).filter((b) => b._tmpId !== tmpId) }));
        return { ...n, pages };
      });
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingAsset(false);
    }
  };

  /* Replace the media URL of the SELECTED image/gif/video block in place — the
     core "change photo / change video" action for users. */
  const replaceSelectedMedia = async (file) => {
    if (!file) return;
    setUploadingAsset(true);
    try {
      const { url } = await videosAPI.uploadMedia(file);
      updateSelectedBlock({ defaultUrl: url, uploading: false });
      toast.success('Media updated.');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingAsset(false);
    }
  };

  const uploadGalleryPhotoAt = async (slotIndex, file) => {
    if (!file) return;
    const block = normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex];
    if (!block || block.type !== 'gallery') return;
    const prefix = block.slotPrefix || 'gal';
    const key = `${prefix}_${slotIndex}`;
    setUploadingAsset(true);
    try {
      const { url } = await videosAPI.uploadMedia(file);
      const defaults = { ...(block.galleryDefaults || {}), [key]: url };
      updateSelectedBlock({ galleryDefaults: defaults });
    } catch (err) {
      toast.error(err.message || 'Gallery upload failed');
    } finally {
      setUploadingAsset(false);
    }
  };

  const uploadPageBg = async (file, kind) => {
    if (!file) return;
    setBgUploading(true);
    try {
      const { url } = await videosAPI.uploadMedia(file);
      patchActivePage(kind === 'video' ? { pageVideoUrl: url, pageImageUrl: '' } : { pageImageUrl: url, pageVideoUrl: '' });
      toast.success('Background updated.');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setBgUploading(false);
    }
  };

  /* ── Music + themes ────────────────────────────────────────── */
  const setGlobalMusic = (url) => {
    setBuilderState((prev) => {
      const n = normalizeBuilderState(prev);
      return { ...n, theme: { ...n.theme, audioUrl: url || '' } };
    });
    setPicker(null);
  };
  const clearGlobalMusic = () => setGlobalMusic('');
  const saveStoryMusic = (musicObj) => {
    setBuilderState((prev) => {
      const n = normalizeBuilderState(prev);
      return { ...n, theme: { ...n.theme, music: musicObj, audioUrl: musicObj?.url || '' } };
    });
  };

  const pageThemeFields = (preset) => ({
    themeId: preset.id,
    pageBackground: `linear-gradient(${preset.gradientAngle}deg, ${preset.gradientFrom}, ${preset.gradientTo})`,
    textColor: preset.textColor, headingColor: preset.headingColor,
    buttonBackground: preset.buttonBackground, buttonText: preset.buttonText,
    fontFamily: preset.fontFamily, pageAnimation: preset.pageAnimation,
    motionBg: preset.bgMotion
      ? { type: 'gradient', color1: preset.gradientFrom, color2: preset.gradientTo, speed: 2 }
      : { type: 'none', color1: preset.gradientFrom, color2: preset.gradientTo, speed: 2 },
  });
  const applyTheme = (preset) => {
    if (themeScope === 'all') {
      setBuilderState((prev) => {
        const n = normalizeBuilderState(prev);
        const cleared = {
          themeId: '', pageBackground: '', textColor: '', headingColor: '',
          buttonBackground: '', buttonText: '', fontFamily: '', pageAnimation: '',
          motionBg: { type: 'none', color1: preset.gradientFrom, color2: preset.gradientTo, speed: 2 },
        };
        return {
          ...n,
          theme: {
            ...n.theme, backgroundKind: 'gradient', bgMotion: !!preset.bgMotion,
            gradientFrom: preset.gradientFrom, gradientTo: preset.gradientTo, gradientAngle: preset.gradientAngle,
            textColor: preset.textColor, headingColor: preset.headingColor,
            buttonBackground: preset.buttonBackground, buttonText: preset.buttonText,
            fontFamily: preset.fontFamily, pageAnimation: preset.pageAnimation,
          },
          pages: n.pages.map((p) => ({ ...p, ...cleared })),
        };
      });
      return;
    }
    patchActivePage(pageThemeFields(preset));
  };

  const openLivePreview = (device = 'desktop') => {
    try { localStorage.setItem('storyly:livePreview', JSON.stringify(previewStructure)); } catch { /* quota */ }
    window.open(`/live-preview?d=${device}`, '_blank', 'noopener');
  };

  /* ── Draft save / publish lifecycle (user's own GeneratedVideo) ─ */
  const draftJobIdRef = useRef(editId || null);
  const readyForSaveRef = useRef(false);
  const buildPayloadRef = useRef(null);

  const buildCustomizations = useCallback(() => ({
    structureSnapshot: buildStructureSnapshot(builderState),
    builderState: normalizeBuilderState(builderState),
    themeOverrides: {},
    slots: {},
    ...(usedLikedFallbackRef.current ? {
      templateName: template?.name,
      templateCategory: template?.category,
      templateThumb: template?.thumbnailUrl,
    } : {}),
  }), [builderState, template]);

  const buildDraftPayload = useCallback(() => ({
    id: draftJobIdRef.current || undefined,
    templateId: id,
    sourceType,
    recipientName: effectiveRecipient,
    customizations: buildCustomizations(),
  }), [id, sourceType, effectiveRecipient, buildCustomizations]);

  /* Keep a ref to the freshest payload BUILDER (cheap assignment) instead of
     serializing the design every render — the expensive structure snapshot is
     only built at flush time (unmount / tab-hide / unload). */
  buildPayloadRef.current = buildDraftPayload;

  const saveDraft = useCallback(async ({ silent = false } = {}) => {
    if (!template) return;
    try {
      if (!silent) setSavingDraft(true);
      const saved = await videosAPI.saveDraft(buildDraftPayload());
      if (saved?._id) {
        draftJobIdRef.current = saved._id;
        if (!editId) {
          skipNextLoadRef.current = true;
          const params = new URLSearchParams(searchParams);
          params.set('edit', saved._id);
          params.delete('for');
          setSearchParams(params, { replace: true });
        }
      }
      if (!silent) toast.success('Draft saved');
      return saved;
    } catch (err) {
      if (!silent) toast.error(err.message || 'Could not save draft');
    } finally {
      if (!silent) setSavingDraft(false);
    }
  }, [template, buildDraftPayload, editId, searchParams, setSearchParams]);

  /* Auto-create a draft on first mount with a fresh template so an id exists
     for subsequent saves (mirrors TemplateDetail). */
  useEffect(() => {
    if (!template || !loaded) return;
    if (editId || draftJobIdRef.current) { readyForSaveRef.current = true; return; }
    if (readyForSaveRef.current) return;
    (async () => {
      const saved = await saveDraft({ silent: true });
      if (saved?._id) readyForSaveRef.current = true;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, loaded, editId]);

  /* Flush latest state on unmount (keepalive) + tab hide + page unload. */
  useEffect(() => {
    return () => {
      if (!readyForSaveRef.current || !draftJobIdRef.current) return;
      const payload = buildPayloadRef.current?.();
      if (!payload || !payload.templateId) return;
      try {
        fetch(`/api/videos/draft`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          keepalive: true, body: JSON.stringify({ ...payload, id: draftJobIdRef.current }),
        });
      } catch { /* best-effort */ }
    };
  }, []);
  useEffect(() => {
    const onBeforeUnload = () => {
      if (!readyForSaveRef.current || !draftJobIdRef.current) return;
      const payload = buildPayloadRef.current?.();
      if (!payload || !payload.templateId) return;
      try {
        const blob = new Blob([JSON.stringify({ ...payload, id: draftJobIdRef.current })], { type: 'application/json' });
        navigator.sendBeacon?.(`/api/videos/draft`, blob);
      } catch { /* best-effort */ }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);
  useEffect(() => {
    if (!template) return;
    const onVisibility = () => {
      if (document.visibilityState !== 'hidden') return;
      if (!readyForSaveRef.current || !draftJobIdRef.current) return;
      saveDraft({ silent: true });
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [template, saveDraft]);

  const handlePublish = async () => {
    if (publishing) return;
    setPublishing(true);
    try {
      const customizations = buildCustomizations();
      if (editId || draftJobIdRef.current) {
        // Slideshow pages complete instantly on PATCH (server sets
        // status='completed'), so no separate process() call is needed.
        await videosAPI.update(editId || draftJobIdRef.current, { customizations });
        toast.success('Published! 🎉');
        navigate('/my-videos');
        return;
      }
      const { _id: jobId } = await videosAPI.createJob({
        templateId: id, sourceType, recipientName: effectiveRecipient, customizations,
      });
      await videosAPI.process(jobId);
      toast.success('Published! 🎉');
      navigate('/my-videos');
    } catch (err) {
      toast.error(err.message || 'Could not publish');
    } finally {
      setPublishing(false);
    }
  };

  const closeEditor = () => {
    saveDraft({ silent: true });
    navigate('/my-videos');
  };

  /* Keyboard: Cmd/Ctrl+Z undo, +Shift+Z redo, Cmd/Ctrl+S save draft. */
  useEffect(() => {
    const onKey = (e) => {
      const inEditable = e.target?.matches?.('input, textarea, select, [contenteditable], [contenteditable="true"]');
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === 'z') {
        if (inEditable) return;
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      } else if (k === 's') {
        e.preventDefault();
        if (!savingDraft) saveDraft({});
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, saveDraft, savingDraft]);

  /* ── Render: loading / not-found gates ─────────────────────── */
  if (loading) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950">
        <div className="animate-pulse"><StorylyMark size={64} idSuffix="studio-loader" /></div>
      </div>
    );
  }
  if (notFound) {
    return (
      <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-4 bg-slate-950 text-center px-6">
        <div className="text-6xl">🫥</div>
        <p className="text-white font-display text-2xl font-extrabold">Couldn’t open this template</p>
        <p className="text-slate-400 max-w-md">It may have been removed, or the link is wrong.</p>
        <button onClick={() => navigate('/studio')} className="btn-glow mt-2">Back to templates</button>
      </div>
    );
  }

  /* Active artboard sizing for the canvas (same math as admin). */
  const vpKey = normalizedBuilder.viewport || 'desktop';
  const vp = responsiveEnabled && activeArtboard ? activeArtboard : (VIEWPORT_PRESETS[vpKey] || VIEWPORT_PRESETS.desktop);
  const deviceKey = responsiveEnabled ? activeBp : vpKey;
  const maxW = deviceKey === 'mobile' ? 460 : deviceKey === 'tablet' ? 820 : 1280;
  const selBlock = normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex];

  return (
    <div data-lenis-prevent className="fixed inset-0 z-[80] flex flex-col overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0" style={{ zIndex: -1 }}>
        <FloatingDecor density="subtle" opacity={0.08} size={36} />
      </div>

      {/* ── Top toolbar ─────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between border-b border-white/10 bg-slate-950/95 px-4 py-3 gap-3">
        <div className="flex items-center gap-3 min-w-0 shrink-0">
          <button
            type="button"
            onClick={closeEditor}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 px-2.5 py-2 text-xs font-bold text-slate-200 transition"
            data-tooltip="Save & close" data-tooltip-pos="bottom"
          ><ChevronLeft size={15} strokeWidth={2.4} /> <span className="hidden sm:inline">Close</span></button>
          <div className="min-w-0 border-l border-white/10 pl-3">
            <p className="text-sm font-semibold text-white truncate max-w-[18ch]">{templateName}</p>
            <p className="text-[11px] text-slate-400 leading-tight">Page {activePage + 1} of {normalizedBuilder.pages.length}</p>
          </div>
          {effectiveRecipient && (
            <span className="hidden md:inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border" style={{ background: 'rgba(167,139,250,0.14)', borderColor: 'rgba(167,139,250,0.40)', color: '#DDD6FE' }}>
              <span aria-hidden>💌</span> For <span className="truncate max-w-[12ch]">{effectiveRecipient}</span>
            </span>
          )}
          <div className="flex items-center gap-0.5 border-l border-white/10 pl-3 ml-1">
            <button type="button" data-tooltip="Undo (Ctrl+Z)" data-tooltip-pos="bottom" aria-label="Undo" disabled={!history.past.length} onClick={undo}
              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-30 flex items-center justify-center text-slate-200 transition"><Undo2 size={16} strokeWidth={2.2} /></button>
            <button type="button" data-tooltip="Redo (Ctrl+Shift+Z)" data-tooltip-pos="bottom" aria-label="Redo" disabled={!history.future.length} onClick={redo}
              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-30 flex items-center justify-center text-slate-200 transition"><Redo2 size={16} strokeWidth={2.2} /></button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <DeviceSelect
            value={responsiveEnabled ? activeBp : (normalizedBuilder.viewport || 'desktop')}
            options={['mobile', 'tablet', 'desktop']}
            size="sm" align="left"
            onChange={(v) => {
              if (responsiveEnabled) setPreviewBreakpoint(v);
              else setBuilderState((prev) => ({ ...prev, viewport: v }));
            }}
          />
          <button
            type="button"
            onClick={() => setFabricMode((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition ${fabricMode ? 'bg-brand-500 text-white' : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'}`}
            data-tooltip={fabricMode ? 'Editing ON — select, move, resize, rotate. Click to PREVIEW (play games / tap buttons).' : 'Preview / Test mode — behaves like the live page. Click to edit.'}
            data-tooltip-pos="bottom" aria-pressed={fabricMode}
          >{fabricMode ? <><MousePointer2 size={14} strokeWidth={2.2} /> Precision</> : <><span aria-hidden>👁</span> Preview</>}</button>

          <ViewLiveMenu onPick={openLivePreview} />

          <div className="w-px h-6 bg-white/10 mx-1" />

          <button
            type="button"
            disabled={savingDraft}
            onClick={() => saveDraft({})}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 border border-white/15 hover:bg-white/10 disabled:opacity-60 transition"
            data-tooltip="Save draft (Ctrl/Cmd+S)" data-tooltip-pos="bottom"
          ><Save size={14} strokeWidth={2.2} /> {savingDraft ? 'Saving…' : 'Save'}</button>
          <button
            type="button"
            disabled={publishing}
            onClick={handlePublish}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-500 to-pink-500 px-3.5 py-2 text-xs font-bold text-white shadow-lg hover:opacity-95 active:scale-95 disabled:opacity-60 transition"
            data-tooltip="Publish your page" data-tooltip-pos="bottom" data-tooltip-align="end"
          ><Rocket size={14} strokeWidth={2.4} /> {publishing ? 'Publishing…' : 'Publish'}</button>
        </div>
      </div>

      {/* ── Tools row ───────────────────────────────────────── */}
      <div className="tpl-tools-row shrink-0 flex items-center gap-0.5 border-b border-white/10 bg-slate-950/95 px-3 py-2 overflow-x-auto overflow-y-hidden">
        {[
          { key: 'elements', label: 'Add', Icon: Plus },
          { key: 'media', label: 'Media', Icon: ImageIcon },
          { key: 'themes', label: 'Themes', Icon: Palette },
          { key: 'pages', label: 'Pages', Icon: Files },
          { key: 'layers', label: 'Layers', Icon: Layers },
        ].map(({ key, label, Icon }) => {
          const open = leftPanel === key;
          return (
            <button key={key} type="button" onClick={() => setLeftPanel((cur) => (cur === key ? null : key))}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition ${open ? 'bg-brand-500 text-slate-950' : 'bg-white/5 hover:bg-white/15 text-slate-200'}`}>
              <Icon size={14} strokeWidth={2.2} /> {label}
            </button>
          );
        })}
        <div className="shrink-0 w-px h-6 bg-white/10 mx-1" />
        <ArrangeMenu
          onArrange={(mode) => {
            setBuilderState((prev) => arrangeBuilderPage(prev, activePage, mode));
            setSelectedBlockIndex(null);
            setSelectedLayerIndices([]);
            toast.success('Arranged to fit the screen ✨', { position: 'bottom-center', duration: 1000 });
          }}
        />
        <div className="shrink-0 w-px h-6 bg-white/10 mx-1" />
        <button type="button" onClick={() => setPicker(picker === 'sticker' ? null : 'sticker')}
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition ${picker === 'sticker' ? 'bg-brand-500 text-slate-950' : 'bg-white/5 hover:bg-white/15 text-slate-200'}`}>
          <Sparkles size={14} strokeWidth={2.2} /> Stickers</button>
        <button type="button" onClick={() => setPicker(picker === 'shape' ? null : 'shape')}
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition ${picker === 'shape' ? 'bg-brand-500 text-slate-950' : 'bg-white/5 hover:bg-white/15 text-slate-200'}`}>
          <ShapesIcon size={14} strokeWidth={2.2} /> Shapes</button>
        <button type="button" onClick={() => { setMusicTarget('theme'); setMusicOpen(true); }}
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition ${normalizedBuilder.theme?.music?.url ? 'bg-brand-500 text-slate-950' : 'bg-white/5 hover:bg-white/15 text-slate-200'}`}
          data-tooltip="Music — search / upload, trim, fade, loop" data-tooltip-pos="bottom">
          <Music size={14} strokeWidth={2.2} /> {normalizedBuilder.theme?.music?.url ? 'Music ✓' : 'Music'}</button>
        <button type="button" onClick={() => setRightPanel((cur) => (cur ? null : 'properties'))}
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition ${rightPanel ? 'bg-brand-500 text-slate-950' : 'bg-white/5 hover:bg-white/15 text-slate-200'}`}>
          <Settings2 size={14} strokeWidth={2.2} /> Props</button>
      </div>

      {/* ── Pickers (floating) ──────────────────────────────── */}
      <div className="absolute left-3 right-3 top-[116px] z-30 pointer-events-none">
        <AnimatePresence>
          {picker === 'sticker' && (
            <motion.div key="picker-sticker" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              className="pointer-events-auto rounded-2xl border border-white/15 bg-slate-900/95 backdrop-blur-xl px-4 py-3 shadow-2xl max-w-2xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs uppercase tracking-widest text-slate-400">Pick a sticker</p>
                <button type="button" onClick={() => setPicker(null)} className="text-xs text-slate-400 hover:text-white">✕</button>
              </div>
              <div className="grid grid-cols-9 sm:grid-cols-12 gap-1.5 max-h-44 overflow-y-auto">
                {STICKER_PRESETS.map((e) => (
                  <button key={e} type="button" onClick={() => addStickerQuick(e)} className="rounded-lg bg-white/5 hover:bg-brand-500/30 text-2xl py-1.5 transition active:scale-90" title={e}>{e}</button>
                ))}
              </div>
            </motion.div>
          )}
          {picker === 'shape' && (
            <motion.div key="picker-shape" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              className="pointer-events-auto rounded-2xl border border-white/15 bg-slate-900/95 backdrop-blur-xl px-4 py-3 shadow-2xl max-w-2xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs uppercase tracking-widest text-slate-400">Add a shape</p>
                <button type="button" onClick={() => setPicker(null)} className="text-xs text-slate-400 hover:text-white">✕</button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {SHAPE_PRESETS.map((s) => (
                  <button key={s.value} type="button" onClick={() => addShapeQuick(s.value)}
                    className="rounded-xl border border-white/10 bg-white/5 hover:bg-brand-500/20 hover:border-brand-400 px-2 py-3 text-[11px] font-semibold text-slate-200 transition active:scale-95">
                    <ShapePreview kind={s.value} />
                    <span className="block mt-1.5">{s.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Main content area ───────────────────────────────── */}
      <div className="relative flex flex-1 overflow-hidden gap-0 p-0">
        {/* Contextual top control bar */}
        {selBlock && (() => {
          const sb = selBlock;
          const isText = ['text', 'heading', 'subheading', 'paragraph'].includes(sb.type);
          const isButton = sb.type === 'button' || sb.type === 'buttonSlot';
          const isMedia = sb.type === 'image' || sb.type === 'gif' || sb.type === 'video';
          const isShape = sb.type === 'shape';
          const TYPE_ICON = { text: '📝', heading: '📌', button: '🔘', gallery: '🖼️', gif: '🎬', image: '🖼️', video: '🎞️', sticker: '✨', shape: '⬛', countdown: '⏱️' };
          return (
            <div className="pointer-events-none absolute inset-x-0 top-2 z-30 flex justify-center px-3">
              <div className="ig-context-bar pointer-events-auto flex items-center gap-1.5 max-w-[calc(100%-1.5rem)] overflow-x-auto hide-scrollbar rounded-2xl border border-white/15 bg-slate-900/95 backdrop-blur-xl px-2 py-1.5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85)] animate-fade-in">
                <span className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1.5 text-[11px] font-bold text-slate-200">
                  <span>{TYPE_ICON[sb.type] || '⬚'}</span>
                  <span className="capitalize hidden sm:inline">{sb.type}</span>
                </span>
                <span className="shrink-0 w-px h-6 bg-white/10" />
                {(isText || isButton) && (
                  <button type="button" onClick={() => setFontBarOpen((v) => !v)} data-tooltip="Fonts" data-tooltip-pos="bottom" aria-pressed={fontBarOpen}
                    style={{ fontFamily: sb.fontFamily || undefined }}
                    className={`shrink-0 rounded-lg border px-3 py-1.5 text-sm leading-none transition ${fontBarOpen ? 'bg-brand-500 text-white border-brand-400' : 'bg-slate-900 text-white border-white/10 hover:bg-slate-800'}`}>Aa</button>
                )}
                {isText && (
                  <>
                    <label className="shrink-0 relative w-8 h-8 rounded-lg border border-white/10 overflow-hidden cursor-pointer" data-tooltip="Text / effect color" data-tooltip-pos="bottom">
                      <input type="color" value={sb.color || '#ffffff'} onChange={(e) => updateSelectedBlock({ color: e.target.value, textGradientFrom: e.target.value })} className="absolute inset-0 w-[150%] h-[150%] -m-1 cursor-pointer" />
                    </label>
                    <div className="shrink-0 flex rounded-lg border border-white/10 overflow-hidden">
                      {['left', 'center', 'right'].map((al) => {
                        const cur = sb.align || 'center';
                        return (
                          <button key={al} type="button" onClick={() => updateSelectedBlock({ align: al })}
                            className={`px-2 py-1.5 text-[11px] transition ${cur === al ? 'bg-brand-500 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`} aria-label={`Align ${al}`}>{al === 'left' ? '⬅' : al === 'center' ? '↔' : '➡'}</button>
                        );
                      })}
                    </div>
                    <select value={sb.textEffect || 'none'} onChange={(e) => updateSelectedBlock({ textEffect: e.target.value })} data-tooltip="Text effect" data-tooltip-pos="bottom"
                      className={`shrink-0 w-24 rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-[11px] text-white ${DARK_SELECT_CLASS}`}>
                      {TEXT_EFFECT_PRESETS.map((p) => (<option key={p.value} value={p.value}>{p.label}</option>))}
                    </select>
                    <span className="shrink-0 w-px h-6 bg-white/10" />
                  </>
                )}
                {isShape && (
                  <>
                    <label className="shrink-0 relative w-8 h-8 rounded-lg border border-white/10 overflow-hidden cursor-pointer" data-tooltip="Fill color" data-tooltip-pos="bottom">
                      <input type="color" value={sb.fillColor || '#d946ef'} onChange={(e) => updateSelectedBlock({ fillColor: e.target.value })} className="absolute inset-0 w-[150%] h-[150%] -m-1 cursor-pointer" />
                    </label>
                    <span className="shrink-0 w-px h-6 bg-white/10" />
                  </>
                )}
                {isMedia && (
                  <>
                    <label className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800 cursor-pointer transition" data-tooltip="Replace media" data-tooltip-pos="bottom">
                      🔁 Replace
                      <input type="file" accept={sb.type === 'video' ? 'video/*' : 'image/*'} className="hidden" onChange={(e) => { replaceSelectedMedia(e.target.files?.[0]); e.target.value = ''; }} />
                    </label>
                    <select value={sb.mediaShape || 'none'} onChange={(e) => updateSelectedBlock({ mediaShape: e.target.value })} data-tooltip="Frame shape" data-tooltip-pos="bottom"
                      className={`shrink-0 w-24 rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-[11px] text-white ${DARK_SELECT_CLASS}`}>
                      {MEDIA_SHAPE_PRESETS.map((sh) => (<option key={sh.value} value={sh.value}>{sh.value === 'none' ? '🖼️ Frame' : sh.label}</option>))}
                    </select>
                    <span className="shrink-0 w-px h-6 bg-white/10" />
                  </>
                )}
                <select value={!sb.loopAnimation || sb.loopAnimation === 'none' ? 'float' : sb.loopAnimation} onChange={(e) => updateSelectedBlock({ loopAnimation: e.target.value })} data-tooltip="Loop motion" data-tooltip-pos="bottom"
                  className={`shrink-0 w-24 rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-[11px] text-white ${DARK_SELECT_CLASS}`}>
                  {LOOP_ANIM_PRESETS.filter((a) => a.value !== 'none').map((a) => (<option key={a.value} value={a.value}>{a.label}</option>))}
                </select>
                <div className="shrink-0 flex items-center gap-1.5 rounded-lg bg-slate-900 border border-white/10 px-2 py-1.5" data-tooltip="Opacity" data-tooltip-pos="bottom">
                  <span className="text-[11px] text-slate-400">◐</span>
                  <input type="range" min={10} max={100} step={1} value={Math.round((sb.opacity ?? 1) * 100)} onChange={(e) => updateSelectedBlock({ opacity: Number(e.target.value) / 100 })} className="w-16 accent-brand-500 cursor-pointer" aria-label="Opacity" />
                  <span className="text-[10px] tabular-nums text-slate-400 w-7 text-right">{Math.round((sb.opacity ?? 1) * 100)}%</span>
                </div>
                <span className="shrink-0 w-px h-6 bg-white/10" />
                <button type="button" onClick={() => setRightPanel((cur) => (cur ? null : 'properties'))}
                  className={`shrink-0 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${rightPanel ? 'bg-brand-500 text-slate-950' : 'bg-white/5 hover:bg-white/15 text-slate-200'}`} data-tooltip="All properties" data-tooltip-pos="bottom">
                  <Settings2 size={13} strokeWidth={2.3} /> More</button>
                <button type="button" onClick={removeSelectedBlock} className="shrink-0 w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/25 flex items-center justify-center text-red-300 transition" data-tooltip="Delete element" data-tooltip-pos="bottom" aria-label="Delete element">
                  <Trash2 size={14} strokeWidth={2.2} /></button>
              </div>
            </div>
          );
        })()}

        <FontBar
          open={fontBarOpen && !!selBlock && ('text' in selBlock || ['button', 'buttonSlot'].includes(selBlock.type))}
          value={selBlock?.fontFamily || ''}
          onPick={(ff) => updateSelectedBlock({ fontFamily: ff })}
          onClose={() => setFontBarOpen(false)}
        />

        {(leftPanel || picker) && (
          <div className="absolute inset-0 z-20" onClick={() => { setLeftPanel(null); setPicker(null); }} aria-hidden />
        )}

        {/* ── Left tool panel ──────────────────────────────── */}
        {leftPanel && (
          <div className="absolute top-2 left-3 z-30 w-64 lg:w-72 max-w-[calc(100vw-1.5rem)] max-h-[calc(100%-1rem)] flex flex-col gap-3 overflow-y-auto hide-scrollbar rounded-2xl border border-white/15 bg-slate-950/95 backdrop-blur-xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85)] px-3.5 py-3 animate-fade-in">
            <div className="flex items-center justify-between sticky top-0 z-10 bg-slate-950/95 pb-2.5 -mt-1 pt-1 -mx-3.5 px-3.5 border-b border-white/10">
              <h4 className="flex items-center gap-1.5 text-sm font-extrabold text-white">
                {leftPanel === 'elements' && <>➕ <span>Add elements</span></>}
                {leftPanel === 'media' && <>📸 <span>Media</span></>}
                {leftPanel === 'themes' && <>🎨 <span>Themes</span></>}
                {leftPanel === 'pages' && <>📄 <span>Pages</span></>}
                {leftPanel === 'layers' && <>📐 <span>Layers</span></>}
              </h4>
              <button type="button" onClick={() => setLeftPanel(null)} className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition" aria-label="Close panel">✕</button>
            </div>

            {leftPanel === 'elements' && (
              <div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '📝 Text', kind: 'text' },
                    { label: '📌 Heading', kind: 'heading' },
                    { label: '🖼️ Gallery', kind: 'gallery' },
                    { label: '🎬 GIF', kind: 'gif' },
                    { label: '🔘 Button', kind: 'button' },
                  ].map(({ label, kind }) => (
                    <button key={kind} type="button" onClick={() => addBlockQuick(kind)} className="rounded-lg border border-white/10 bg-slate-900 px-2 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:border-brand-400 transition">{label}</button>
                  ))}
                  <button type="button" onClick={() => setPicker('sticker')} className="rounded-lg border border-white/10 bg-slate-900 px-2 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:border-brand-400 transition">😎 Stickers</button>
                  <button type="button" onClick={() => setPicker('shape')} className="rounded-lg border border-white/10 bg-slate-900 px-2 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:border-brand-400 transition">⬢ Shapes</button>
                  <button type="button" onClick={addCountdownQuick} className="col-span-2 rounded-lg border border-white/10 bg-slate-900 px-2 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:border-brand-400 transition">⏱ Countdown</button>
                </div>
                <p className="mt-4 mb-2 text-[10px] font-bold uppercase tracking-widest text-brand-200">🎮 Interactive & games</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '💘 Yes / No', kind: 'trickyn' }, { label: '🎁 Tap reveal', kind: 'reveal' },
                    { label: '❓ Quiz', kind: 'quiz' }, { label: '📊 Poll', kind: 'poll' },
                    { label: '🧠 Memory', kind: 'memory' }, { label: '🔍 Spot it', kind: 'spot' },
                    { label: '🎡 Spin wheel', kind: 'wheel' }, { label: '🎀 Gift box', kind: 'giftbox' },
                    { label: '🧩 Puzzle', kind: 'puzzle' }, { label: '🎰 Slot machine', kind: 'slot' },
                    { label: '🔄 Flip card', kind: 'flip' }, { label: '✊ Rock Paper', kind: 'rps' },
                    { label: '🎵 Tap to play', kind: 'tapsong' },
                  ].map(({ label, kind }) => (
                    <button key={kind} type="button" onClick={() => addBlockQuick(kind)} className="rounded-lg border border-white/10 bg-slate-900 px-2 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:border-brand-400 transition">{label}</button>
                  ))}
                </div>
              </div>
            )}

            {leftPanel === 'media' && (
              <div className="space-y-2">
                <label className="flex cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-slate-900 px-2 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:border-brand-400 transition">
                  📸 Photo
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => { addUploadedMediaBlock(e.target.files?.[0], 'image'); e.target.value = ''; }} />
                </label>
                <label className="flex cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-slate-900 px-2 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:border-brand-400 transition">
                  🎥 Video
                  <input type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={(e) => { addUploadedMediaBlock(e.target.files?.[0], 'video'); e.target.value = ''; }} />
                </label>
                <p className="text-[10px] text-slate-500">Tip: click a photo/video on the canvas, then “🔁 Replace” to swap it.</p>
              </div>
            )}

            {leftPanel === 'themes' && (
              <div>
                <div className="mb-2 flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
                  {[{ id: 'page', label: `This page (${activePage + 1})` }, { id: 'all', label: 'All pages' }].map((o) => (
                    <button key={o.id} type="button" onClick={() => setThemeScope(o.id)} aria-pressed={themeScope === o.id}
                      className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-bold transition ${themeScope === o.id ? 'bg-brand-500 text-white' : 'text-slate-300 hover:bg-white/5'}`}>{o.label}</button>
                  ))}
                </div>
                <p className="mb-2 text-[11px] text-slate-400">
                  {themeScope === 'page' ? 'Tap a theme — it restyles only this page.' : 'Tap a theme — it restyles every page.'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {THEME_PRESETS.map((t) => {
                    const active = themeScope === 'page'
                      ? normalizedBuilder.pages[activePage]?.themeId === t.id
                      : normalizedBuilder.theme?.gradientFrom === t.gradientFrom && normalizedBuilder.theme?.gradientTo === t.gradientTo;
                    return (
                      <button key={t.id} type="button" onClick={() => applyTheme(t)} aria-pressed={active}
                        className={`group relative rounded-xl overflow-hidden border text-left transition active:scale-[0.97] ${active ? 'border-brand-400 ring-2 ring-brand-400/50' : 'border-white/10 hover:border-brand-400'}`}>
                        <div className="h-14 w-full" style={{ background: `linear-gradient(${t.gradientAngle}deg, ${t.gradientFrom}, ${t.gradientTo})` }} />
                        <div className="flex items-center justify-between px-2 py-1.5 bg-slate-900">
                          <span className="text-[11px] font-bold text-slate-100">{t.name}</span>
                          {t.bgMotion && <span className="text-[9px] text-brand-300 font-bold">● motion</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 space-y-3">
                  <h5 className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-brand-200 font-extrabold"><span className="text-sm">🌈</span> Background</h5>
                  {(() => {
                    const pb = normalizedBuilder.pages[activePage]?.pageBackground || '';
                    const isSolid = /^(#|rgb)/i.test(pb) && !pb.includes('gradient');
                    const setSolid = (c) => patchActivePage({ pageBackground: c, pageImageUrl: '', pageVideoUrl: '' });
                    const SWATCHES = ['#0f172a', '#111827', '#1a1a2e', '#ffffff', '#fde2e4', '#0ea5e9', '#7c3aed', '#ec4899', '#10b981', '#f59e0b'];
                    return (
                      <div className="rounded-xl bg-white/[0.03] border border-white/10 p-2.5">
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">🎨 Solid color <span className="text-slate-500 normal-case font-normal">(this page)</span></label>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {SWATCHES.map((c) => (
                            <button key={c} type="button" onClick={() => setSolid(c)} aria-pressed={isSolid && pb.toLowerCase() === c}
                              className={`h-7 w-7 rounded-lg border transition ${isSolid && pb.toLowerCase() === c ? 'border-brand-400 ring-2 ring-brand-400/50' : 'border-white/15 hover:border-white/40'}`} style={{ background: c }} />
                          ))}
                          <label className="relative h-7 w-7 cursor-pointer overflow-hidden rounded-lg border border-white/15" data-tooltip="Custom color" data-tooltip-pos="top">
                            <span className="absolute inset-0 grid place-items-center text-[12px]">🎨</span>
                            <input type="color" value={isSolid ? pb : '#111827'} onChange={(e) => setSolid(e.target.value)} className="absolute inset-0 -m-2 h-[160%] w-[160%] cursor-pointer opacity-0" />
                          </label>
                          {pb && <button type="button" onClick={() => patchActivePage({ pageBackground: '' })} className="rounded-md bg-white/10 px-2 py-1 text-[10px] text-slate-300 hover:bg-white/20">clear</button>}
                        </div>
                      </div>
                    );
                  })()}
                  {(() => {
                    const m = normalizeMotionBg(normalizedBuilder.pages[activePage]?.motionBg);
                    const setM = (patch) => patchActivePage({ motionBg: { ...m, ...patch } });
                    return (
                      <div className="rounded-xl bg-white/[0.03] border border-white/10 p-2.5">
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">🎞️ Motion background <span className="text-slate-500 normal-case font-normal">(this page)</span></label>
                        <div className="flex flex-wrap gap-1.5">
                          {MOTION_BG_PRESETS.map((p) => {
                            const active = m.type === p.id;
                            return (
                              <button key={p.id} type="button" onClick={() => setM({ type: p.id })} aria-pressed={active}
                                className={`rounded-lg px-2 py-1 text-[11px] font-semibold border transition ${active ? 'bg-brand-500 text-white border-brand-300' : 'bg-slate-800 text-white border-white/15 hover:bg-slate-700'}`}>{p.icon} {p.label}</button>
                            );
                          })}
                        </div>
                        {m.type !== 'none' && (
                          <div className="mt-2.5 flex flex-wrap items-center gap-3">
                            <label className="flex items-center gap-1.5 text-[11px] text-slate-300">
                              <span className="relative w-7 h-7 rounded-lg border border-white/15 overflow-hidden cursor-pointer"><input type="color" value={m.color1} onChange={(e) => setM({ color1: e.target.value })} className="absolute inset-0 w-[160%] h-[160%] -m-2 cursor-pointer" /></span>Color 1
                            </label>
                            <label className="flex items-center gap-1.5 text-[11px] text-slate-300">
                              <span className="relative w-7 h-7 rounded-lg border border-white/15 overflow-hidden cursor-pointer"><input type="color" value={m.color2} onChange={(e) => setM({ color2: e.target.value })} className="absolute inset-0 w-[160%] h-[160%] -m-2 cursor-pointer" /></span>Color 2
                            </label>
                            <label className="flex items-center gap-2 text-[11px] text-slate-300">Speed<input type="range" min={1} max={3} step={1} value={m.speed} onChange={(e) => setM({ speed: Number(e.target.value) })} /></label>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <label className="flex items-center justify-between gap-2 rounded-xl bg-white/5 hover:bg-white/[0.08] px-3 py-2 text-xs font-semibold text-slate-100 cursor-pointer transition">
                    <span>✨ Animated gradient</span>
                    <input type="checkbox" checked={!!normalizedBuilder.theme?.bgMotion} onChange={(e) => patchTheme({ bgMotion: e.target.checked })} className="accent-brand-500 w-4 h-4" />
                  </label>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">🪄 Live effect</label>
                    <select value={normalizedBuilder.pages[activePage]?.pageEffect || 'none'} onChange={(e) => patchActivePage({ pageEffect: e.target.value })}
                      className={`tpl-cute-select w-full rounded-xl border border-white/12 bg-slate-900/80 px-3 py-2 text-xs font-medium text-white ${DARK_SELECT_CLASS}`}>
                      {PAGE_EFFECT_PRESETS.map((fx) => (<option key={fx.value} value={fx.value}>{fx.label}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">🖼️ Background image</label>
                    <div className="flex gap-1.5">
                      <input key={`bgimg-${activePage}-${normalizedBuilder.pages[activePage]?.pageImageUrl || ''}`} type="url" defaultValue={normalizedBuilder.pages[activePage]?.pageImageUrl || ''}
                        onBlur={(e) => { const u = e.target.value.trim(); patchActivePage(u ? { pageImageUrl: u, pageVideoUrl: '' } : { pageImageUrl: '' }); }} placeholder="https://…/photo.jpg"
                        className={`tpl-cute-input flex-1 min-w-0 rounded-xl border border-white/12 bg-slate-900/80 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`} />
                      <label className="shrink-0 flex cursor-pointer items-center justify-center w-9 rounded-xl border border-white/12 bg-slate-900/80 text-sm text-slate-200 hover:bg-brand-500/20 hover:border-brand-400 transition" data-tooltip="Upload image" data-tooltip-pos="top">
                        ⬆<input type="file" accept="image/*" className="hidden" onChange={(e) => { uploadPageBg(e.target.files?.[0], 'image'); e.target.value = ''; }} />
                      </label>
                      {normalizedBuilder.pages[activePage]?.pageImageUrl && (
                        <button type="button" onClick={() => patchActivePage({ pageImageUrl: '' })} className="shrink-0 w-9 rounded-xl border border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/25 transition flex items-center justify-center" data-tooltip="Remove image" data-tooltip-pos="top" aria-label="Remove background image"><Trash2 size={13} strokeWidth={2.2} /></button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">🎥 Background video</label>
                    <div className="flex gap-1.5">
                      <input key={`bgvid-${activePage}-${normalizedBuilder.pages[activePage]?.pageVideoUrl || ''}`} type="url" defaultValue={normalizedBuilder.pages[activePage]?.pageVideoUrl || ''}
                        onBlur={(e) => { const u = e.target.value.trim(); patchActivePage(u ? { pageVideoUrl: u, pageImageUrl: '' } : { pageVideoUrl: '' }); }} placeholder="https://…/clip.mp4"
                        className={`tpl-cute-input flex-1 min-w-0 rounded-xl border border-white/12 bg-slate-900/80 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`} />
                      <label className="shrink-0 flex cursor-pointer items-center justify-center w-9 rounded-xl border border-white/12 bg-slate-900/80 text-sm text-slate-200 hover:bg-brand-500/20 hover:border-brand-400 transition" data-tooltip="Upload video" data-tooltip-pos="top">
                        ⬆<input type="file" accept="video/*" className="hidden" onChange={(e) => { uploadPageBg(e.target.files?.[0], 'video'); e.target.value = ''; }} />
                      </label>
                      {normalizedBuilder.pages[activePage]?.pageVideoUrl && (
                        <button type="button" onClick={() => patchActivePage({ pageVideoUrl: '' })} className="shrink-0 w-9 rounded-xl border border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/25 transition flex items-center justify-center" data-tooltip="Remove video" data-tooltip-pos="top" aria-label="Remove background video"><Trash2 size={13} strokeWidth={2.2} /></button>
                      )}
                    </div>
                    <p className="mt-1 text-[10px] text-slate-500">A photo and video can't both be the background — setting one clears the other.</p>
                  </div>
                  {bgUploading && <p className="text-[10px] font-semibold text-brand-300">Uploading…</p>}
                </div>
              </div>
            )}

            {leftPanel === 'pages' && (
              <div className="space-y-1.5">
                {normalizedBuilder.pages.map((p, i) => {
                  const total = normalizedBuilder.pages.length;
                  const active = activePage === i;
                  return (
                    <div key={p.id || i} className={`group flex items-center gap-1 rounded-lg px-1.5 py-1.5 transition ${active ? 'bg-brand-500/20 ring-1 ring-brand-400' : 'bg-slate-800/40 hover:bg-slate-800/70'}`}>
                      <div className="-my-1 flex flex-col">
                        <button type="button" title="Move up" disabled={i === 0} onClick={() => movePage(i, -1)} className="h-3.5 w-4 text-[9px] leading-none text-slate-400 transition hover:text-white disabled:opacity-20">▲</button>
                        <button type="button" title="Move down" disabled={i === total - 1} onClick={() => movePage(i, 1)} className="h-3.5 w-4 text-[9px] leading-none text-slate-400 transition hover:text-white disabled:opacity-20">▼</button>
                      </div>
                      <button type="button" onClick={() => setActivePage(i)} className="flex flex-1 items-center gap-2 text-left">
                        <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md text-[11px] font-bold ${active ? 'bg-brand-500 text-slate-950' : 'bg-slate-700 text-slate-200'}`}>{i + 1}</span>
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate text-[11px] font-semibold ${active ? 'text-white' : 'text-slate-300'}`}>{p.pageTitle || `Page ${i + 1}`}</span>
                          <span className="block text-[9px] text-slate-500">{(p.blocks || []).length} layer{(p.blocks || []).length === 1 ? '' : 's'}</span>
                        </span>
                      </button>
                      <div className="flex items-center gap-0.5 opacity-70 transition group-hover:opacity-100">
                        <button type="button" title="Duplicate page" onClick={() => duplicatePageAt(i)} className="flex h-6 w-6 items-center justify-center rounded text-[11px] text-slate-300 hover:bg-white/15">⧉</button>
                        <button type="button" title="Delete page" disabled={total <= 1} onClick={() => deletePageAt(i)} className="flex h-6 w-6 items-center justify-center rounded text-[11px] text-rose-300 transition hover:bg-rose-500/30 disabled:opacity-25">🗑</button>
                      </div>
                    </div>
                  );
                })}
                <button type="button" onClick={addPageQuick} className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-brand-400/40 bg-brand-500/10 px-3 py-2 text-xs font-bold text-brand-200 transition hover:border-brand-400 hover:bg-brand-500/20">＋ Add page</button>
              </div>
            )}

            {leftPanel === 'layers' && (
              <LayersPanel
                blocks={normalizedBuilder.pages[activePage]?.blocks || []}
                selectedIndices={selectedLayerIndices}
                onSelectIndices={selectLayers}
                onReorderRows={reorderLayerRows}
                onRename={setLayerName}
                onToggleField={toggleLayersField}
                onDuplicate={duplicateLayers}
                onDelete={deleteLayers}
                onGroup={groupLayers}
                onUngroup={ungroupLayers}
              />
            )}
          </div>
        )}

        {/* ── Center canvas ────────────────────────────────── */}
        <div className="relative flex-1 flex flex-col gap-3 overflow-hidden">
          <div className="flex-1 min-h-0 p-3 relative overflow-auto"
            style={{ containerType: 'size', containerName: 'canvas-host', paddingTop: selectedBlockIndex != null ? '5.5rem' : undefined }}>
            <div className="min-h-full w-full flex justify-center" style={{ alignItems: 'safe center' }}>
              <div ref={editorArtboardRef} className="relative shrink-0 rounded-xl border border-white/10 bg-black overflow-hidden shadow-2xl"
                style={{ aspectRatio: `${vp.width} / ${vp.height}`, width: `min(100cqi, ${maxW}px)` }}>
                {builderPreviewError ? (
                  <div className="p-6 text-sm text-amber-300 flex items-center justify-center h-full">{builderPreviewError}</div>
                ) : (
                  <SlideshowBuilder
                    structure={previewStructure}
                    fills={{}}
                    editable={fabricMode}
                    dragMode={false}
                    previewBreakpoint={activeBp}
                    activeIndex={activePage}
                    onActiveIndexChange={setActivePage}
                    onTextSlotCommit={(slot, text) => setBuilderState((prev) => updateBuilderTextBySlot(prev, slot, text))}
                    onBlockMoveCommit={(slot, x, y, refW, refH) => {
                      const xPct = refW > 0 ? (x / refW) * 100 : null;
                      const yPct = refH > 0 ? (y / refH) * 100 : null;
                      setBuilderState((prev) => updateBuilderBlockPositionPctSynced(prev, slot, xPct, yPct));
                    }}
                    selectedSlot={selectedSlotForCanvas}
                    onSelectionChange={handleSelectionChange}
                    onResizeCommit={(slot, w, h) => setBuilderState((prev) => updateBuilderBlockSizeForDevice(prev, slot, w, h, activeBp))}
                    onRotateCommit={(slot, deg) => setBuilderState((prev) => updateBuilderBlockRotateSynced(prev, slot, deg))}
                    embedded
                    className="!w-full !h-full [&_.html-deck-root]:!h-full [&_.html-deck-root]:!min-h-0 [&_.html-deck-root]:!border-0 [&_.html-deck-root]:!rounded-none"
                  />
                )}
                {!builderPreviewError && (
                  <FabricEditorCanvas
                    enabled={fabricMode}
                    previewRef={editorArtboardRef}
                    blocks={normalizedBuilder.pages[activePage]?.blocks || []}
                    pageIndex={activePage}
                    designW={vp.width}
                    designH={vp.height}
                    selectedIndex={selectedBlockIndex}
                    selectedIndices={selectedLayerIndices}
                    onSelect={setSelectedBlockIndex}
                    onSelectMany={setSelectedLayerIndices}
                    onMoveCommit={(slot, x, y, refW, refH) => {
                      const xPct = refW > 0 ? (x / refW) * 100 : null;
                      const yPct = refH > 0 ? (y / refH) * 100 : null;
                      const m = /_b(\d+)$/.exec(slot);
                      const bi = m ? Number(m[1]) : -1;
                      const toFront = selectedLayerIndices.length <= 1 && !normalizedBuilder.pages[activePage]?.blocks?.[bi]?.groupId;
                      setBuilderState((prev) => {
                        const moved = updateBuilderBlockPositionPctSynced(prev, slot, xPct, yPct);
                        return toFront ? bringBlockToFrontBySlot(moved, slot) : moved;
                      });
                      if (toFront) {
                        const len = normalizedBuilder.pages[activePage]?.blocks?.length || 1;
                        setSelectedBlockIndex(len - 1);
                      }
                    }}
                    onResizeCommit={(slot, w, h) => setBuilderState((prev) => updateBuilderBlockSizeForDevice(prev, slot, w, h, activeBp))}
                    onRotateCommit={(slot, deg) => setBuilderState((prev) => updateBuilderBlockRotateSynced(prev, slot, deg))}
                    onDuplicate={(idx) => duplicateBlockAt(activePage, idx)}
                    onDelete={(idx) => deleteBlockAt(activePage, idx)}
                    onCopy={(idx) => copyBlockAt(activePage, idx)}
                    onPaste={() => pasteBlock(activePage)}
                    canPaste={hasClipboard}
                    onReorder={(idx, dir) => {
                      const len = normalizedBuilder.pages[activePage]?.blocks?.length || 0;
                      const to = dir === 'forward' ? Math.min(len - 1, idx + 1) : dir === 'back' ? Math.max(0, idx - 1) : dir === 'front' ? len - 1 : 0;
                      if (to !== idx) reorderBlock(activePage, idx, to);
                    }}
                  />
                )}
                {bgUploading && (
                  <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-slate-950/40 backdrop-blur-md animate-fade-in">
                    <span className="relative flex h-12 w-12">
                      <span className="absolute inset-0 rounded-full border-[3px] border-white/25" />
                      <span className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-brand-400 animate-spin" />
                      <span className="absolute inset-0 flex items-center justify-center text-lg">🖼️</span>
                    </span>
                    <p className="text-xs font-semibold text-white/90 tracking-wide">Updating background…</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {musicOpen && (() => {
            const selBlk = normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex];
            const forBlock = musicTarget === 'block' && selBlk?.type === 'tapsong';
            const initial = forBlock ? (selBlk.music?.url ? selBlk.music : (selBlk.songUrl ? { url: selBlk.songUrl } : null)) : normalizedBuilder.theme?.music;
            return (
              <MusicEngine
                music={initial}
                pages={normalizedBuilder.pages}
                onSave={forBlock ? (m) => updateSelectedBlock({ music: m, songUrl: m?.url || '' }) : saveStoryMusic}
                onUpload={uploadGameImage}
                onClose={() => setMusicOpen(false)}
              />
            );
          })()}

          <p className="text-center text-xs text-slate-500">
            Click any block to select • Drag corners to resize • Top handle to rotate •{' '}
            <span className="text-pink-300/80 font-semibold capitalize">
              {responsiveEnabled ? `Previewing ${activeBp} (${activeArtboard.width}×${activeArtboard.height})` : (normalizedBuilder.viewport === 'desktop' ? 'Designing for desktop' : 'Designing for mobile')}
            </span>
          </p>
        </div>

        {/* ── Right properties panel ───────────────────────── */}
        {rightPanel && (
          <div className="absolute top-2 right-3 z-30 w-60 lg:w-72 max-w-[calc(100vw-1.5rem)] max-h-[calc(100%-1rem)] flex flex-col gap-4 overflow-y-auto rounded-2xl border border-white/15 bg-slate-950/95 backdrop-blur-xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85)] px-3 py-3 animate-fade-in">
            <div className="flex items-center justify-between sticky top-0 bg-slate-950/95 pb-2 -mt-1 pt-1 -mx-3 px-3 border-b border-white/10">
              <h4 className="text-xs uppercase tracking-widest text-slate-300 font-bold">⚙️ Properties</h4>
              <button type="button" onClick={() => setRightPanel(null)} className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition" aria-label="Close panel">✕</button>
            </div>

            <div>
              <h4 className="mb-3 text-xs uppercase tracking-widest text-slate-400">Page Settings</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Title</label>
                  <input value={normalizedBuilder.pages[activePage]?.pageTitle || ''} onChange={(e) => patchPage(activePage, { pageTitle: e.target.value })} className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`} placeholder="Page title" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Duration (sec)</label>
                  <input type="number" min={0} max={120}
                    value={normalizedBuilder.pages[activePage]?.pageDurationMs === '' || normalizedBuilder.pages[activePage]?.pageDurationMs == null ? '' : Math.round(Number(normalizedBuilder.pages[activePage]?.pageDurationMs) / 1000)}
                    onChange={(e) => patchPage(activePage, { pageDurationMs: e.target.value === '' ? '' : Math.min(120000, Math.max(0, Number(e.target.value) * 1000)) })}
                    className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`} />
                </div>
              </div>
            </div>

            {(normalizedBuilder.pages[activePage]?.blocks || []).length > 0 && selBlock && (() => {
              const selType = selBlock.type;
              const TYPE_META = {
                heading: { icon: '🅰', label: 'Heading' }, subheading: { icon: '🅰', label: 'Subheading' },
                text: { icon: '🅰', label: 'Text' }, image: { icon: '🖼️', label: 'Image' },
                gif: { icon: '🎬', label: 'GIF' }, video: { icon: '🎞️', label: 'Video' },
                sticker: { icon: '😎', label: 'Sticker' }, shape: { icon: '⬢', label: 'Shape' },
                countdown: { icon: '⏱', label: 'Countdown' }, gallery: { icon: '🖼️', label: 'Gallery' },
                button: { icon: '🔘', label: 'Button' },
                trickyn: { icon: '💘', label: 'Yes / No' }, reveal: { icon: '🎁', label: 'Tap Reveal' },
                quiz: { icon: '❓', label: 'Quiz' }, poll: { icon: '📊', label: 'Poll' },
                memory: { icon: '🧠', label: 'Memory Game' }, spot: { icon: '🔍', label: 'Spot It' },
                wheel: { icon: '🎡', label: 'Spin Wheel' }, giftbox: { icon: '🎀', label: 'Gift Box' },
                flip: { icon: '🔄', label: 'Flip Card' }, slot: { icon: '🎰', label: 'Slot Machine' },
                puzzle: { icon: '🧩', label: 'Puzzle' }, rps: { icon: '✊', label: 'Rock Paper Scissors' },
                tapsong: { icon: '🎵', label: 'Tap to Play' },
              };
              const meta = TYPE_META[selType] || { icon: '⬚', label: 'Element' };
              return (
                <div>
                  <h4 className="mb-3 flex items-center gap-1.5 text-xs uppercase tracking-widest text-brand-300 font-bold"><span>{meta.icon}</span> {meta.label} properties</h4>
                  <div className="space-y-3">
                    {'text' in selBlock && (
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Text</label>
                        <textarea rows={3} value={selBlock.text || ''} onChange={(e) => updateSelectedBlock({ text: e.target.value })} className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`} placeholder="Edit text" />
                      </div>
                    )}
                    {'text' in selBlock && <TextStudioPanel block={selBlock} onChange={updateSelectedBlock} />}
                    {'text' in selBlock && <TypographyPresetsPanel onApply={updateSelectedBlock} />}
                    {'label' in selBlock && (
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Label</label>
                        <input value={selBlock.label || ''} onChange={(e) => updateSelectedBlock({ label: e.target.value })} className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`} placeholder="Button label" />
                      </div>
                    )}
                    {'navPage' in selBlock && (
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Navigate to Page</label>
                        <input type="number" min={1} max={normalizedBuilder.pages.length} value={selBlock.navPage ?? 1} onChange={(e) => updateSelectedBlock({ navPage: Number(e.target.value) || 1 })} className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`} />
                      </div>
                    )}
                    {['button', 'buttonSlot'].includes(selType) && <ButtonStudioPanel block={selBlock} onChange={updateSelectedBlock} />}
                    {GAME_TYPES.includes(selType) && (
                      <GameStudioPanel block={selBlock} onChange={updateSelectedBlock} onUploadImage={uploadGameImage} onOpenMusicEditor={() => { setMusicTarget('block'); setMusicOpen(true); }} />
                    )}

                    {/* Replace media — the user's core "change photo / video" action */}
                    {['image', 'gif', 'video'].includes(selType) && (
                      <div className="rounded-xl border border-brand-400/30 bg-brand-500/10 p-2.5">
                        <label className="block text-[11px] font-semibold text-brand-200 mb-1.5">🔁 Replace {selType === 'video' ? 'video' : 'photo'}</label>
                        <label className="flex cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-slate-900 px-2 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:border-brand-400 transition">
                          ⬆ Upload {selType === 'video' ? 'video' : 'image'}
                          <input type="file" accept={selType === 'video' ? 'video/*' : 'image/*'} className="hidden" onChange={(e) => { replaceSelectedMedia(e.target.files?.[0]); e.target.value = ''; }} />
                        </label>
                        <input type="url" defaultValue={selBlock.defaultUrl || ''} key={`mediaurl-${selectedBlockIndex}-${selBlock.defaultUrl || ''}`}
                          onBlur={(e) => updateSelectedBlock({ defaultUrl: e.target.value.trim() })} placeholder="…or paste a URL"
                          className={`mt-2 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-[11px] text-white ${DARK_INPUT_CLASS}`} />
                      </div>
                    )}

                    {selType === 'gallery' && (
                      <>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Photo Count</label>
                          <input type="number" min={1} max={12} value={selBlock.count ?? 4} onChange={(e) => updateSelectedBlock({ count: Math.min(12, Math.max(1, Number(e.target.value) || 4)) })} className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`} />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Photos</label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {Array.from({ length: Math.min(12, Math.max(1, Number(selBlock.count) || 4)) }).map((_, gi) => {
                              const prefix = selBlock.slotPrefix || 'gal';
                              const url = selBlock.galleryDefaults?.[`${prefix}_${gi}`];
                              return (
                                <label key={gi} className="relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-white/10 bg-slate-900 hover:border-brand-400 transition flex items-center justify-center">
                                  {url ? <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <span className="text-base text-slate-500">＋</span>}
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { uploadGalleryPhotoAt(gi, e.target.files?.[0]); e.target.value = ''; }} />
                                </label>
                              );
                            })}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Animation</label>
                          <select value={selBlock.galleryAnimation || 'fade'} onChange={(e) => updateSelectedBlock({ galleryAnimation: e.target.value })} className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}>
                            <option value="fade">Fade</option><option value="zoom">Zoom</option><option value="slide">Slide up</option><option value="lanes">Lanes</option><option value="autoVertical">Auto vertical</option>
                          </select>
                        </div>
                      </>
                    )}
                    {['image', 'gif', 'video', 'gallery'].includes(selType) && (
                      <>
                        {['image', 'gif', 'video'].includes(selType) && (
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Fit</label>
                            <select value={selBlock.mediaFit || 'cover'} onChange={(e) => updateSelectedBlock({ mediaFit: e.target.value })} className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}>
                              <option value="cover">Cover</option><option value="contain">Contain</option><option value="fill">Fill</option>
                            </select>
                          </div>
                        )}
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">🖼️ Frame shape</label>
                          <select value={selBlock.mediaShape || 'none'} onChange={(e) => updateSelectedBlock({ mediaShape: e.target.value })} className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}>
                            {MEDIA_SHAPE_PRESETS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
                          </select>
                        </div>
                        {selType === 'video' && (
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">🎬 Video display</label>
                            <select value={selBlock.videoMode || 'inline'} onChange={(e) => updateSelectedBlock({ videoMode: e.target.value })} className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}>
                              <option value="inline">Show inline (play in place)</option><option value="lightbox">Tap to play fullscreen</option>
                            </select>
                          </div>
                        )}
                        <div className="pt-1">
                          <label className="block text-xs font-semibold text-brand-300/90 mb-1.5">📷 Filters</label>
                          <div className="flex flex-wrap gap-1.5">
                            {FILTER_PRESETS.map((f) => {
                              const active = (selBlock.imageFilter || 'none') === f.value;
                              return (<button key={f.value} type="button" onClick={() => updateSelectedBlock({ imageFilter: f.value })} aria-pressed={active} className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${active ? 'bg-brand-500 text-white shadow' : 'bg-white/5 hover:bg-white/15 text-slate-200'}`}>{f.label}</button>);
                            })}
                          </div>
                        </div>
                        {[
                          { key: 'brightness', label: '☀ Brightness', min: 0, max: 200, def: 100, unit: '%' },
                          { key: 'contrast', label: '◐ Contrast', min: 0, max: 200, def: 100, unit: '%' },
                          { key: 'saturation', label: '🎨 Saturation', min: 0, max: 200, def: 100, unit: '%' },
                          { key: 'exposure', label: '◔ Exposure', min: 0, max: 200, def: 100, unit: '%' },
                          { key: 'blur', label: '🌫 Blur', min: 0, max: 30, def: 0, unit: 'px' },
                        ].map(({ key, label, min, max, def, unit }) => {
                          const cur = selBlock[key] ?? def;
                          return (
                            <div key={key}>
                              <label className="block text-xs text-slate-400 mb-1">{label}: {Math.round(cur)}{unit}</label>
                              <div className="flex items-center gap-2">
                                <input type="range" min={min} max={max} value={cur} onChange={(e) => updateSelectedBlock({ [key]: Number(e.target.value) })} className="w-full" />
                                <button type="button" title="Reset" onClick={() => updateSelectedBlock({ [key]: def })} className="rounded bg-white/5 hover:bg-white/15 text-slate-300 text-[10px] px-1.5 py-0.5">↺</button>
                              </div>
                            </div>
                          );
                        })}
                        <button type="button" onClick={() => updateSelectedBlock({ imageFilter: 'none', brightness: 100, contrast: 100, saturation: 100, exposure: 100, blur: 0 })} className="mt-1 w-full rounded-lg bg-white/5 hover:bg-white/15 text-slate-200 text-[11px] font-semibold py-1.5 transition">Reset all filters</button>
                      </>
                    )}

                    {selType === 'sticker' && (
                      <>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Emoji</label>
                          <input type="text" maxLength={4} value={selBlock.emoji || ''} onChange={(e) => updateSelectedBlock({ emoji: e.target.value })} className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xl text-white text-center ${DARK_INPUT_CLASS}`} />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Size: {selBlock.size || 64}px</label>
                          <input type="range" min={20} max={240} value={selBlock.size || 64} onChange={(e) => updateSelectedBlock({ size: Number(e.target.value) })} className="w-full" />
                        </div>
                      </>
                    )}

                    {selType === 'shape' && (
                      <>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Kind</label>
                          <select value={selBlock.shapeKind || 'rect'} onChange={(e) => updateSelectedBlock({ shapeKind: e.target.value })} className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}>
                            {SHAPE_PRESETS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Fill color</label>
                          <input type="color" value={selBlock.fillColor || '#d946ef'} onChange={(e) => updateSelectedBlock({ fillColor: e.target.value })} className="w-full h-9 rounded-lg border border-white/10 bg-slate-900" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">W</label>
                            <input type="number" min={20} max={800} value={selBlock.width || 160} onChange={(e) => updateSelectedBlock({ width: Number(e.target.value) || 160 })} className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`} />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">H</label>
                            <input type="number" min={20} max={800} value={selBlock.height || 160} onChange={(e) => updateSelectedBlock({ height: Number(e.target.value) || 160 })} className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Opacity: {Math.round((selBlock.opacity ?? 1) * 100)}%</label>
                          <input type="range" min={0} max={100} value={Math.round((selBlock.opacity ?? 1) * 100)} onChange={(e) => updateSelectedBlock({ opacity: Number(e.target.value) / 100 })} className="w-full" />
                        </div>
                      </>
                    )}

                    {selType === 'countdown' && (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">⏱ Target date & time</label>
                          <input type="datetime-local"
                            value={(() => {
                              const iso = selBlock.targetISO;
                              if (!iso) return '';
                              try { const d = new Date(iso); if (!isFinite(d.getTime())) return ''; const pad = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; } catch { return ''; }
                            })()}
                            onChange={(e) => { const v = e.target.value; if (!v) { updateSelectedBlock({ targetISO: '' }); return; } try { updateSelectedBlock({ targetISO: new Date(v).toISOString() }); } catch {} }}
                            className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`} />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Title</label>
                          <input value={selBlock.title || ''} onChange={(e) => updateSelectedBlock({ title: e.target.value })} placeholder="Counting down to" className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Style</label>
                            <select value={selBlock.style || 'card'} onChange={(e) => updateSelectedBlock({ style: e.target.value })} className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}>
                              <option value="minimal">Minimal</option><option value="card">Card</option><option value="mega">Mega</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Accent</label>
                            <input type="color" value={selBlock.accentColor || '#d946ef'} onChange={(e) => updateSelectedBlock({ accentColor: e.target.value })} className="w-full h-9 rounded-lg border border-white/10 bg-slate-900" />
                          </div>
                        </div>
                      </div>
                    )}

                    {['text', 'heading', 'subheading', 'paragraph'].includes(selType) && (
                      <div className="border-t border-white/5 pt-3 space-y-2">
                        <label className="block text-xs text-slate-400 mb-1">🅰 Text effect</label>
                        <select value={selBlock.textEffect || 'none'} onChange={(e) => updateSelectedBlock({ textEffect: e.target.value })} className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}>
                          {TEXT_EFFECT_PRESETS.map((p) => (<option key={p.value} value={p.value}>{p.label}</option>))}
                        </select>
                        {['gradient', 'neon', 'glow', 'stroke'].includes(selBlock.textEffect) && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] text-slate-500 mb-1">Color 1</label>
                              <input type="color" value={selBlock.textGradientFrom || '#f97316'} onChange={(e) => updateSelectedBlock({ textGradientFrom: e.target.value })} className="w-full h-8 rounded-lg border border-white/10 bg-slate-900" />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-500 mb-1">Color 2</label>
                              <input type="color" value={selBlock.textGradientTo || '#d946ef'} onChange={(e) => updateSelectedBlock({ textGradientTo: e.target.value })} className="w-full h-8 rounded-lg border border-white/10 bg-slate-900" />
                            </div>
                          </div>
                        )}
                        <label className="block text-xs text-slate-400 mt-1">Font</label>
                        <select value={selBlock.fontFamily || ''} onChange={(e) => updateSelectedBlock({ fontFamily: e.target.value })} className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}>
                          <option value="">Inherit</option>
                          {BUILDER_FONT_OPTIONS.map((f) => (<option key={f.value} value={f.value}>{f.group} — {f.label}</option>))}
                        </select>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">Weight</label>
                            <select value={selBlock.fontWeight || ''} onChange={(e) => updateSelectedBlock({ fontWeight: e.target.value === '' ? '' : Number(e.target.value) })} className={`w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-xs text-white ${DARK_SELECT_CLASS}`}>
                              <option value="">Auto</option><option value="300">Light</option><option value="400">Reg</option><option value="600">Semi</option><option value="700">Bold</option><option value="800">X-Bold</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">Spacing</label>
                            <input type="number" step={0.01} min={-0.1} max={0.5} value={selBlock.letterSpacingEm ?? ''} onChange={(e) => updateSelectedBlock({ letterSpacingEm: e.target.value === '' ? '' : Number(e.target.value) })} className={`w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-xs text-white ${DARK_INPUT_CLASS}`} placeholder="0" />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">Line h</label>
                            <input type="number" step={0.05} min={0.8} max={2.4} value={selBlock.lineHeight ?? ''} onChange={(e) => updateSelectedBlock({ lineHeight: e.target.value === '' ? '' : Number(e.target.value) })} className={`w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-xs text-white ${DARK_INPUT_CLASS}`} placeholder="1.2" />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">Size</label>
                            <input type="number" min={8} max={220} value={selBlock.fontSize ?? ''} onChange={(e) => updateSelectedBlock({ fontSize: e.target.value === '' ? '' : Number(e.target.value) })} className={`w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-xs text-white ${DARK_INPUT_CLASS}`} placeholder="auto" />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">Color</label>
                            <input type="color" value={selBlock.color || '#ffffff'} onChange={(e) => updateSelectedBlock({ color: e.target.value })} className="w-full h-[30px] rounded-lg border border-white/10 bg-slate-900" />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">Align</label>
                            <div className="flex rounded-lg border border-white/10 overflow-hidden">
                              {['left', 'center', 'right'].map((al) => {
                                const cur = selBlock.align || 'center';
                                return (<button key={al} type="button" onClick={() => updateSelectedBlock({ align: al })} className={`flex-1 py-1.5 text-[11px] transition ${cur === al ? 'bg-brand-500 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`} aria-label={`Align ${al}`}>{al === 'left' ? '⬅' : al === 'center' ? '↔' : '➡'}</button>);
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">Border</label>
                            <input type="number" min={0} max={40} value={selBlock.borderWidth ?? ''} onChange={(e) => updateSelectedBlock({ borderWidth: e.target.value === '' ? '' : Number(e.target.value) })} className={`w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-xs text-white ${DARK_INPUT_CLASS}`} placeholder="0" />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">Border color</label>
                            <input type="color" value={selBlock.borderColor || '#ffffff'} onChange={(e) => updateSelectedBlock({ borderColor: e.target.value })} className="w-full h-[30px] rounded-lg border border-white/10 bg-slate-900" />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">Corners</label>
                            <input type="number" min={0} max={400} value={selBlock.cornerRadius ?? ''} onChange={(e) => updateSelectedBlock({ cornerRadius: e.target.value === '' ? '' : Number(e.target.value) })} className={`w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-xs text-white ${DARK_INPUT_CLASS}`} placeholder="0" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="border-t border-white/5 pt-3">
                      <label className="block text-xs text-slate-400 mb-1">✨ Entrance animation</label>
                      <select value={selBlock.enterAnimation || 'none'} onChange={(e) => updateSelectedBlock({ enterAnimation: e.target.value })} className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}>
                        {ENTER_ANIM_PRESETS.map((a) => (<option key={a.value} value={a.value}>{a.label}</option>))}
                      </select>
                      <label className="block text-xs text-slate-400 mt-2 mb-1">Delay (ms)</label>
                      <input type="number" min={0} max={3000} step={50} value={selBlock.enterDelayMs || 0} onChange={(e) => updateSelectedBlock({ enterDelayMs: Number(e.target.value) || 0 })} className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`} />
                      <label className="block text-xs text-slate-400 mt-3 mb-1">🔁 Loop motion</label>
                      <select value={selBlock.loopAnimation || 'none'} onChange={(e) => updateSelectedBlock({ loopAnimation: e.target.value })} className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}>
                        {LOOP_ANIM_PRESETS.map((a) => (<option key={a.value} value={a.value}>{a.label}</option>))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
