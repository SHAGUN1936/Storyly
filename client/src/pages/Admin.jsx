import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2,
  /* Editor toolbar icons — sourced from lucide-react (the same icon
     pack used elsewhere in the app, so no new dependency). */
  Undo2, Redo2, Plus, Image as ImageIcon, Files, Layers, Sparkles,
  Shapes as ShapesIcon, Music, Settings2, Library, Palette,
  MousePointer2, Save, FileDown, X as XIcon, Wand2,
} from 'lucide-react';
import { toast } from 'sonner';
import Button from '../ui/Button';
import AdminTemplateCard from '../components/AdminTemplateCard';
import { adminAPI, videosAPI } from '../api/api';
import { htmlToStructure } from '../lib/htmlTemplate';
import {
  visualBuilderToHtml,
  validateBuilderState,
  defaultVisualBuilderState,
  normalizeBuilderState,
  updateBuilderTextBySlot,
  updateBuilderBlockPositionBySlot,
  updateBuilderBlockPositionSynced,
  updateBuilderBlockPositionPctSynced,
  bringBlockToFrontBySlot,
  autoAlignBuilderPage,
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
import { APP_INPUT_CLASS, APP_SELECT_CLASS, DARK_INPUT_CLASS, DARK_SELECT_CLASS } from '../lib/uiClasses';
import ConfirmDialog from '../components/ConfirmDialog';
import DeviceSelect from '../components/DeviceSelect';
import SlideshowBuilder from '../components/SlideshowBuilder';
import FabricEditorCanvas from '../components/FabricEditorCanvas';
import LayersPanel from '../components/LayersPanel';
import TextStudioPanel from '../components/TextStudioPanel';
import TypographyPresetsPanel from '../components/TypographyPresetsPanel';
import GameStudioPanel, { GAME_TYPES } from '../components/GameStudioPanel';
import ArrangeMenu from '../components/ArrangeMenu';
import FontBar from '../components/FontBar';
import ButtonStudioPanel from '../components/ButtonStudioPanel';
import { MOTION_BG_PRESETS, normalizeMotionBg } from '../lib/motionBackgrounds';
import { STARTER_TEMPLATES } from '../lib/starterTemplates';
import { StarSticker, DiscoSticker, GiftSticker } from '../ui/CartoonStickers';
import FloatingDecor from '../ui/FloatingDecor';
import useLockBodyScroll from '../hooks/useLockBodyScroll';

/** How many recent templates the studio shows inline before "Show all". */
const RECENT_TEMPLATE_COUNT = 4;

/* One-tap theme presets (Instagram-chat-style). Applying one sets the whole
   page look: gradient background, text/heading/button colors, font, and a
   gentle page animation. `bgMotion` themes use a slowly flowing gradient. */
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

export default function Admin() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    category: 'Memories',
    description: '',
  });
  const [error, setError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [builderState, setBuilderState] = useState(() => defaultVisualBuilderState());
  const [activePage, setActivePage] = useState(0);
  // Theme presets apply per-page by default ('page') so every page can look
  // different; 'all' restyles the whole design at once.
  const [themeScope, setThemeScope] = useState('page');
  // Nothing is selected by default — an element only becomes active when the
  // user actually clicks it (so the contextual top bar stays hidden until then).
  const [selectedBlockIndex, setSelectedBlockIndex] = useState(null);
  /* Layers panel multi-selection. `selectedBlockIndex` stays the PRIMARY
     (drives the property panel + single canvas handles); this carries the
     full multi-select / group for the Layers panel + Fabric ActiveSelection. */
  const [selectedLayerIndices, setSelectedLayerIndices] = useState([]);
  const [dragMode, setDragMode] = useState(true);
  /** Fabric.js control layer (opt-in). When ON, a Fabric canvas overlays the
   *  HTML preview and provides the select/drag/resize/rotate handles; commits
   *  flow through the SAME builderState mutators as the legacy DOM editor, so
   *  the data + render path are unchanged. OFF = legacy editor, zero risk. */
  /* Precision is the edit ↔ preview switch. ON → full editing (select, move,
     resize, rotate, properties). OFF → the canvas behaves like the live page
     (games + buttons work, nothing editable) so you can test it. Defaults ON so
     the editor opens ready to edit. */
  const [fabricMode, setFabricMode] = useState(true);
  const editorArtboardRef = useRef(null);
  /* In-app clipboard for Copy/Paste of a block (survives across pages). */
  const blockClipboard = useRef(null);
  const [hasClipboard, setHasClipboard] = useState(false);
  /** Instagram-style bottom font bar (quick font picker for the selected text). */
  const [fontBarOpen, setFontBarOpen] = useState(false);
  /** Responsive engine: which device the canvas previews ('mobile' |
   *  'tablet' | 'desktop' | null). null = the design's base breakpoint.
   *  Editing is enabled only on the base; other devices are preview-only
   *  in this phase (per-breakpoint editing comes next). */
  const [previewBreakpoint, setPreviewBreakpoint] = useState(null);
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const [bgUploading, setBgUploading] = useState(false);
  /** Create flow: 1 = name/category/desc only, 2 = Instagram-style story designer */
  const [createStep, setCreateStep] = useState(1);
  /** Phase 2a additions: undo/redo + Canva-style pickers */
  const [history, setHistory] = useState({ past: [], future: [] });
  const lastSnapshotRef = useRef(null);
  const skipNextHistoryRef = useRef(false);
  const HISTORY_LIMIT = 80;
  /** Open picker key: 'sticker' | 'shape' | 'music' | null */
  const [picker, setPicker] = useState(null);
  /** Instagram-style icon-rail flyouts — keeps the canvas maximal by
      default. `null` = rail collapsed (icons only); a key = that panel
      is expanded. */
  const [leftPanel, setLeftPanel] = useState(null);  // 'elements'|'media'|'pages'|'layers'|null
  const [rightPanel, setRightPanel] = useState(null); // 'info'|'properties'|null
  const normalizedBuilder = useMemo(() => normalizeBuilderState(builderState), [builderState]);

  /* Responsive engine state derived from the design. The editor designs
     each device (mobile/tablet/desktop) on its own artboard; edits on the
     base device write base fields, others write per-device overrides. */
  const responsiveCfg = normalizedBuilder.responsive;
  const responsiveEnabled = !!responsiveCfg?.enabled;
  const baseBp = responsiveEnabled ? responsiveCfg.base : null;
  const activeBp = responsiveEnabled ? (previewBreakpoint || baseBp) : null;
  const activeArtboard = responsiveEnabled
    ? (responsiveCfg.breakpoints[activeBp] || responsiveCfg.breakpoints[baseBp])
    : null;

  /* Make every template edited in the studio responsive-capable, so the
     device picker always offers Mobile / Tablet / Desktop and each can be
     laid out independently. Legacy templates get upgraded on open (base =
     their current viewport); their layout is unchanged until the admin
     tweaks a device. */
  useEffect(() => {
    if (!formOpen || responsiveEnabled) return;
    setBuilderState((prev) => {
      const n = normalizeBuilderState(prev);
      if (n.responsive?.enabled) return prev;
      return { ...n, responsive: defaultResponsiveConfig(n.viewport || 'desktop') };
    });
  }, [formOpen, responsiveEnabled]);

  /* Selecting an element no longer auto-opens the full properties panel —
     the contextual top bar covers the common controls, and "More" opens the
     panel only when the user actually taps it. */

  const thumbnailPreviewUrl = useMemo(() => {
    if (!thumbnailFile) return null;
    return URL.createObjectURL(thumbnailFile);
  }, [thumbnailFile]);

  const previewStructure = useMemo(
    () => ({
      mode: 'html',
      html: '',
      type: 'slideshow',
      builderState: normalizeBuilderState(builderState),
      deck: {
        pageTimerEnabled: true,
        autoPlay: false,
        pageMode: true,
      },
    }),
    [builderState]
  );

  const builderPreviewError = validateBuilderState(builderState);
  const nameRequiredError = error === 'Please enter a website name.' ? error : '';

  /** Snapshot builderState changes into history (auto). Programmatic undo/redo skips this. */
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
      setHistory((h) => ({
        past: [...h.past.slice(-(HISTORY_LIMIT - 1)), prev],
        future: [],
      }));
    }
    lastSnapshotRef.current = snap;
  }, [builderState]);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (!h.past.length) return h;
      const prevSnap = h.past[h.past.length - 1];
      const newPast = h.past.slice(0, -1);
      const currentSnap = JSON.stringify(builderState);
      skipNextHistoryRef.current = true;
      setBuilderState(JSON.parse(prevSnap));
      return { past: newPast, future: [...h.future, currentSnap].slice(-HISTORY_LIMIT) };
    });
  }, [builderState]);

  const redo = useCallback(() => {
    setHistory((h) => {
      if (!h.future.length) return h;
      const nextSnap = h.future[h.future.length - 1];
      const newFuture = h.future.slice(0, -1);
      const currentSnap = JSON.stringify(builderState);
      skipNextHistoryRef.current = true;
      setBuilderState(JSON.parse(nextSnap));
      return { past: [...h.past, currentSnap].slice(-HISTORY_LIMIT), future: newFuture };
    });
  }, [builderState]);

  /** Keyboard shortcuts (editor open):
   *   • Cmd/Ctrl+Z       — undo
   *   • Cmd/Ctrl+Shift+Z — redo
   *   • Cmd/Ctrl+S       — save (primary toolbar action)
   *   • Cmd/Ctrl+Shift+S — save as draft
   *
   *  `handleSubmit` is declared later in the component body (TDZ), so
   *  we route through a ref that an effect later in the body updates
   *  to the latest handler. The keydown listener reads
   *  `handleSubmitRef.current` at fire time — always the freshest
   *  closure, no stale state. */
  const handleSubmitRef = useRef(null);
  useEffect(() => {
    if (!formOpen) return;
    const onKey = (e) => {
      const inEditable =
        e.target?.matches?.('input, textarea, select, [contenteditable], [contenteditable="true"]');
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === 'z') {
        if (inEditable) return;
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (k === 's' && (editing || createStep === 2)) {
        // ALWAYS preventDefault on Cmd+S so the browser's "save page" doesn't trigger.
        e.preventDefault();
        if (formSubmitting) return;
        const submit = handleSubmitRef.current;
        if (!submit) return;
        if (e.shiftKey && !editing) {
          // Save-as-draft shortcut exists only for new, unsaved templates.
          submit({ preventDefault: () => {}, _asDraft: true });
        } else {
          submit({ preventDefault: () => {} });
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [formOpen, undo, redo, formSubmitting, editing, createStep]);

  const addStickerQuick = (emoji) => {
    const page = normalizedBuilder.pages[activePage];
    if (!page) return;
    const block = { type: 'sticker', emoji: emoji || '✨', size: 88, enterAnimation: 'pop', loopAnimation: 'float' };
    const blocks = [...(page.blocks || []), block];
    setPageAt(activePage, { ...page, blocks });
    setSelectedBlockIndex(blocks.length - 1);
    setPicker(null);
  };

  const addCountdownQuick = () => {
    const page = normalizedBuilder.pages[activePage];
    if (!page) return;
    // Default: 7 days from now in local time, formatted as datetime-local string
    const t = new Date(Date.now() + 7 * 86400 * 1000);
    const pad = (n) => String(n).padStart(2, '0');
    const targetLocal = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}T${pad(t.getHours())}:${pad(t.getMinutes())}`;
    const block = {
      type: 'countdown',
      targetISO: new Date(targetLocal).toISOString(),
      title: 'Counting down to',
      style: 'card',
      accentColor: '#d946ef',
      enterAnimation: 'pop',
    };
    const blocks = [...(page.blocks || []), block];
    setPageAt(activePage, { ...page, blocks });
    setSelectedBlockIndex(blocks.length - 1);
  };

  const addShapeQuick = (kind) => {
    const page = normalizedBuilder.pages[activePage];
    if (!page) return;
    const block = {
      type: 'shape',
      shapeKind: kind || 'rect',
      width: kind === 'pill' ? 220 : 160,
      height: kind === 'pill' ? 64 : 160,
      fillColor: '#d946ef',
      strokeColor: 'transparent',
      strokeWidth: 0,
      opacity: 1,
      enterAnimation: 'zoom',
      loopAnimation: 'float',
    };
    const blocks = [...(page.blocks || []), block];
    setPageAt(activePage, { ...page, blocks });
    setSelectedBlockIndex(blocks.length - 1);
    setPicker(null);
  };

  /** Canvas resize/rotate commits (Admin operates on builderState). */
  const handleResizeCommit = useCallback((slot, w, h) => {
    const m = /^p(\d+)_b(\d+)$/.exec(String(slot || ''));
    if (!m) return;
    const pageIdx = Number(m[1]) - 1;
    const blockIdx = Number(m[2]);
    setBuilderState((prev) => {
      const n = normalizeBuilderState(prev);
      const page = n.pages[pageIdx];
      if (!page) return prev;
      const blocks = [...(page.blocks || [])];
      const b = blocks[blockIdx];
      if (!b) return prev;
      const patch = { ...b, width: w, height: h };
      if (b.type === 'sticker') patch.size = Math.max(20, Math.min(240, Math.round(Math.max(w, h))));
      blocks[blockIdx] = patch;
      const pages = [...n.pages];
      pages[pageIdx] = { ...page, blocks };
      return { ...n, pages };
    });
  }, []);

  const handleRotateCommit = useCallback((slot, deg) => {
    const m = /^p(\d+)_b(\d+)$/.exec(String(slot || ''));
    if (!m) return;
    const pageIdx = Number(m[1]) - 1;
    const blockIdx = Number(m[2]);
    setBuilderState((prev) => {
      const n = normalizeBuilderState(prev);
      const page = n.pages[pageIdx];
      if (!page) return prev;
      const blocks = [...(page.blocks || [])];
      const b = blocks[blockIdx];
      if (!b) return prev;
      blocks[blockIdx] = { ...b, rotateDeg: deg };
      const pages = [...n.pages];
      pages[pageIdx] = { ...page, blocks };
      return { ...n, pages };
    });
  }, []);

  const handleAdminSelectionChange = useCallback((slot) => {
    // Empty-canvas click → clear the selection (hides the contextual bar).
    if (!slot) { setSelectedBlockIndex(null); return; }
    const m = /^p(\d+)_b(\d+)$/.exec(String(slot));
    if (!m) return;
    const pageIdx = Number(m[1]) - 1;
    const blockIdx = Number(m[2]);
    if (pageIdx !== activePage) setActivePage(pageIdx);
    // Selecting an element closes any open tool panel/picker so the view is
    // clean — only that element's contextual bar shows.
    setLeftPanel(null);
    setPicker(null);
    setSelectedBlockIndex(blockIdx);
  }, [activePage]);

  const selectedSlotForCanvas = useMemo(() => {
    if (selectedBlockIndex == null) return null;
    return `p${activePage + 1}_b${selectedBlockIndex}`;
  }, [activePage, selectedBlockIndex]);

  /* Keep the multi-selection in step with the primary selection: a brand-new
     single selection resets the multi, but a multi that already contains the
     primary is preserved (so Layers-panel multi-select isn't clobbered). */
  useEffect(() => {
    setSelectedLayerIndices((prev) => {
      if (selectedBlockIndex == null) return prev.length ? [] : prev;
      if (prev.includes(selectedBlockIndex)) return prev;
      return [selectedBlockIndex];
    });
  }, [selectedBlockIndex]);

  /* Clear the multi-selection when switching pages (indices are per-page). */
  useEffect(() => { setSelectedLayerIndices([]); }, [activePage]);

  /* Turning Precision OFF = preview/test mode: drop any selection so the
     contextual bar + handles vanish and the canvas looks like the live page. */
  useEffect(() => {
    if (!fabricMode) { setSelectedBlockIndex(null); setSelectedLayerIndices([]); }
  }, [fabricMode]);

  const newGroupId = () => `g_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36)}`;

  /* ── Layers panel operations (operate on the ACTIVE page) ──────── */
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
    // Remap selection by object identity so it survives reordering/edits.
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
    const bottomToTop = [...descriptors].reverse();   // descriptors are top→bottom
    const used = new Set();
    const next = [];
    bottomToTop.forEach((d) => (d.indices || []).forEach((i) => {
      if (blocks[i] && !used.has(i)) { used.add(i); next.push(blocks[i]); }
    }));
    blocks.forEach((b, i) => { if (!used.has(i)) next.push(b); }); // safety
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
    const page = normalizedBuilder.pages[activePage];
    const blocks = page.blocks;
    const members = idxs.map((i) => ({ ...blocks[i], groupId: gid }));
    const rest = blocks.filter((_, i) => !idxs.includes(i));
    // Insert the contiguous group where its front-most member was.
    const maxIdx = idxs[idxs.length - 1];
    let at = 0;
    blocks.forEach((_, i) => { if (i <= maxIdx && !idxs.includes(i)) at++; });
    const next = [...rest.slice(0, at), ...members, ...rest.slice(at)];
    writeBlocks(() => next, members);
  };

  const ungroupLayers = (groupId) => {
    if (!groupId) return;
    writeBlocks((blocks) => blocks.map((b) => (b.groupId === groupId ? { ...b, groupId: '' } : b)));
  };

  const setGlobalMusic = (url) => {
    setBuilderState((prev) => {
      const n = normalizeBuilderState(prev);
      return { ...n, theme: { ...n.theme, audioUrl: url || '' } };
    });
    setPicker(null);
  };
  const clearGlobalMusic = () => setGlobalMusic('');

  /* Background helpers — patch the whole-design theme (animated gradient) and
     the CURRENT page's background media / live effect overlay. */
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
  /* Upload a photo for use inside a game (e.g. Memory cards). Returns the URL. */
  const uploadGameImage = async (file) => {
    if (!file) return null;
    try {
      const { url } = await videosAPI.uploadMedia(file);
      return url;
    } catch (err) {
      toast.error(err.message || 'Upload failed');
      return null;
    }
  };

  const uploadPageBg = async (file, kind) => {
    if (!file) return;
    setBgUploading(true);
    try {
      const { url } = await videosAPI.uploadMedia(file);
      // Only one background medium at a time — setting a video clears any photo
      // and vice-versa.
      patchActivePage(kind === 'video' ? { pageVideoUrl: url, pageImageUrl: '' } : { pageImageUrl: url, pageVideoUrl: '' });
      toast.success('Background updated.');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setBgUploading(false);
    }
  };

  /* Build the per-page fields a theme preset writes onto one page: background
     gradient, text/heading/button colors, font, page animation, and an
     animated-gradient motion layer when the preset is a "motion" look. */
  const pageThemeFields = (preset) => ({
    themeId: preset.id,
    pageBackground: `linear-gradient(${preset.gradientAngle}deg, ${preset.gradientFrom}, ${preset.gradientTo})`,
    textColor: preset.textColor,
    headingColor: preset.headingColor,
    buttonBackground: preset.buttonBackground,
    buttonText: preset.buttonText,
    fontFamily: preset.fontFamily,
    pageAnimation: preset.pageAnimation,
    // Motion presets animate the gradient via the per-page motion layer;
    // calm presets clear it so the static gradient shows.
    motionBg: preset.bgMotion
      ? { type: 'gradient', color1: preset.gradientFrom, color2: preset.gradientTo, speed: 2 }
      : { type: 'none', color1: preset.gradientFrom, color2: preset.gradientTo, speed: 2 },
  });

  /* Apply a one-tap theme preset. Scope 'page' (default) restyles ONLY the
     current page so every page can look different; scope 'all' restyles the
     whole design and clears per-page overrides so all pages match. */
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
            ...n.theme,
            backgroundKind: 'gradient',
            bgMotion: !!preset.bgMotion,
            gradientFrom: preset.gradientFrom,
            gradientTo: preset.gradientTo,
            gradientAngle: preset.gradientAngle,
            textColor: preset.textColor,
            headingColor: preset.headingColor,
            buttonBackground: preset.buttonBackground,
            buttonText: preset.buttonText,
            fontFamily: preset.fontFamily,
            pageAnimation: preset.pageAnimation,
          },
          pages: n.pages.map((p) => ({ ...p, ...cleared })),
        };
      });
      return;
    }
    patchActivePage(pageThemeFields(preset));
  };

  useEffect(() => {
    return () => {
      if (thumbnailPreviewUrl) URL.revokeObjectURL(thumbnailPreviewUrl);
    };
  }, [thumbnailPreviewUrl]);

  const loadTemplates = () => {
    adminAPI.getTemplates().then(setTemplates).catch(() => setTemplates([])).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  /** Modal mode: 'starters' = show full gallery, 'blank' = blank-only quick form. */
  const [creationMode, setCreationMode] = useState('starters');
  /** True when the user switched into 'starters' from the blank form via
   *  "pick a starter instead". Lets a dismiss go BACK to blank rather than
   *  closing the whole create flow. */
  const [starterFromBlank, setStarterFromBlank] = useState(false);

  const openCreate = (mode = 'starters') => {
    setEditing(null);
    setForm({ name: '', category: 'Memories', description: '' });
    setThumbnailFile(null);
    setBuilderState(defaultVisualBuilderState());
    setActivePage(0);
    setSelectedBlockIndex(null);
    setPreviewBreakpoint(null);
    setCreateStep(1);
    setPickedStarterId(null);
    setStarterFromBlank(false);
    setCreationMode(mode);
    setFormOpen(true);
    setError('');
  };

  const openCreateBlank = () => openCreate('blank');
  const openCreateWithStarters = () => openCreate('starters');

  /* Fully exit the create flow. The starter picker can open on top of the
     new-website step, so a single Cancel/✕/backdrop must close BOTH — not
     just the topmost overlay — and return to the studio. */
  const closeCreateFlow = () => {
    if (formSubmitting) return;
    setStarterPickerOpen(false);
    setFormOpen(false);
    setCreateStep(1);
    setPickedStarterId(null);
    setStarterFromBlank(false);
  };

  /* Dismiss (✕ / Cancel / backdrop) for the new-website modal. If the
     starter gallery was opened FROM the blank form, dismiss returns to the
     blank form (closes just the starter view); otherwise it exits the whole
     create flow back to the studio. */
  const dismissCreate = () => {
    if (formSubmitting) return;
    if (creationMode === 'starters' && starterFromBlank) {
      setCreationMode('blank');
      setStarterFromBlank(false);
      setPickedStarterId(null);
      return;
    }
    closeCreateFlow();
  };

  const openEdit = (t) => {
    setEditing(t);
    setThumbnailFile(null);
    setCreateStep(2);
    const s = t.structure;
    setForm({
      name: t.name,
      category: t.category,
      description: t.description || '',
    });
    /* The pre-save hook now pins `mode: 'json'` and `builderState` is
       always present on a properly-saved template. Restore it directly
       — the old `mode === 'html'` gate was wiping alignment because new
       JSON-mode templates skipped this branch. */
    if (s && typeof s === 'object' && s.builderState && typeof s.builderState === 'object') {
      setBuilderState(normalizeBuilderState(s.builderState));
    } else {
      setBuilderState(defaultVisualBuilderState());
    }
    setActivePage(0);
    setSelectedBlockIndex(null);
    setPreviewBreakpoint(null);
    setFormOpen(true);
    setError('');
  };

  /* Deep-links from the full library page:
       /admin?edit=<id> — open that template in the editor
       /admin?new=1     — start the New-website flow
     Both consume their param so a refresh / re-render doesn't re-trigger. */
  useEffect(() => {
    if (formOpen) return;
    const newFlag = searchParams.get('new');
    if (newFlag) {
      openCreateBlank();
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
      return;
    }
    const editId = searchParams.get('edit');
    if (!editId || loading) return;
    const t = templates.find((x) => x._id === editId);
    if (t) openEdit(t);
    const next = new URLSearchParams(searchParams);
    next.delete('edit');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, templates, loading]);

  useEffect(() => {
    if (activePage >= normalizedBuilder.pages.length) setActivePage(Math.max(0, normalizedBuilder.pages.length - 1));
  }, [activePage, normalizedBuilder.pages.length]);

  useEffect(() => {
    const blocks = normalizedBuilder.pages[activePage]?.blocks || [];
    // Only clamp a real selection that fell out of range — never auto-select
    // when nothing is selected (null stays null).
    if (selectedBlockIndex != null && selectedBlockIndex >= blocks.length) {
      setSelectedBlockIndex(blocks.length ? blocks.length - 1 : null);
    }
  }, [normalizedBuilder, activePage, selectedBlockIndex]);

  // Switching pages clears the selection — you start each page with nothing
  // active until you click an element on it.
  useEffect(() => {
    setSelectedBlockIndex(null);
  }, [activePage]);

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

  const patchScheduledReveal = (patch) => {
    setBuilderState((prev) => {
      const n = normalizeBuilderState(prev);
      return { ...n, scheduledReveal: { ...n.scheduledReveal, ...patch } };
    });
  };

  const addPageQuick = () => {
    const pages = [...normalizedBuilder.pages];
    const nextPageIndex = pages.length;
    pages.push({
      id: `p_${Date.now()}`,
      pageTitle: `Page ${nextPageIndex + 1}`,
      pageDurationMs: '',
      pageBackground: '',
      blocks: [{ type: 'text', text: 'New page' }],
    });
    setBuilderState({ ...normalizedBuilder, pages });
    setActivePage(nextPageIndex);
    setSelectedBlockIndex(null);
  };

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
    if (kind === 'music') {
      const track = window.prompt('Song name or URL (optional):', '') || 'Music';
      block = { type: 'subheading', text: `🎵 ${track}` };
    }
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
    };
    if (GAME_DEFAULTS[kind]) block = GAME_DEFAULTS[kind];
    // New elements gently float by default (dragging freezes motion live, so
    // it stays easy to grab). Turn it off per element from the More panel.
    block = { loopAnimation: 'float', ...block };
    const blocks = [...(page.blocks || []), block];
    setPageAt(activePage, { ...page, blocks });
    setSelectedBlockIndex(blocks.length - 1);
  };

  const updateSelectedBlock = (patch) => {
    const page = normalizedBuilder.pages[activePage];
    if (!page) return;
    const blocks = [...(page.blocks || [])];
    const current = blocks[selectedBlockIndex];
    if (!current) return;
    blocks[selectedBlockIndex] = { ...current, ...patch };
    setPageAt(activePage, { ...page, blocks });
  };

  const addUploadedMediaBlock = async (file, mediaType) => {
    if (!file) return;
    const page = normalizedBuilder.pages[activePage];
    if (!page) return;
    const tmpId = `up_${Date.now()}_${Math.round(performance.now())}`;
    // Insert a placeholder IMMEDIATELY so the user sees a frosted box + spinner
    // exactly where the media will land while it uploads.
    const placeholder = {
      type: mediaType,
      slotKey: mediaType === 'gif' ? 'gif' : mediaType === 'video' ? 'video' : 'photo',
      label: mediaType === 'gif' ? 'GIF' : mediaType === 'video' ? 'Video' : 'Photo',
      defaultUrl: '',
      mediaFit: 'cover',
      mediaRadius: 12,
      mediaShadow: true,
      loopAnimation: 'float',
      uploading: true,
      _tmpId: tmpId,
    };
    const startBlocks = [...(page.blocks || []), placeholder];
    setPageAt(activePage, { ...page, blocks: startBlocks });
    setSelectedBlockIndex(startBlocks.length - 1);
    setUploadingAsset(true);
    try {
      const { url } = await videosAPI.uploadMedia(file);
      // Swap the placeholder for the real media (found by its temp id, so it
      // survives any reordering that happened during the upload).
      setBuilderState((prev) => {
        const n = normalizeBuilderState(prev);
        const pages = n.pages.map((pg) => ({
          ...pg,
          blocks: (pg.blocks || []).map((b) =>
            b._tmpId === tmpId ? { ...b, defaultUrl: url, uploading: false, _tmpId: undefined } : b,
          ),
        }));
        return { ...n, pages };
      });
    } catch (err) {
      // Drop the failed placeholder.
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

  const removeSelectedBlock = () => {
    const page = normalizedBuilder.pages[activePage];
    if (!page) return;
    const blocks = (page.blocks || []).filter((_, i) => i !== selectedBlockIndex);
    setPageAt(activePage, { ...page, blocks });
    setSelectedBlockIndex(Math.max(0, selectedBlockIndex - 1));
  };

  /** ── Layer ops ───────────────────────────────────────── */
  const toggleBlockField = (pageIndex, idx, field) => {
    const page = normalizedBuilder.pages[pageIndex];
    if (!page) return;
    const blocks = [...(page.blocks || [])];
    const b = blocks[idx];
    if (!b) return;
    blocks[idx] = { ...b, [field]: !b[field] };
    setPageAt(pageIndex, { ...page, blocks });
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
    // Nudge so the pasted block doesn't sit exactly on the original.
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
    if (selectedBlockIndex >= blocks.length) {
      setSelectedBlockIndex(Math.max(0, blocks.length - 1));
    }
  };

  /** ── Starter templates ──────────────────────────────── */
  const [starterPickerOpen, setStarterPickerOpen] = useState(false);
  /** When creating a NEW website, this holds the user's currently-picked starter (null = blank canvas). */
  const [pickedStarterId, setPickedStarterId] = useState(null);

  // Lock background scroll whenever ANY of Admin's modals is open. The
  // create-step-1 new-website picker and the starter-picker both pop over
  // the templates list and shouldn't scroll the page underneath. The
  // delete-confirm dialog handles its own lock via ConfirmDialog.
  // Lock body scroll while ANY of: the starter picker, the new-website
  // step-1 modal, OR the editor modal (step-2 / editing) is open.
  useLockBodyScroll(starterPickerOpen || (formOpen && (editing || createStep === 1 || createStep === 2)));

  const loadStarterTemplate = (id) => {
    const tpl = STARTER_TEMPLATES.find((t) => t.id === id);
    if (!tpl) return;
    setForm((f) => ({
      ...f,
      name: f.name || tpl.name,
      category: tpl.category || f.category,
      description: f.description || tpl.description,
    }));
    skipNextHistoryRef.current = false;
    setBuilderState(normalizeBuilderState(tpl.builderState));
    setActivePage(0);
    setSelectedBlockIndex(null);
    setStarterPickerOpen(false);
  };

  /** Pick (but don't load yet) — stages the choice and overrides name +
      category to match the starter. Description stays user-edited if
      they already typed one. */
  const pickStarter = (id) => {
    setPickedStarterId(id);
    if (!id) {
      // Blank canvas
      return;
    }
    const tpl = STARTER_TEMPLATES.find((t) => t.id === id);
    if (!tpl) return;
    setForm((f) => ({
      ...f,
      /* Always overwrite — picking a starter implies the admin wants
         its identity, including its name + category. Hand-typed input
         from before is replaced so the modal isn't out of sync. */
      name: tpl.name,
      category: tpl.category,
      description: f.description || tpl.description || '',
    }));
  };

  /** Called by the new-website modal "Continue" button. */
  const commitStarterAndContinue = () => {
    if (!form.name.trim()) {
      setError('Please enter a website name.');
      return;
    }
    setError('');
    if (pickedStarterId) {
      const tpl = STARTER_TEMPLATES.find((t) => t.id === pickedStarterId);
      if (tpl) {
        skipNextHistoryRef.current = false;
        setBuilderState(normalizeBuilderState(tpl.builderState));
      }
    } else {
      // Blank canvas — start from default builder state
      skipNextHistoryRef.current = false;
      setBuilderState(defaultVisualBuilderState());
    }
    setActivePage(0);
    setSelectedBlockIndex(null);
    setPickedStarterId(null);
    setCreateStep(2);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formSubmitting) return;
    setError('');

    const vErr = validateBuilderState(builderState);
    if (vErr) {
      toast.error(vErr);
      return;
    }
    const htmlFromBuilder = visualBuilderToHtml(builderState);
    let structurePayload;
    try {
      structurePayload = htmlToStructure(htmlFromBuilder);
      structurePayload.builderState = normalizeBuilderState(builderState);
    } catch (err) {
      toast.error(err.message || 'Could not build website from the visual design');
      return;
    }

    setFormSubmitting(true);
    // `_asDraft` flag is set by the "Save draft" button — forces the
    // template to stay unpublished even when editing an existing one.
    const saveAsDraft = e?._asDraft === true;
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('category', form.category);
    formData.append('description', form.description);
    formData.append('structure', JSON.stringify(structurePayload));
    formData.append('duration', '10');
    if (saveAsDraft) formData.append('published', 'false');
    if (thumbnailFile) {
      formData.append('thumbnail', thumbnailFile);
    }

    try {
      if (editing) {
        await adminAPI.updateTemplate(editing._id, formData);
        toast.success(saveAsDraft ? 'Draft saved.' : 'Website saved.');
      } else {
        await adminAPI.createTemplate(formData);
        toast.success(saveAsDraft ? 'Draft created.' : 'Website created.');
      }
      setFormOpen(false);
      loadTemplates();
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handlePublish = async (id) => {
    setError('');
    try {
      await adminAPI.publishTemplate(id);
      toast.success('Website is live in the gallery.');
      loadTemplates();
    } catch (err) {
      toast.error(err.message || 'Failed');
    }
  };

  /* Take a live template offline. Published templates aren't editable
     (so users who have one open never see it change underneath them) —
     to edit, an admin unlives it first, which sends it back to draft. */
  const handleUnpublish = async (id) => {
    setError('');
    try {
      await adminAPI.unpublishTemplate(id);
      toast.success('Website taken offline.');
      loadTemplates();
    } catch (err) {
      toast.error(err.message || 'Failed');
    }
  };

  /* Keep the keyboard-shortcut ref pointed at the latest handleSubmit.
     Without this the Cmd/Ctrl+S handler couldn't reach handleSubmit
     (TDZ) when the effect ran. Assigning on every render means the
     shortcut always invokes the most recent closure. */
  handleSubmitRef.current = handleSubmit;

  /** Close the editor — save as draft first so the admin's work is
   *  persisted even if they hit X without thinking. Fire-and-forget;
   *  the close happens immediately regardless of save success.  */
  const closeEditorWithDraftSave = useCallback(() => {
    if (formSubmitting) return;
    if (editing) {
      // Existing template: persist edits as a normal update — never as a
      // draft — so its published status is preserved on close.
      try {
        handleSubmit({ preventDefault: () => {}, _silent: true });
      } catch {}
    } else if (createStep === 2) {
      // Brand-new, never-saved template keeps the draft safety net so the
      // admin's work isn't lost on a stray close.
      try {
        handleSubmit({ preventDefault: () => {}, _asDraft: true, _silent: true });
      } catch {}
    }
    setFormOpen(false);
    setCreateStep(1);
    setEditing(null);
  }, [formSubmitting, editing, createStep, handleSubmit]);

  /** Best-effort auto-save when the user closes the tab or hides the
   *  page mid-edit. Uses `fetch({keepalive: true})` so the request
   *  survives tab teardown. Only fires when there's an `editing`
   *  template with an `_id` (we can't draft-save a brand-new template
   *  without uploading the thumbnail through multipart, so the
   *  unload-save handles update-of-existing only). */
  useEffect(() => {
    if (!formOpen || !editing?._id) return;
    const sendDraftBeacon = () => {
      try {
        const fd = new FormData();
        fd.append('name', form.name || editing.name || '');
        fd.append('category', form.category || editing.category || 'Memories');
        fd.append('description', form.description || '');
        // No `published` field: this is a plain edit-persist, NOT a draft —
        // the template keeps whatever status it already had.
        const struct = {
          mode: 'json',
          type: 'slideshow',
          builderState: normalizeBuilderState(builderState),
        };
        fd.append('structure', JSON.stringify(struct));
        fetch(`/api/admin/templates/${editing._id}`, {
          method: 'POST',
          body: fd,
          credentials: 'include',
          keepalive: true,
        });
      } catch {}
    };
    const onBeforeUnload = () => sendDraftBeacon();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') sendDraftBeacon();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [formOpen, editing, form, builderState]);

  const executeDeleteTemplate = async () => {
    if (!deleteConfirmId) return;
    setDeleteLoading(true);
    setError('');
    try {
      await adminAPI.deleteTemplate(deleteConfirmId);
      toast.success('Website removed.');
      setDeleteConfirmId(null);
      loadTemplates();
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong rounded-[2rem] p-8 mb-8 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-grid-soft opacity-30 pointer-events-none" />
        <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.40) 0%, transparent 60%)', filter: 'blur(50px)' }} />
        <div className="pointer-events-none absolute -bottom-20 -left-20 w-72 h-72 rounded-full" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 60%)', filter: 'blur(50px)' }} />

        {/* Cartoon accents in the studio header */}
        <motion.div
          className="hidden md:block absolute top-4 right-1/3 z-10"
          animate={{ y: [0, -10, 0], rotate: [-5, 5, -5] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <GiftSticker size={56} />
        </motion.div>
        <motion.div
          className="hidden lg:block absolute top-8 right-12 z-10"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
        >
          <DiscoSticker size={64} />
        </motion.div>
        <motion.div
          className="hidden md:block absolute bottom-6 right-1/4 z-10"
          animate={{ scale: [1, 1.25, 1], rotate: [0, 18, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <StarSticker size={40} />
        </motion.div>

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <span className="eyebrow"><span>Admin studio</span></span>
            <h1 className="mt-5 font-display text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.05]">
              <span className="text-white">Build the </span>
              <span className="gradient-text animate-gradient">story.</span>
            </h1>
            <p className="mt-4 text-slate-300 leading-7 max-w-xl">
              Manage templates, publish campaigns, and design story-driven pages from one beautiful studio.
            </p>
          </div>
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={openCreateBlank}
            className="btn-glow !py-3.5 !px-6"
          >
            ✨ New website
          </motion.button>
        </div>
      </motion.div>

      <div className={`grid gap-6 items-start ${formOpen && (editing || createStep === 2) ? 'lg:grid-cols-1' : 'lg:grid-cols-[0.95fr_1.1fr]'}`}>
        <section className={`glass-strong rounded-[2rem] p-6 ${formOpen && (editing || createStep === 2) ? 'hidden' : ''}`}>
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-display font-bold text-white">Template library</h2>
              <p className="text-sm text-slate-400">Your most recent websites. See them all in the full library.</p>
            </div>
            <div className="badge-pill badge-brand">
              {templates.length} templates
            </div>
          </div>

          {/* Show-all (top) — always available so the full library is one
              click away, even with just a few templates. */}
          {!loading && templates.length > 0 && (
            <div className="mb-4 flex justify-end">
              <Link to="/admin/templates" className="btn-pill-soft !py-2 !text-xs inline-flex items-center gap-1.5">
                <Library size={14} strokeWidth={2.2} /> Show all {templates.length} templates →
              </Link>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-[1.5rem] bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
              No templates yet. Click “New website” to get started.
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 auto-rows-min gap-4">
                {templates.slice(0, RECENT_TEMPLATE_COUNT).map((t) => (
                  <AdminTemplateCard
                    key={t._id}
                    template={t}
                    isEditing={editing?._id === t._id}
                    onEdit={openEdit}
                    onPublish={handlePublish}
                    onUnpublish={handleUnpublish}
                    onDelete={(tpl) => setDeleteConfirmId(tpl._id)}
                  />
                ))}
              </div>

              {/* Show-all (bottom) */}
              <div className="mt-5 flex justify-center">
                <Link to="/admin/templates" className="btn-glow !py-2.5 !text-sm inline-flex items-center gap-2">
                  <Library size={15} strokeWidth={2.2} /> Show all {templates.length} templates
                </Link>
              </div>
            </>
          )}
        </section>

        {/* Editor — when actively editing/creating it renders as a
            full-screen modal portaled to <body>. Portal escapes the
            framer-motion `motion.main` stacking context that otherwise
            traps `position: fixed` children inside it (which left the
            navbar visible above the modal). When idle, it renders inline
            inside the grid as the right-hand panel. `overflow-anchor:
            none` stops scroll re-anchoring on block selects / focus. */}
        {(() => {
          const editorActive = formOpen && (editing || createStep === 2);
          const editorJsx = (
            <>
              {editorActive && (
                <div
                  className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-md"
                  data-lenis-prevent
                  aria-hidden="true"
                />
              )}
              <section
                className={
                  editorActive
                    ? 'admin-editor-modal fixed inset-3 sm:inset-6 z-[100] glass-strong rounded-[2rem] px-4 py-3 overflow-hidden flex flex-col'
                    : 'glass-strong rounded-[2rem] p-6 min-h-[660px]'
                }
                style={{ overflowAnchor: 'none' }}
              >
          <div className={`shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between ${editorActive ? 'gap-2 mb-2' : 'gap-4 mb-6'}`}>
            <div>
              <h2 className={`font-display font-bold text-white ${editorActive ? 'text-base leading-tight' : 'text-xl'}`}>Editor panel</h2>
              {!editorActive && (
                <p className="text-sm text-slate-400">Build or edit the selected website in the story-driven editor.</p>
              )}
            </div>
            {/* "Start new website" is only meaningful from the empty
                state — once the editor is actively in use, hide it so
                the admin can't accidentally restart the form. */}
            {!(formOpen && (editing || createStep === 2)) && (
              <button
                type="button"
                onClick={openCreateBlank}
                className="btn-pill-soft"
              >
                ✨ Start new website
              </button>
            )}
            {/* Close button — lives at the popup-header level, opposite
                the "Editor panel" title text. Persists work before closing:
                a normal save when editing an existing template, or a draft
                save for a brand-new, never-saved one. */}
            {(formOpen && (editing || createStep === 2)) && (
              <button
                type="button"
                onClick={closeEditorWithDraftSave}
                disabled={formSubmitting}
                className="self-start sm:self-auto inline-flex items-center gap-2 rounded-full bg-white/8 hover:bg-red-500/25 border border-white/15 hover:border-red-400/60 px-3.5 py-2 text-xs font-bold text-slate-200 hover:text-white shadow-lg transition disabled:opacity-50"
                data-tooltip={editing ? 'Close editor (saves your changes)' : 'Close editor (saves as draft automatically)'}
                data-tooltip-pos="bottom"
                data-tooltip-align="end"
                aria-label="Close editor"
              >
                <XIcon size={14} strokeWidth={2.4} />
                <span>Close</span>
              </button>
            )}
          </div>

          {!formOpen ? (
            <div className="relative flex h-full min-h-[420px] flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-white/15 p-8 text-center overflow-hidden"
              style={{ background: 'radial-gradient(circle at 30% 20%, rgba(139,92,246,0.15), transparent 60%), radial-gradient(circle at 80% 80%, rgba(124,58,237,0.12), transparent 60%), rgba(11,15,25,0.45)' }}
            >
              <div className="text-6xl mb-4 drop-shadow-[0_8px_20px_rgba(139,92,246,0.6)]">🎨</div>
              <p className="font-display text-2xl font-extrabold text-white">Ready to build something?</p>
              <p className="mt-2 text-sm text-slate-300 max-w-md leading-7">
                Pick a template from the left or start a fresh website. You can also load one of our ready-made starters.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <button
                  type="button"
                  onClick={openCreateBlank}
                  className="btn-glow !py-2.5 !text-sm"
                >
                  ✨ Create new website
                </button>
                <button
                  type="button"
                  onClick={openCreateWithStarters}
                  className="btn-ghost !py-2.5 !text-sm"
                >
                  🪄 Use a starter
                </button>
              </div>
            </div>
          ) : (
            <div className={`space-y-6 ${editorActive ? 'flex-1 min-h-0 flex flex-col' : ''}`}>

              {!editing && createStep === 1 && (
                <div className="space-y-6">
                  <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950/95 via-slate-900/80 to-brand-950/90 p-6 shadow-[0_24px_80px_-45px_rgba(15,23,42,0.35)] text-white">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-brand-300/70">Mood board</p>
                        <h3 className="text-2xl font-semibold">Create a vibe-forward template</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStarterPickerOpen(true)}
                        className="rounded-full bg-gradient-to-r from-brand-500 to-pink-500 px-4 py-2 text-xs font-bold text-white shadow-lg hover:opacity-95 transition active:scale-95"
                      >
                        ✨ Use a starter
                      </button>
                    </div>
                    <p className="mt-4 max-w-xl text-slate-300">
                      Give your website a catchy name, choose a mood, and add a visual thumbnail — or skip ahead and start from a pre-made template.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="tpl-modal-label block text-xs font-bold uppercase tracking-[0.16em] mb-2">Website name</label>
                      <input
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        className={APP_INPUT_CLASS}
                        placeholder="Your campaign title"
                        required
                      />
                      {nameRequiredError && (
                        <p className="form-error-pill mt-2">
                          <span aria-hidden="true">⚠</span>
                          {nameRequiredError}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="tpl-modal-label block text-xs font-bold uppercase tracking-[0.16em] mb-2">Category</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                        className={APP_SELECT_CLASS}
                      >
                        {['Love', 'Friendship', 'Birthday', 'Memories', 'Wedding'].map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="tpl-modal-label block text-xs font-bold uppercase tracking-[0.16em] mb-2">Description</label>
                      <input
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        className={APP_INPUT_CLASS}
                        placeholder="What makes this page special?"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="tpl-modal-label block text-xs font-bold uppercase tracking-[0.16em] mb-2">Thumbnail</label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-brand-500/10 file:text-brand-700"
                      />
                      {thumbnailPreviewUrl && (
                        <img
                          src={thumbnailPreviewUrl}
                          alt=""
                          className="mt-3 h-24 w-32 rounded-3xl object-cover border border-slate-200"
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {(editing || createStep === 2) && (
                <div data-lenis-prevent className="tpl-editor-shell relative isolate flex flex-1 min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
                  <div className="pointer-events-none absolute inset-0" style={{ zIndex: -1 }}>
                    <FloatingDecor density="subtle" opacity={0.08} size={36} />
                  </div>
                  {/* ── Top Toolbar — three clusters ─────────────────
                       LEFT: identity (name + page indicator) + history
                       CENTER: tool buttons (panels + pickers)
                       RIGHT: viewport + drag + delete + Cancel/Save draft/Save
                       Save is the primary action, gradient-styled, with
                       a `⌘S` chip and a Ctrl/Cmd+S shortcut. */}
                  <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/95 px-4 py-3 gap-3">
                    {/* ── Left: identity + history ──────────────────── */}
                    <div className="flex items-center gap-3 min-w-0 shrink-0">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate max-w-[16ch]">{form.name || 'Untitled'}</p>
                        <p className="text-[11px] text-slate-400 leading-tight">
                          Page {activePage + 1} of {normalizedBuilder.pages.length}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5 border-l border-white/10 pl-3 ml-1">
                        <button
                          type="button"
                          data-tooltip="Undo (Ctrl+Z)"
                          data-tooltip-pos="bottom"
                          aria-label="Undo"
                          disabled={!history.past.length}
                          onClick={undo}
                          className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-30 flex items-center justify-center text-slate-200 transition"
                        ><Undo2 size={16} strokeWidth={2.2} /></button>
                        <button
                          type="button"
                          data-tooltip="Redo (Ctrl+Shift+Z)"
                          data-tooltip-pos="bottom"
                          aria-label="Redo"
                          disabled={!history.future.length}
                          onClick={redo}
                          className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-30 flex items-center justify-center text-slate-200 transition"
                        ><Redo2 size={16} strokeWidth={2.2} /></button>
                      </div>
                    </div>

                    {/* ── Right: device · drag · delete · save group ── */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Device dropdown — pick which device you're designing.
                          Each device keeps a SEPARATE layout (per-device
                          overrides). */}
                      <DeviceSelect
                        value={responsiveEnabled ? activeBp : (normalizedBuilder.viewport || 'desktop')}
                        options={['mobile', 'tablet', 'desktop']}
                        size="sm"
                        align="left"
                        onChange={(v) => {
                          if (responsiveEnabled) setPreviewBreakpoint(v);
                          else setBuilderState((prev) => ({ ...prev, viewport: v }));
                        }}
                      />
                      {/* Precision = the edit ↔ preview switch.
                          ON  → select / move / resize / rotate / edit properties.
                          OFF → the canvas behaves like the LIVE page (games &
                                buttons work, nothing editable) so you can test it. */}
                      <button
                        type="button"
                        onClick={() => setFabricMode((v) => !v)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition ${
                          fabricMode ? 'bg-brand-500 text-white' : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                        }`}
                        data-tooltip={fabricMode
                          ? 'Editing ON — select, move, resize, rotate & edit properties. Click to PREVIEW (play games / tap buttons like a real visitor).'
                          : 'Preview / Test mode — the page behaves like the live site. Click to turn Editing back ON.'}
                        data-tooltip-pos="bottom"
                        aria-pressed={fabricMode}
                      >{fabricMode
                        ? <><MousePointer2 size={14} strokeWidth={2.2} /> Precision</>
                        : <><span aria-hidden>👁</span> Preview</>}</button>

                      <div className="w-px h-6 bg-white/10 mx-1" />

                      {/* Save draft — ONLY for a brand-new, never-saved
                          template. Once a template exists it's edited and
                          re-saved in place (no draft step), so editing never
                          flips its published status. */}
                      {!editing && (
                        <button
                          type="button"
                          disabled={formSubmitting}
                          onClick={() => handleSubmit({ preventDefault: () => {}, _asDraft: true })}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 border border-white/15 hover:bg-white/10 disabled:opacity-60 transition"
                          data-tooltip="Save as draft (Ctrl/Cmd+Shift+S)"
                          data-tooltip-pos="bottom"
                        ><FileDown size={14} strokeWidth={2.2} /> Save draft</button>
                      )}
                      {/* Save — primary action. Cmd/Ctrl+S also fires this. */}
                      <button
                        type="button"
                        disabled={formSubmitting}
                        onClick={() => handleSubmit({ preventDefault: () => {} })}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-500 to-pink-500 px-3.5 py-2 text-xs font-bold text-white shadow-lg hover:opacity-95 active:scale-95 disabled:opacity-60 transition"
                        data-tooltip="Save (Ctrl/Cmd+S)"
                        data-tooltip-pos="bottom"
                        data-tooltip-align="end"
                      >
                        <Save size={14} strokeWidth={2.4} />
                        {formSubmitting ? 'Saving…' : 'Save'}
                        <kbd className="hidden lg:inline-flex items-center rounded bg-white/20 px-1 py-px text-[9px] font-bold tracking-wider ml-1">⌘S</kbd>
                      </button>
                    </div>
                  </div>

                  {/* ── Tools row — its OWN full-width strip so every tool stays
                       visible (it never gets squeezed out by the save group);
                       scrolls horizontally on narrow screens with a clear,
                       always-visible scrollbar. */}
                  <div className="tpl-tools-row shrink-0 flex items-center gap-0.5 border-b border-white/10 bg-slate-950/95 px-3 py-2 overflow-x-auto overflow-y-hidden">
                    {[
                      { key: 'elements', label: 'Add',     Icon: Plus },
                      { key: 'media',    label: 'Media',   Icon: ImageIcon },
                      { key: 'themes',   label: 'Themes',  Icon: Palette },
                      { key: 'pages',    label: 'Pages',   Icon: Files },
                      { key: 'layers',   label: 'Layers',  Icon: Layers },
                    ].map(({ key, label, Icon }) => {
                      const open = leftPanel === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setLeftPanel((cur) => (cur === key ? null : key))}
                          className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition ${
                            open ? 'bg-brand-500 text-slate-950' : 'bg-white/5 hover:bg-white/15 text-slate-200'
                          }`}
                        ><Icon size={14} strokeWidth={2.2} /> {label}</button>
                      );
                    })}
                    <div className="shrink-0 w-px h-6 bg-white/10 mx-1" />
                    {/* Arrange — screen-relative layouts (center/spread/stack/grid)
                        + quick aligns. Positions are %, so they fit every screen.
                        Undoable. */}
                    <ArrangeMenu
                      onArrange={(mode) => {
                        setBuilderState((prev) => arrangeBuilderPage(prev, activePage, mode));
                        setSelectedBlockIndex(null);
                        setSelectedLayerIndices([]);
                        toast.success('Arranged to fit the screen ✨', { position: 'bottom-center', duration: 1000 });
                      }}
                    />
                    <div className="shrink-0 w-px h-6 bg-white/10 mx-1" />
                    <button
                      type="button"
                      onClick={() => setPicker(picker === 'sticker' ? null : 'sticker')}
                      className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition ${picker === 'sticker' ? 'bg-brand-500 text-slate-950' : 'bg-white/5 hover:bg-white/15 text-slate-200'}`}
                    ><Sparkles size={14} strokeWidth={2.2} /> Stickers</button>
                    <button
                      type="button"
                      onClick={() => setPicker(picker === 'shape' ? null : 'shape')}
                      className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition ${picker === 'shape' ? 'bg-brand-500 text-slate-950' : 'bg-white/5 hover:bg-white/15 text-slate-200'}`}
                    ><ShapesIcon size={14} strokeWidth={2.2} /> Shapes</button>
                    <button
                      type="button"
                      onClick={() => setPicker(picker === 'music' ? null : 'music')}
                      className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition ${picker === 'music' ? 'bg-brand-500 text-slate-950' : 'bg-white/5 hover:bg-white/15 text-slate-200'}`}
                      data-tooltip={normalizedBuilder.theme?.audioUrl ? 'Background music: ON' : 'Background music: off'}
                      data-tooltip-pos="bottom"
                    ><Music size={14} strokeWidth={2.2} /> {normalizedBuilder.theme?.audioUrl ? 'Music ✓' : 'Music'}</button>
                    <button
                      type="button"
                      onClick={() => setRightPanel((cur) => (cur ? null : 'properties'))}
                      className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition ${rightPanel ? 'bg-brand-500 text-slate-950' : 'bg-white/5 hover:bg-white/15 text-slate-200'}`}
                    ><Settings2 size={14} strokeWidth={2.2} /> Props</button>
                  </div>

                  {/* ── Pickers — Sticker / Shape / Music ────────────
                       Wrapped in an absolute-positioned container so
                       opening any picker overlays the canvas without
                       resizing it. Width is constrained + the panel
                       gets card styling (rounded, shadow) so it reads
                       as a floating popover, not a wedge between
                       toolbar and canvas. */}
                  <div className="absolute left-3 right-3 top-[116px] z-30 pointer-events-none">
                  <AnimatePresence>
                    {picker === 'sticker' && (
                      <motion.div
                        key="picker-sticker"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="pointer-events-auto rounded-2xl border border-white/15 bg-slate-900/95 backdrop-blur-xl px-4 py-3 shadow-2xl max-w-2xl"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs uppercase tracking-widest text-slate-400">Pick a sticker</p>
                          <button type="button" onClick={() => setPicker(null)} className="text-xs text-slate-400 hover:text-white">✕</button>
                        </div>
                        <div className="grid grid-cols-9 sm:grid-cols-12 gap-1.5 max-h-44 overflow-y-auto">
                          {STICKER_PRESETS.map((e) => (
                            <button
                              key={e}
                              type="button"
                              onClick={() => addStickerQuick(e)}
                              className="rounded-lg bg-white/5 hover:bg-brand-500/30 text-2xl py-1.5 transition active:scale-90"
                              title={e}
                            >{e}</button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                    {picker === 'shape' && (
                      <motion.div
                        key="picker-shape"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="pointer-events-auto rounded-2xl border border-white/15 bg-slate-900/95 backdrop-blur-xl px-4 py-3 shadow-2xl max-w-2xl"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs uppercase tracking-widest text-slate-400">Add a shape</p>
                          <button type="button" onClick={() => setPicker(null)} className="text-xs text-slate-400 hover:text-white">✕</button>
                        </div>
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                          {SHAPE_PRESETS.map((s) => (
                            <button
                              key={s.value}
                              type="button"
                              onClick={() => addShapeQuick(s.value)}
                              className="rounded-xl border border-white/10 bg-white/5 hover:bg-brand-500/20 hover:border-brand-400 px-2 py-3 text-[11px] font-semibold text-slate-200 transition active:scale-95"
                            >
                              <ShapePreview kind={s.value} />
                              <span className="block mt-1.5">{s.label}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                    {picker === 'music' && (
                      <motion.div
                        key="picker-music"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="pointer-events-auto rounded-2xl border border-white/15 bg-slate-900/95 backdrop-blur-xl px-4 py-3 shadow-2xl max-w-2xl"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs uppercase tracking-widest text-slate-400">Background music (whole site)</p>
                          <div className="flex items-center gap-2">
                            {normalizedBuilder.theme?.audioUrl && (
                              <button type="button" onClick={clearGlobalMusic} className="text-xs text-rose-300 hover:text-rose-200">Remove</button>
                            )}
                            <button type="button" onClick={() => setPicker(null)} className="text-xs text-slate-400 hover:text-white">✕</button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {MUSIC_LIBRARY.map((t) => {
                            const active = normalizedBuilder.theme?.audioUrl === t.url;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => setGlobalMusic(t.url)}
                                className={`rounded-xl border px-3 py-2.5 text-left transition ${
                                  active
                                    ? 'border-brand-400 bg-brand-500/20 text-white'
                                    : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-200'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold">🎵 {t.name}</span>
                                  <span className="text-[10px] uppercase tracking-widest text-slate-400">{t.mood}</span>
                                </div>
                                <audio src={t.url} controls preload="none" className="mt-1.5 w-full h-8" />
                              </button>
                            );
                          })}
                        </div>
                        <div className="mt-3">
                          <label className="block text-xs text-slate-400 mb-1">Or paste an https URL</label>
                          <input
                            type="url"
                            placeholder="https://…/song.mp3"
                            defaultValue={normalizedBuilder.theme?.audioUrl || ''}
                            onBlur={(e) => setGlobalMusic(e.target.value.trim())}
                            className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  </div>

                  {/* Main Content Area — canvas always takes the full
                      editor width. All tool panels are floating overlays
                      anchored to the toolbar buttons above, so the canvas
                      preview never shrinks for sidebars. */}
                  <div className="relative flex flex-1 overflow-hidden gap-0 p-0">
                    {/* ── Contextual top control bar (Instagram-story style) ──
                         Floats at the top-center of the canvas the moment an
                         element is selected, surfacing THAT element's key
                         controls inline — font, color, align, effect, motion —
                         exactly like tapping text in a story. "More" opens the
                         full properties panel for the long-tail options. All
                         controls reuse updateSelectedBlock so they stay in sync
                         with the right panel. */}
                    {(() => {
                      const blocks = normalizedBuilder.pages[activePage]?.blocks || [];
                      const sb = blocks[selectedBlockIndex];
                      if (!sb) return null;
                      const isText = sb.type === 'text' || sb.type === 'heading' || sb.type === 'button' || 'text' in sb;
                      const isMedia = sb.type === 'image' || sb.type === 'gif' || sb.type === 'video';
                      const colorKey = sb.type === 'shape' ? 'fillColor' : 'color';
                      const colorVal = (sb.type === 'shape' ? sb.fillColor : sb.color) || '#ffffff';
                      const TYPE_ICON = { text: '📝', heading: '📌', button: '🔘', gallery: '🖼️', gif: '🎬', image: '🖼️', video: '🎞️', sticker: '✨', shape: '⬛', countdown: '⏱️' };
                      return (
                        <div className="pointer-events-none absolute inset-x-0 top-2 z-30 flex justify-center px-3">
                          <div className="ig-context-bar pointer-events-auto flex items-center gap-1.5 max-w-[calc(100%-1.5rem)] overflow-x-auto hide-scrollbar rounded-2xl border border-white/15 bg-slate-900/95 backdrop-blur-xl px-2 py-1.5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85)] animate-fade-in">
                            <span className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1.5 text-[11px] font-bold text-slate-200">
                              <span>{TYPE_ICON[sb.type] || '⬚'}</span>
                              <span className="capitalize hidden sm:inline">{sb.type}</span>
                            </span>
                            <span className="shrink-0 w-px h-6 bg-white/10" />

                            {isText && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setFontBarOpen((v) => !v)}
                                  data-tooltip="Fonts" data-tooltip-pos="bottom"
                                  aria-pressed={fontBarOpen}
                                  style={{ fontFamily: sb.fontFamily || undefined }}
                                  className={`shrink-0 rounded-lg border px-3 py-1.5 text-sm leading-none transition ${fontBarOpen ? 'bg-brand-500 text-white border-brand-400' : 'bg-slate-900 text-white border-white/10 hover:bg-slate-800'}`}
                                >Aa</button>
                                <label className="shrink-0 relative w-8 h-8 rounded-lg border border-white/10 overflow-hidden cursor-pointer" data-tooltip="Text / effect color" data-tooltip-pos="bottom">
                                  <input
                                    type="color"
                                    value={colorVal}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      // Drive BOTH the plain text color AND the effect's
                                      // primary color (gradient/neon/glow/outline read
                                      // textGradientFrom) so this picker works whatever
                                      // effect is on. The 2nd gradient color is in the panel.
                                      if (sb.type === 'shape') updateSelectedBlock({ fillColor: v });
                                      else updateSelectedBlock({ color: v, textGradientFrom: v });
                                    }}
                                    className="absolute inset-0 w-[150%] h-[150%] -m-1 cursor-pointer"
                                  />
                                </label>
                                <div className="shrink-0 flex rounded-lg border border-white/10 overflow-hidden">
                                  {['left', 'center', 'right'].map((al) => {
                                    const cur = sb.align || 'center';
                                    return (
                                      <button
                                        key={al}
                                        type="button"
                                        onClick={() => updateSelectedBlock({ align: al })}
                                        className={`px-2 py-1.5 text-[11px] transition ${cur === al ? 'bg-brand-500 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
                                        aria-label={`Align ${al}`}
                                      >{al === 'left' ? '⬅' : al === 'center' ? '↔' : '➡'}</button>
                                    );
                                  })}
                                </div>
                                <select
                                  value={sb.textEffect || 'none'}
                                  onChange={(e) => updateSelectedBlock({ textEffect: e.target.value })}
                                  data-tooltip="Text effect" data-tooltip-pos="bottom"
                                  className={`shrink-0 w-24 rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-[11px] text-white ${DARK_SELECT_CLASS}`}
                                >
                                  {TEXT_EFFECT_PRESETS.map((p) => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                  ))}
                                </select>
                                <span className="shrink-0 w-px h-6 bg-white/10" />
                              </>
                            )}

                            {/* Frame shape + outline — quick controls for media */}
                            {isMedia && (
                              <>
                                <select
                                  value={sb.mediaShape || 'none'}
                                  onChange={(e) => updateSelectedBlock({ mediaShape: e.target.value })}
                                  data-tooltip="Frame shape" data-tooltip-pos="bottom"
                                  className={`shrink-0 w-24 rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-[11px] text-white ${DARK_SELECT_CLASS}`}
                                >
                                  {MEDIA_SHAPE_PRESETS.map((sh) => (
                                    <option key={sh.value} value={sh.value}>{sh.value === 'none' ? '🖼️ Frame' : sh.label}</option>
                                  ))}
                                </select>
                                <div
                                  className="shrink-0 flex items-center gap-1 rounded-lg bg-slate-900 border border-white/10 px-1.5 py-1"
                                  data-tooltip="Frame outline" data-tooltip-pos="bottom"
                                >
                                  <input
                                    type="range" min={0} max={20} step={1}
                                    value={Number(sb.borderWidth) || 0}
                                    onChange={(e) => updateSelectedBlock({ borderWidth: Number(e.target.value) })}
                                    className="w-14 accent-brand-500 cursor-pointer"
                                    aria-label="Outline width"
                                  />
                                  <label className="relative w-6 h-6 rounded-md border border-white/10 overflow-hidden cursor-pointer" aria-label="Outline color">
                                    <input
                                      type="color"
                                      value={sb.borderColor || '#ffffff'}
                                      onChange={(e) => updateSelectedBlock({ borderColor: e.target.value })}
                                      className="absolute inset-0 w-[150%] h-[150%] -m-1 cursor-pointer"
                                    />
                                  </label>
                                </div>
                                <span className="shrink-0 w-px h-6 bg-white/10" />
                              </>
                            )}

                            {/* Outline — for shapes (stroke) */}
                            {sb.type === 'shape' && (
                              <>
                                <div
                                  className="shrink-0 flex items-center gap-1 rounded-lg bg-slate-900 border border-white/10 px-1.5 py-1"
                                  data-tooltip="Outline" data-tooltip-pos="bottom"
                                >
                                  <input
                                    type="range" min={0} max={20} step={1}
                                    value={Number(sb.strokeWidth) || 0}
                                    onChange={(e) => updateSelectedBlock({ strokeWidth: Number(e.target.value) })}
                                    className="w-14 accent-brand-500 cursor-pointer"
                                    aria-label="Outline width"
                                  />
                                  <label className="relative w-6 h-6 rounded-md border border-white/10 overflow-hidden cursor-pointer" aria-label="Outline color">
                                    <input
                                      type="color"
                                      value={sb.strokeColor && sb.strokeColor !== 'transparent' ? sb.strokeColor : '#ffffff'}
                                      onChange={(e) => updateSelectedBlock({ strokeColor: e.target.value })}
                                      className="absolute inset-0 w-[150%] h-[150%] -m-1 cursor-pointer"
                                    />
                                  </label>
                                </div>
                                <span className="shrink-0 w-px h-6 bg-white/10" />
                              </>
                            )}

                            {/* Loop motion — Float is the default; no "none"
                                option here (turn motion off in More if needed). */}
                            <select
                              value={!sb.loopAnimation || sb.loopAnimation === 'none' ? 'float' : sb.loopAnimation}
                              onChange={(e) => updateSelectedBlock({ loopAnimation: e.target.value })}
                              data-tooltip="Loop motion" data-tooltip-pos="bottom"
                              className={`shrink-0 w-24 rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-[11px] text-white ${DARK_SELECT_CLASS}`}
                            >
                              {LOOP_ANIM_PRESETS.filter((a) => a.value !== 'none').map((a) => (
                                <option key={a.value} value={a.value}>{a.label}</option>
                              ))}
                            </select>

                            {/* Opacity — available on every element */}
                            <div
                              className="shrink-0 flex items-center gap-1.5 rounded-lg bg-slate-900 border border-white/10 px-2 py-1.5"
                              data-tooltip="Opacity" data-tooltip-pos="bottom"
                            >
                              <span className="text-[11px] text-slate-400">◐</span>
                              <input
                                type="range" min={10} max={100} step={1}
                                value={Math.round((sb.opacity ?? 1) * 100)}
                                onChange={(e) => updateSelectedBlock({ opacity: Number(e.target.value) / 100 })}
                                className="w-16 accent-brand-500 cursor-pointer"
                                aria-label="Opacity"
                              />
                              <span className="text-[10px] tabular-nums text-slate-400 w-7 text-right">{Math.round((sb.opacity ?? 1) * 100)}%</span>
                            </div>

                            <span className="shrink-0 w-px h-6 bg-white/10" />
                            <button
                              type="button"
                              onClick={() => setRightPanel((cur) => (cur ? null : 'properties'))}
                              className={`shrink-0 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${rightPanel ? 'bg-brand-500 text-slate-950' : 'bg-white/5 hover:bg-white/15 text-slate-200'}`}
                              data-tooltip="All properties" data-tooltip-pos="bottom"
                            ><Settings2 size={13} strokeWidth={2.3} /> More</button>
                            <button
                              type="button"
                              onClick={removeSelectedBlock}
                              className="shrink-0 w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/25 flex items-center justify-center text-red-300 transition"
                              data-tooltip="Delete element" data-tooltip-pos="bottom"
                              aria-label="Delete element"
                            ><Trash2 size={14} strokeWidth={2.2} /></button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Instagram-style bottom font bar — quick font picker for
                        the selected text element (chips render in their own
                        font, tap to apply live). Closes if the selection is
                        cleared or a non-text block is selected. */}
                    <FontBar
                      open={fontBarOpen && (() => {
                        const b = normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex];
                        // Fonts apply to text blocks AND buttons (button label font).
                        return !!b && ('text' in b || ['button', 'buttonSlot'].includes(b.type));
                      })()}
                      value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.fontFamily || ''}
                      onPick={(ff) => updateSelectedBlock({ fontFamily: ff })}
                      onClose={() => setFontBarOpen(false)}
                    />

                    {/* Click-away backdrop — tapping anywhere outside an open
                        panel/picker closes them all. */}
                    {(leftPanel || picker) && (
                      <div
                        className="absolute inset-0 z-20"
                        onClick={() => { setLeftPanel(null); setPicker(null); }}
                        aria-hidden
                      />
                    )}

                    {/* ── Left tool panel (floating overlay) ────────── */}
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
                          <button
                            type="button"
                            onClick={() => setLeftPanel(null)}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
                            aria-label="Close panel"
                          >
                            ✕
                          </button>
                        </div>
                      {/* Templates/Elements Section */}
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
                            <button
                              key={kind}
                              type="button"
                              onClick={() => addBlockQuick(kind)}
                              className="rounded-lg border border-white/10 bg-slate-900 px-2 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:border-brand-400 transition"
                            >
                              {label}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setPicker('sticker')}
                            className="rounded-lg border border-white/10 bg-slate-900 px-2 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:border-brand-400 transition"
                          >
                            😎 Stickers
                          </button>
                          <button
                            type="button"
                            onClick={() => setPicker('shape')}
                            className="rounded-lg border border-white/10 bg-slate-900 px-2 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:border-brand-400 transition"
                          >
                            ⬢ Shapes
                          </button>
                          <button
                            type="button"
                            onClick={addCountdownQuick}
                            className="col-span-2 rounded-lg border border-white/10 bg-slate-900 px-2 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:border-brand-400 transition"
                          >
                            ⏱ Countdown
                          </button>
                        </div>

                        {/* ── Interactive & games ── */}
                        <p className="mt-4 mb-2 text-[10px] font-bold uppercase tracking-widest text-brand-200">🎮 Interactive & games</p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: '💘 Yes / No', kind: 'trickyn' },
                            { label: '🎁 Tap reveal', kind: 'reveal' },
                            { label: '❓ Quiz', kind: 'quiz' },
                            { label: '📊 Poll', kind: 'poll' },
                            { label: '🧠 Memory', kind: 'memory' },
                            { label: '🔍 Spot it', kind: 'spot' },
                            { label: '🎡 Spin wheel', kind: 'wheel' },
                            { label: '🎀 Gift box', kind: 'giftbox' },
                            { label: '🧩 Puzzle', kind: 'puzzle' },
                            { label: '🎰 Slot machine', kind: 'slot' },
                            { label: '🔄 Flip card', kind: 'flip' },
                            { label: '✊ Rock Paper', kind: 'rps' },
                          ].map(({ label, kind }) => (
                            <button
                              key={kind}
                              type="button"
                              onClick={() => addBlockQuick(kind)}
                              className="rounded-lg border border-white/10 bg-slate-900 px-2 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:border-brand-400 transition"
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                      )}

                      {/* Media Upload */}
                      {leftPanel === 'media' && (
                      <div>
                        <div className="space-y-2">
                          <label className="flex cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-slate-900 px-2 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:border-brand-400 transition">
                            📸 Photo
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                addUploadedMediaBlock(f, 'image');
                                e.target.value = '';
                              }}
                            />
                          </label>
                          <label className="flex cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-slate-900 px-2 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:border-brand-400 transition">
                            🎥 Video
                            <input
                              type="file"
                              accept="video/mp4,video/webm,video/quicktime"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                addUploadedMediaBlock(f, 'video');
                                e.target.value = '';
                              }}
                            />
                          </label>
                        </div>
                      </div>
                      )}

                      {/* Themes — one-tap looks (gradient bg + colors + font) */}
                      {leftPanel === 'themes' && (
                      <div>
                        {/* Scope toggle — apply a theme to just this page or the whole design */}
                        <div className="mb-2 flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
                          {[
                            { id: 'page', label: `This page (${activePage + 1})` },
                            { id: 'all', label: 'All pages' },
                          ].map((o) => (
                            <button
                              key={o.id}
                              type="button"
                              onClick={() => setThemeScope(o.id)}
                              aria-pressed={themeScope === o.id}
                              className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-bold transition ${
                                themeScope === o.id ? 'bg-brand-500 text-white' : 'text-slate-300 hover:bg-white/5'
                              }`}
                            >{o.label}</button>
                          ))}
                        </div>
                        <p className="mb-2 text-[11px] text-slate-400">
                          {themeScope === 'page'
                            ? 'Tap a theme — it restyles only this page, so every page can look different.'
                            : 'Tap a theme — it restyles every page and syncs to all devices.'}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {THEME_PRESETS.map((t) => {
                            const active =
                              themeScope === 'page'
                                ? normalizedBuilder.pages[activePage]?.themeId === t.id
                                : normalizedBuilder.theme?.gradientFrom === t.gradientFrom &&
                                  normalizedBuilder.theme?.gradientTo === t.gradientTo;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => applyTheme(t)}
                                aria-pressed={active}
                                className={`group relative rounded-xl overflow-hidden border text-left transition active:scale-[0.97] ${
                                  active ? 'border-brand-400 ring-2 ring-brand-400/50' : 'border-white/10 hover:border-brand-400'
                                }`}
                              >
                                <div
                                  className="h-14 w-full"
                                  style={{ background: `linear-gradient(${t.gradientAngle}deg, ${t.gradientFrom}, ${t.gradientTo})` }}
                                />
                                <div className="flex items-center justify-between px-2 py-1.5 bg-slate-900">
                                  <span className="text-[11px] font-bold text-slate-100">{t.name}</span>
                                  {t.bgMotion && <span className="text-[9px] text-brand-300 font-bold">● motion</span>}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* ── Page background — live wallpaper / media / effects ── */}
                        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 space-y-3">
                          <h5 className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-brand-200 font-extrabold">
                            <span className="text-sm">🌈</span> Background
                          </h5>

                          {/* ── Solid color — a plain background for this page
                              (overrides the theme gradient). Clears any photo /
                              video so one background medium wins. */}
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
                                    <button
                                      key={c}
                                      type="button"
                                      onClick={() => setSolid(c)}
                                      aria-pressed={isSolid && pb.toLowerCase() === c}
                                      className={`h-7 w-7 rounded-lg border transition ${isSolid && pb.toLowerCase() === c ? 'border-brand-400 ring-2 ring-brand-400/50' : 'border-white/15 hover:border-white/40'}`}
                                      style={{ background: c }}
                                    />
                                  ))}
                                  <label className="relative h-7 w-7 cursor-pointer overflow-hidden rounded-lg border border-white/15" data-tooltip="Custom color" data-tooltip-pos="top">
                                    <span className="absolute inset-0 grid place-items-center text-[12px]">🎨</span>
                                    <input type="color" value={isSolid ? pb : '#111827'} onChange={(e) => setSolid(e.target.value)} className="absolute inset-0 -m-2 h-[160%] w-[160%] cursor-pointer opacity-0" />
                                  </label>
                                  {pb && (
                                    <button type="button" onClick={() => patchActivePage({ pageBackground: '' })} className="rounded-md bg-white/10 px-2 py-1 text-[10px] text-slate-300 hover:bg-white/20">clear</button>
                                  )}
                                </div>
                              </div>
                            );
                          })()}

                          {/* ── Motion Backgrounds library ──
                              Animated background behind the whole design
                              (gradient/particles/shapes/waves/galaxy/smoke/
                              clouds/light). Real-time; saved in theme.motionBg. */}
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
                                      <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => setM({ type: p.id })}
                                        aria-pressed={active}
                                        className={`rounded-lg px-2 py-1 text-[11px] font-semibold border transition ${active ? 'bg-brand-500 text-white border-brand-300' : 'bg-slate-800 text-white border-white/15 hover:bg-slate-700'}`}
                                      >{p.icon} {p.label}</button>
                                    );
                                  })}
                                </div>
                                {m.type !== 'none' && (
                                  <div className="mt-2.5 flex flex-wrap items-center gap-3">
                                    <label className="flex items-center gap-1.5 text-[11px] text-slate-300">
                                      <span className="relative w-7 h-7 rounded-lg border border-white/15 overflow-hidden cursor-pointer">
                                        <input type="color" value={m.color1} onChange={(e) => setM({ color1: e.target.value })} className="absolute inset-0 w-[160%] h-[160%] -m-2 cursor-pointer" />
                                      </span>Color 1
                                    </label>
                                    <label className="flex items-center gap-1.5 text-[11px] text-slate-300">
                                      <span className="relative w-7 h-7 rounded-lg border border-white/15 overflow-hidden cursor-pointer">
                                        <input type="color" value={m.color2} onChange={(e) => setM({ color2: e.target.value })} className="absolute inset-0 w-[160%] h-[160%] -m-2 cursor-pointer" />
                                      </span>Color 2
                                    </label>
                                    <label className="flex items-center gap-2 text-[11px] text-slate-300">
                                      Speed
                                      <input type="range" min={1} max={3} step={1} value={m.speed} onChange={(e) => setM({ speed: Number(e.target.value) })} />
                                    </label>
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* Animated gradient (motion theme) */}
                          <label className="flex items-center justify-between gap-2 rounded-xl bg-white/5 hover:bg-white/[0.08] px-3 py-2 text-xs font-semibold text-slate-100 cursor-pointer transition">
                            <span>✨ Animated gradient</span>
                            <input
                              type="checkbox"
                              checked={!!normalizedBuilder.theme?.bgMotion}
                              onChange={(e) => patchTheme({ bgMotion: e.target.checked })}
                              className="accent-brand-500 w-4 h-4"
                            />
                          </label>

                          {/* Live effect overlay */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">🪄 Live effect</label>
                            <select
                              value={normalizedBuilder.pages[activePage]?.pageEffect || 'none'}
                              onChange={(e) => patchActivePage({ pageEffect: e.target.value })}
                              className={`tpl-cute-select w-full rounded-xl border border-white/12 bg-slate-900/80 px-3 py-2 text-xs font-medium text-white ${DARK_SELECT_CLASS}`}
                            >
                              {PAGE_EFFECT_PRESETS.map((fx) => (
                                <option key={fx.value} value={fx.value}>{fx.label}</option>
                              ))}
                            </select>
                          </div>

                          {/* Background image — video & photo are mutually exclusive */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">🖼️ Background image</label>
                            <div className="flex gap-1.5">
                              <input
                                key={`bgimg-${activePage}-${normalizedBuilder.pages[activePage]?.pageImageUrl || ''}`}
                                type="url"
                                defaultValue={normalizedBuilder.pages[activePage]?.pageImageUrl || ''}
                                onBlur={(e) => { const u = e.target.value.trim(); patchActivePage(u ? { pageImageUrl: u, pageVideoUrl: '' } : { pageImageUrl: '' }); }}
                                placeholder="https://…/photo.jpg"
                                className={`tpl-cute-input flex-1 min-w-0 rounded-xl border border-white/12 bg-slate-900/80 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`}
                              />
                              <label className="shrink-0 flex cursor-pointer items-center justify-center w-9 rounded-xl border border-white/12 bg-slate-900/80 text-sm text-slate-200 hover:bg-brand-500/20 hover:border-brand-400 transition" data-tooltip="Upload image" data-tooltip-pos="top">
                                ⬆
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => { uploadPageBg(e.target.files?.[0], 'image'); e.target.value = ''; }} />
                              </label>
                              {normalizedBuilder.pages[activePage]?.pageImageUrl && (
                                <button
                                  type="button"
                                  onClick={() => patchActivePage({ pageImageUrl: '' })}
                                  className="shrink-0 w-9 rounded-xl border border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/25 transition flex items-center justify-center"
                                  data-tooltip="Remove image" data-tooltip-pos="top" aria-label="Remove background image"
                                ><Trash2 size={13} strokeWidth={2.2} /></button>
                              )}
                            </div>
                          </div>

                          {/* Background video (live wallpaper) */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">🎥 Background video</label>
                            <div className="flex gap-1.5">
                              <input
                                key={`bgvid-${activePage}-${normalizedBuilder.pages[activePage]?.pageVideoUrl || ''}`}
                                type="url"
                                defaultValue={normalizedBuilder.pages[activePage]?.pageVideoUrl || ''}
                                onBlur={(e) => { const u = e.target.value.trim(); patchActivePage(u ? { pageVideoUrl: u, pageImageUrl: '' } : { pageVideoUrl: '' }); }}
                                placeholder="https://…/clip.mp4"
                                className={`tpl-cute-input flex-1 min-w-0 rounded-xl border border-white/12 bg-slate-900/80 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`}
                              />
                              <label className="shrink-0 flex cursor-pointer items-center justify-center w-9 rounded-xl border border-white/12 bg-slate-900/80 text-sm text-slate-200 hover:bg-brand-500/20 hover:border-brand-400 transition" data-tooltip="Upload video" data-tooltip-pos="top">
                                ⬆
                                <input type="file" accept="video/*" className="hidden" onChange={(e) => { uploadPageBg(e.target.files?.[0], 'video'); e.target.value = ''; }} />
                              </label>
                              {normalizedBuilder.pages[activePage]?.pageVideoUrl && (
                                <button
                                  type="button"
                                  onClick={() => patchActivePage({ pageVideoUrl: '' })}
                                  className="shrink-0 w-9 rounded-xl border border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/25 transition flex items-center justify-center"
                                  data-tooltip="Remove video" data-tooltip-pos="top" aria-label="Remove background video"
                                ><Trash2 size={13} strokeWidth={2.2} /></button>
                              )}
                            </div>
                            <p className="mt-1 text-[10px] text-slate-500">A photo and video can't both be the background — setting one clears the other.</p>
                          </div>

                          {bgUploading && <p className="text-[10px] font-semibold text-brand-300">Uploading…</p>}
                        </div>
                      </div>
                      )}

                      {/* Pages/Layers */}
                      {leftPanel === 'pages' && (
                      <div>
                        <div className="flex flex-wrap gap-2">
                          {normalizedBuilder.pages.map((p, i) => (
                            <button
                              key={p.id || i}
                              type="button"
                              onClick={() => setActivePage(i)}
                              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                                activePage === i ? 'bg-brand-500 text-slate-950' : 'bg-slate-800/80 text-slate-200 hover:bg-slate-800'
                              }`}
                            >
                              {i + 1}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={addPageQuick}
                            className="rounded-lg bg-brand-500/10 px-3 py-2 text-xs font-semibold text-brand-200 hover:bg-brand-500/20"
                          >
                            + Page
                          </button>
                        </div>
                      </div>
                      )}

                      {/* Layers / Blocks List */}
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

                    {/* Center Canvas — sized to the active viewport's
                        aspect ratio (mobile 9:19.5, desktop 16:9). Blocks
                        are positioned in design pixels relative to this
                        canvas; the renderer scales it uniformly to fit
                        end-user devices, so the editor view is exactly
                        what the user will see.

                        The outer "canvas host" uses `container-type: size`
                        so the canvas can size itself with `min(100cqi,
                        100cqb × aspect)` — meaning it picks the largest
                        rectangle that fits inside the available space
                        in both dimensions. Result: switching mobile /
                        desktop / any device just reshapes the rectangle
                        in place without overflow. */}
                    <div className="relative flex-1 flex flex-col gap-3 overflow-hidden">
                      <div
                        className="flex-1 min-h-0 p-3 relative overflow-auto"
                        style={{
                          containerType: 'size',
                          containerName: 'canvas-host',
                          // When an element is selected the contextual bar floats
                          // at the top — drop the canvas below it so the bar never
                          // overlaps the element or its handles.
                          paddingTop: selectedBlockIndex != null ? '5.5rem' : undefined,
                        }}
                      >
                        {(() => {
                          /* Canvas aspect follows the active device artboard so
                             the preview box matches the breakpoint (portrait on
                             mobile, landscape on desktop) — no letterboxing.
                             It's sized by WIDTH (up to a comfy per-device max)
                             so the device is large & clearly visible; if it's
                             taller than the editor it just scrolls. */
                          const vpKey = normalizedBuilder.viewport || 'desktop';
                          const vp = responsiveEnabled && activeArtboard
                            ? activeArtboard
                            : (VIEWPORT_PRESETS[vpKey] || VIEWPORT_PRESETS.desktop);
                          const deviceKey = responsiveEnabled ? activeBp : vpKey;
                          const maxW = deviceKey === 'mobile' ? 460 : deviceKey === 'tablet' ? 820 : 1280;
                          return (
                            <div className="min-h-full w-full flex justify-center" style={{ alignItems: 'safe center' }}>
                            <div
                              ref={editorArtboardRef}
                              className="relative shrink-0 rounded-xl border border-white/10 bg-black overflow-hidden shadow-2xl"
                              style={{
                                aspectRatio: `${vp.width} / ${vp.height}`,
                                width: `min(100cqi, ${maxW}px)`,
                              }}
                            >
                              {builderPreviewError ? (
                                <div className="p-6 text-sm text-amber-300 flex items-center justify-center h-full">{builderPreviewError}</div>
                              ) : (
                                <SlideshowBuilder
                                  structure={previewStructure}
                                  fills={{}}
                                  /* Precision = the edit/preview switch. ON →
                                     editable (select, move, resize, rotate,
                                     properties). OFF → the design behaves EXACTLY
                                     like the published page (games playable,
                                     buttons navigate, nothing selectable) so you
                                     can test that everything works. */
                                  editable={fabricMode}
                                  /* Legacy DOM drag-to-move stays OFF: moving /
                                     resizing / rotating happens only via the
                                     Precision (Fabric) layer. */
                                  dragMode={false}
                                  previewBreakpoint={activeBp}
                                  activeIndex={activePage}
                                  onActiveIndexChange={setActivePage}
                                  onTextSlotCommit={(slot, text) =>
                                    setBuilderState((prev) => updateBuilderTextBySlot(prev, slot, text))
                                  }
                                  /* Auto-sync: every edit writes the ONE base
                                     design (relative %, scaled size) so the
                                     change applies to ALL devices, adapted per
                                     screen — the previewed device just sets the
                                     coordinate space. */
                                  onBlockMoveCommit={(slot, x, y, refW, refH) => {
                                    // Convert the dropped centre to a % of the
                                    // SAME box the canvas measured against, so
                                    // the block lands exactly where released.
                                    const xPct = refW > 0 ? (x / refW) * 100 : null;
                                    const yPct = refH > 0 ? (y / refH) * 100 : null;
                                    setBuilderState((prev) => updateBuilderBlockPositionPctSynced(prev, slot, xPct, yPct));
                                  }}
                                  selectedSlot={selectedSlotForCanvas}
                                  onSelectionChange={handleAdminSelectionChange}
                                  onResizeCommit={(slot, w, h) =>
                                    setBuilderState((prev) => updateBuilderBlockSizeForDevice(prev, slot, w, h, activeBp))
                                  }
                                  onRotateCommit={(slot, deg) =>
                                    setBuilderState((prev) => updateBuilderBlockRotateSynced(prev, slot, deg))
                                  }
                                  embedded
                                  className="!w-full !h-full [&_.html-deck-root]:!h-full [&_.html-deck-root]:!min-h-0 [&_.html-deck-root]:!border-0 [&_.html-deck-root]:!rounded-none"
                                />
                              )}
                              {/* Fabric.js control layer — overlays the HTML
                                  preview, provides handles, commits through the
                                  same builderState mutators used above. */}
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
                                    // A single, ungrouped block jumps to the front when moved, so it
                                    // sits ABOVE whatever it was dragged over (not behind it).
                                    const toFront =
                                      selectedLayerIndices.length <= 1 &&
                                      !normalizedBuilder.pages[activePage]?.blocks?.[bi]?.groupId;
                                    setBuilderState((prev) => {
                                      const moved = updateBuilderBlockPositionPctSynced(prev, slot, xPct, yPct);
                                      return toFront ? bringBlockToFrontBySlot(moved, slot) : moved;
                                    });
                                    if (toFront) {
                                      const len = normalizedBuilder.pages[activePage]?.blocks?.length || 1;
                                      setSelectedBlockIndex(len - 1);   // follow it to the top of the stack
                                    }
                                  }}
                                  onResizeCommit={(slot, w, h) =>
                                    setBuilderState((prev) => updateBuilderBlockSizeForDevice(prev, slot, w, h, activeBp))
                                  }
                                  onRotateCommit={(slot, deg) =>
                                    setBuilderState((prev) => updateBuilderBlockRotateSynced(prev, slot, deg))
                                  }
                                  onDuplicate={(idx) => duplicateBlockAt(activePage, idx)}
                                  onDelete={(idx) => deleteBlockAt(activePage, idx)}
                                  onCopy={(idx) => copyBlockAt(activePage, idx)}
                                  onPaste={() => pasteBlock(activePage)}
                                  canPaste={hasClipboard}
                                  onReorder={(idx, dir) => {
                                    const len = normalizedBuilder.pages[activePage]?.blocks?.length || 0;
                                    const to = dir === 'forward' ? Math.min(len - 1, idx + 1)
                                      : dir === 'back' ? Math.max(0, idx - 1)
                                      : dir === 'front' ? len - 1
                                      : 0; // backmost
                                    if (to !== idx) reorderBlock(activePage, idx, to);
                                  }}
                                />
                              )}
                              {/* Background-upload feedback — blur the canvas
                                  and show a cute loader so you know something
                                  is happening. */}
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
                          );
                        })()}
                      </div>
                      <p className="text-center text-xs text-slate-500">
                        Click any block to select • Drag corners to resize • Top handle to rotate (hold Shift for 15°) •{' '}
                        <span className="text-pink-300/80 font-semibold capitalize">
                          {responsiveEnabled
                            ? `Previewing ${activeBp} (${activeArtboard.width}×${activeArtboard.height})`
                            : ((normalizedBuilder.viewport === 'desktop')
                              ? 'Designing for desktop (1280×720)'
                              : 'Designing for mobile (390×844)')}
                        </span>
                        {responsiveEnabled && (
                          <span className="ml-1 text-brand-300">— edits sync to every device ✨</span>
                        )}
                      </p>
                    </div>

                    {/* ── Right tool panel (floating overlay) ─────── */}
                    {rightPanel && (
                    <div className="absolute top-2 right-3 z-30 w-60 lg:w-72 max-w-[calc(100vw-1.5rem)] max-h-[calc(100%-1rem)] flex flex-col gap-4 overflow-y-auto rounded-2xl border border-white/15 bg-slate-950/95 backdrop-blur-xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85)] px-3 py-3 animate-fade-in">
                      <div className="flex items-center justify-between sticky top-0 bg-slate-950/95 pb-2 -mt-1 pt-1 -mx-3 px-3 border-b border-white/10">
                        <h4 className="text-xs uppercase tracking-widest text-slate-300 font-bold">
                          ⚙️ {rightPanel === 'info' ? 'Campaign info' : 'Properties'}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setRightPanel(null)}
                          className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
                          aria-label="Close panel"
                        >
                          ✕
                        </button>
                      </div>
                      {editing && (
                        <div>
                          <h4 className="mb-3 text-xs uppercase tracking-widest text-slate-400">Campaign Info</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Name</label>
                              <input
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Thumbnail</label>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                                className="w-full text-xs text-slate-300 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-brand-500/20 file:text-brand-200"
                              />
                              {(thumbnailPreviewUrl || editing?.thumbnailUrl) && (
                                <img
                                  src={thumbnailPreviewUrl || editing?.thumbnailUrl}
                                  alt=""
                                  className="mt-2 h-16 w-24 rounded-lg border border-white/10 object-cover"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Page Settings */}
                      <div>
                        <h4 className="mb-3 text-xs uppercase tracking-widest text-slate-400">Page Settings</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Title</label>
                            <input
                              value={normalizedBuilder.pages[activePage]?.pageTitle || ''}
                              onChange={(e) => patchPage(activePage, { pageTitle: e.target.value })}
                              className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`}
                              placeholder="Page title"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Duration (sec)</label>
                            <input
                              type="number"
                              min={0}
                              max={120}
                              value={
                                normalizedBuilder.pages[activePage]?.pageDurationMs === '' ||
                                normalizedBuilder.pages[activePage]?.pageDurationMs == null
                                  ? ''
                                  : Math.round(Number(normalizedBuilder.pages[activePage]?.pageDurationMs) / 1000)
                              }
                              onChange={(e) =>
                                patchPage(activePage, {
                                  pageDurationMs:
                                    e.target.value === '' ? '' : Math.min(120000, Math.max(0, Number(e.target.value) * 1000)),
                                })
                              }
                              className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`}
                            />
                          </div>
                          {/* Background field removed — use the visual
                              "🌈 Background" panel (gradient / image / video /
                              effects) in the left Themes panel instead. */}
                        </div>
                      </div>

                      {/* Selected Block Properties — header reflects the
                          clicked element so the panel reads as a contextual
                          inspector (only this element's controls show). */}
                      {(normalizedBuilder.pages[activePage]?.blocks || []).length > 0 && (() => {
                        const selType = normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.type;
                        const TYPE_META = {
                          heading: { icon: '🅰', label: 'Heading' }, subheading: { icon: '🅰', label: 'Subheading' },
                          text: { icon: '🅰', label: 'Text' }, image: { icon: '🖼️', label: 'Image' },
                          gif: { icon: '🎬', label: 'GIF' }, video: { icon: '🎞️', label: 'Video' },
                          sticker: { icon: '😎', label: 'Sticker' }, shape: { icon: '⬢', label: 'Shape' },
                          countdown: { icon: '⏱', label: 'Countdown' }, gallery: { icon: '🖼️', label: 'Gallery' },
                          button: { icon: '🔘', label: 'Button' }, buttons: { icon: '🔘', label: 'Buttons' },
                          trickyn: { icon: '💘', label: 'Yes / No' }, reveal: { icon: '🎁', label: 'Tap Reveal' },
                          quiz: { icon: '❓', label: 'Quiz' }, poll: { icon: '📊', label: 'Poll' },
                          memory: { icon: '🧠', label: 'Memory Game' }, spot: { icon: '🔍', label: 'Spot It' },
                          wheel: { icon: '🎡', label: 'Spin Wheel' }, giftbox: { icon: '🎀', label: 'Gift Box' },
                          flip: { icon: '🔄', label: 'Flip Card' }, slot: { icon: '🎰', label: 'Slot Machine' },
                          puzzle: { icon: '🧩', label: 'Puzzle' }, rps: { icon: '✊', label: 'Rock Paper Scissors' },
                        };
                        const meta = TYPE_META[selType] || { icon: '⬚', label: 'Element' };
                        return (
                        <div>
                          <h4 className="mb-3 flex items-center gap-1.5 text-xs uppercase tracking-widest text-brand-300 font-bold">
                            <span>{meta.icon}</span> {meta.label} properties
                          </h4>
                          <div className="space-y-3">
                            {'text' in (normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex] || {}) && (
                              <div>
                                <label className="block text-xs text-slate-400 mb-1">Text</label>
                                <textarea
                                  rows={3}
                                  value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.text || ''}
                                  onChange={(e) => updateSelectedBlock({ text: e.target.value })}
                                  className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`}
                                  placeholder="Edit text"
                                />
                              </div>
                            )}
                            {/* Canva-style text studio: IG font picker + effects + sliders */}
                            {'text' in (normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex] || {}) && (
                              <TextStudioPanel
                                block={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]}
                                onChange={updateSelectedBlock}
                              />
                            )}
                            {'text' in (normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex] || {}) && (
                              <TypographyPresetsPanel onApply={updateSelectedBlock} />
                            )}
                            {'label' in (normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex] || {}) && (
                              <div>
                                <label className="block text-xs text-slate-400 mb-1">Label</label>
                                <input
                                  value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.label || ''}
                                  onChange={(e) => updateSelectedBlock({ label: e.target.value })}
                                  className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`}
                                  placeholder="Button label"
                                />
                              </div>
                            )}
                            {'navPage' in (normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex] || {}) && (
                              <div>
                                <label className="block text-xs text-slate-400 mb-1">Navigate to Page</label>
                                <input
                                  type="number"
                                  min={1}
                                  max={normalizedBuilder.pages.length}
                                  value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.navPage ?? 1}
                                  onChange={(e) => updateSelectedBlock({ navPage: Number(e.target.value) || 1 })}
                                  className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`}
                                />
                              </div>
                            )}
                            {/* Canva-style button styling (variant / colors / radius / padding) */}
                            {['button', 'buttonSlot'].includes(normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.type) && (
                              <ButtonStudioPanel
                                block={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]}
                                onChange={updateSelectedBlock}
                              />
                            )}
                            {/* Interactive / game settings */}
                            {GAME_TYPES.includes(normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.type) && (
                              <GameStudioPanel
                                block={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]}
                                onChange={updateSelectedBlock}
                                onUploadImage={uploadGameImage}
                              />
                            )}
                            {normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.type === 'gallery' && (
                              <>
                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">Photo Count</label>
                                  <input
                                    type="number"
                                    min={1}
                                    max={12}
                                    value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.count ?? 4}
                                    onChange={(e) => updateSelectedBlock({ count: Math.min(12, Math.max(1, Number(e.target.value) || 4)) })}
                                    className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">Animation</label>
                                  <select
                                    value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.galleryAnimation || 'fade'}
                                    onChange={(e) => updateSelectedBlock({ galleryAnimation: e.target.value })}
                                    className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}
                                  >
                                    <option value="fade">Fade</option>
                                    <option value="zoom">Zoom</option>
                                    <option value="slide">Slide up</option>
                                    <option value="lanes">Lanes</option>
                                    <option value="autoVertical">Auto vertical</option>
                                  </select>
                                </div>
                              </>
                            )}
                            {['image', 'gif', 'video', 'gallery'].includes(normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.type) && (
                              <>
                                {['image', 'gif', 'video'].includes(normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.type) && (
                                  <div>
                                    <label className="block text-xs text-slate-400 mb-1">Fit</label>
                                    <select
                                      value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.mediaFit || 'cover'}
                                      onChange={(e) => updateSelectedBlock({ mediaFit: e.target.value })}
                                      className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}
                                    >
                                      <option value="cover">Cover</option>
                                      <option value="contain">Contain</option>
                                      <option value="fill">Fill</option>
                                    </select>
                                  </div>
                                )}
                                {/* Frame shape — mask the media into a shape */}
                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">🖼️ Frame shape</label>
                                  <select
                                    value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.mediaShape || 'none'}
                                    onChange={(e) => updateSelectedBlock({ mediaShape: e.target.value })}
                                    className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}
                                  >
                                    {MEDIA_SHAPE_PRESETS.map((s) => (
                                      <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                  </select>
                                </div>
                                {normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.type === 'video' && (
                                  <div>
                                    <label className="block text-xs text-slate-400 mb-1">🎬 Video display</label>
                                    <select
                                      value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.videoMode || 'inline'}
                                      onChange={(e) => updateSelectedBlock({ videoMode: e.target.value })}
                                      className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}
                                    >
                                      <option value="inline">Show inline (play in place)</option>
                                      <option value="lightbox">Tap to play fullscreen</option>
                                    </select>
                                  </div>
                                )}
                                {/* ── Filters panel (Instagram-style) ──
                                    Presets + fine adjustments are CSS filters
                                    applied live to the source image → fully
                                    non-destructive, editable any time, and
                                    persisted in the block JSON (imageFilter +
                                    brightness/contrast/saturation/exposure/blur). */}
                                <div className="pt-1">
                                  <label className="block text-xs font-semibold text-brand-300/90 mb-1.5">📷 Filters</label>
                                  <div className="flex flex-wrap gap-1.5">
                                    {FILTER_PRESETS.map((f) => {
                                      const active = (normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.imageFilter || 'none') === f.value;
                                      return (
                                        <button
                                          key={f.value}
                                          type="button"
                                          onClick={() => updateSelectedBlock({ imageFilter: f.value })}
                                          aria-pressed={active}
                                          className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${active ? 'bg-brand-500 text-white shadow' : 'bg-white/5 hover:bg-white/15 text-slate-200'}`}
                                        >{f.label}</button>
                                      );
                                    })}
                                  </div>
                                </div>
                                {/* Fine adjustments — % controls (100 = no change) + blur in px. */}
                                {[
                                  { key: 'brightness', label: '☀ Brightness', min: 0, max: 200, def: 100, unit: '%' },
                                  { key: 'contrast',   label: '◐ Contrast',   min: 0, max: 200, def: 100, unit: '%' },
                                  { key: 'saturation', label: '🎨 Saturation', min: 0, max: 200, def: 100, unit: '%' },
                                  { key: 'exposure',   label: '◔ Exposure',   min: 0, max: 200, def: 100, unit: '%' },
                                  { key: 'blur',       label: '🌫 Blur',       min: 0, max: 30,  def: 0,   unit: 'px' },
                                ].map(({ key, label, min, max, def, unit }) => {
                                  const cur = normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.[key] ?? def;
                                  return (
                                    <div key={key}>
                                      <label className="block text-xs text-slate-400 mb-1">{label}: {Math.round(cur)}{unit}</label>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="range" min={min} max={max}
                                          value={cur}
                                          onChange={(e) => updateSelectedBlock({ [key]: Number(e.target.value) })}
                                          className="w-full"
                                        />
                                        <button
                                          type="button"
                                          title="Reset"
                                          onClick={() => updateSelectedBlock({ [key]: def })}
                                          className="rounded bg-white/5 hover:bg-white/15 text-slate-300 text-[10px] px-1.5 py-0.5"
                                        >↺</button>
                                      </div>
                                    </div>
                                  );
                                })}
                                <button
                                  type="button"
                                  onClick={() => updateSelectedBlock({ imageFilter: 'none', brightness: 100, contrast: 100, saturation: 100, exposure: 100, blur: 0 })}
                                  className="mt-1 w-full rounded-lg bg-white/5 hover:bg-white/15 text-slate-200 text-[11px] font-semibold py-1.5 transition"
                                >Reset all filters</button>
                              </>
                            )}

                            {/* Sticker props */}
                            {normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.type === 'sticker' && (
                              <>
                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">Emoji</label>
                                  <input
                                    type="text"
                                    maxLength={4}
                                    value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.emoji || ''}
                                    onChange={(e) => updateSelectedBlock({ emoji: e.target.value })}
                                    className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xl text-white text-center ${DARK_INPUT_CLASS}`}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">Size: {normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.size || 64}px</label>
                                  <input
                                    type="range" min={20} max={240}
                                    value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.size || 64}
                                    onChange={(e) => updateSelectedBlock({ size: Number(e.target.value) })}
                                    className="w-full"
                                  />
                                </div>
                              </>
                            )}

                            {/* Shape props */}
                            {normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.type === 'shape' && (
                              <>
                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">Kind</label>
                                  <select
                                    value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.shapeKind || 'rect'}
                                    onChange={(e) => updateSelectedBlock({ shapeKind: e.target.value })}
                                    className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}
                                  >
                                    {SHAPE_PRESETS.map((s) => (
                                      <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">Fill color</label>
                                  <input
                                    type="color"
                                    value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.fillColor || '#d946ef'}
                                    onChange={(e) => updateSelectedBlock({ fillColor: e.target.value })}
                                    className="w-full h-9 rounded-lg border border-white/10 bg-slate-900"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-xs text-slate-400 mb-1">W</label>
                                    <input
                                      type="number" min={20} max={800}
                                      value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.width || 160}
                                      onChange={(e) => updateSelectedBlock({ width: Number(e.target.value) || 160 })}
                                      className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-slate-400 mb-1">H</label>
                                    <input
                                      type="number" min={20} max={800}
                                      value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.height || 160}
                                      onChange={(e) => updateSelectedBlock({ height: Number(e.target.value) || 160 })}
                                      className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">Opacity: {Math.round((normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.opacity ?? 1) * 100)}%</label>
                                  <input
                                    type="range" min={0} max={100}
                                    value={Math.round((normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.opacity ?? 1) * 100)}
                                    onChange={(e) => updateSelectedBlock({ opacity: Number(e.target.value) / 100 })}
                                    className="w-full"
                                  />
                                </div>
                              </>
                            )}

                            {/* Countdown block properties */}
                            {normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.type === 'countdown' && (
                              <div className="space-y-2">
                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">⏱ Target date & time</label>
                                  <input
                                    type="datetime-local"
                                    value={(() => {
                                      const iso = normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.targetISO;
                                      if (!iso) return '';
                                      try {
                                        const d = new Date(iso);
                                        if (!isFinite(d.getTime())) return '';
                                        const pad = (n) => String(n).padStart(2, '0');
                                        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                                      } catch { return ''; }
                                    })()}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      if (!v) { updateSelectedBlock({ targetISO: '' }); return; }
                                      try { updateSelectedBlock({ targetISO: new Date(v).toISOString() }); } catch {}
                                    }}
                                    className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">Title</label>
                                  <input
                                    value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.title || ''}
                                    onChange={(e) => updateSelectedBlock({ title: e.target.value })}
                                    placeholder="Counting down to"
                                    className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-xs text-slate-400 mb-1">Style</label>
                                    <select
                                      value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.style || 'card'}
                                      onChange={(e) => updateSelectedBlock({ style: e.target.value })}
                                      className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}
                                    >
                                      <option value="minimal">Minimal</option>
                                      <option value="card">Card</option>
                                      <option value="mega">Mega</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs text-slate-400 mb-1">Accent</label>
                                    <input
                                      type="color"
                                      value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.accentColor || '#d946ef'}
                                      onChange={(e) => updateSelectedBlock({ accentColor: e.target.value })}
                                      className="w-full h-9 rounded-lg border border-white/10 bg-slate-900"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Text effects (text/heading/subheading) */}
                            {['text','heading','subheading'].includes(normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.type) && (
                              <div className="border-t border-white/5 pt-3 space-y-2">
                                <label className="block text-xs text-slate-400 mb-1">🅰 Text effect</label>
                                <select
                                  value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.textEffect || 'none'}
                                  onChange={(e) => updateSelectedBlock({ textEffect: e.target.value })}
                                  className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}
                                >
                                  {TEXT_EFFECT_PRESETS.map((p) => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                  ))}
                                </select>
                                {['gradient','neon','glow','stroke'].includes(normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.textEffect) && (
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[10px] text-slate-500 mb-1">Color 1</label>
                                      <input
                                        type="color"
                                        value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.textGradientFrom || '#f97316'}
                                        onChange={(e) => updateSelectedBlock({ textGradientFrom: e.target.value })}
                                        className="w-full h-8 rounded-lg border border-white/10 bg-slate-900"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] text-slate-500 mb-1">Color 2</label>
                                      <input
                                        type="color"
                                        value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.textGradientTo || '#d946ef'}
                                        onChange={(e) => updateSelectedBlock({ textGradientTo: e.target.value })}
                                        className="w-full h-8 rounded-lg border border-white/10 bg-slate-900"
                                      />
                                    </div>
                                  </div>
                                )}
                                <label className="block text-xs text-slate-400 mt-1">Font</label>
                                <select
                                  value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.fontFamily || ''}
                                  onChange={(e) => updateSelectedBlock({ fontFamily: e.target.value })}
                                  className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}
                                >
                                  <option value="">Inherit</option>
                                  {BUILDER_FONT_OPTIONS.map((f) => (
                                    <option key={f.value} value={f.value}>{f.group} — {f.label}</option>
                                  ))}
                                </select>
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <label className="block text-[10px] text-slate-500 mb-1">Weight</label>
                                    <select
                                      value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.fontWeight || ''}
                                      onChange={(e) => updateSelectedBlock({ fontWeight: e.target.value === '' ? '' : Number(e.target.value) })}
                                      className={`w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-xs text-white ${DARK_SELECT_CLASS}`}
                                    >
                                      <option value="">Auto</option>
                                      <option value="300">Light</option>
                                      <option value="400">Reg</option>
                                      <option value="600">Semi</option>
                                      <option value="700">Bold</option>
                                      <option value="800">X-Bold</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-500 mb-1">Spacing</label>
                                    <input
                                      type="number" step={0.01} min={-0.1} max={0.5}
                                      value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.letterSpacingEm ?? ''}
                                      onChange={(e) => updateSelectedBlock({ letterSpacingEm: e.target.value === '' ? '' : Number(e.target.value) })}
                                      className={`w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-xs text-white ${DARK_INPUT_CLASS}`}
                                      placeholder="0"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-500 mb-1">Line h</label>
                                    <input
                                      type="number" step={0.05} min={0.8} max={2.4}
                                      value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.lineHeight ?? ''}
                                      onChange={(e) => updateSelectedBlock({ lineHeight: e.target.value === '' ? '' : Number(e.target.value) })}
                                      className={`w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-xs text-white ${DARK_INPUT_CLASS}`}
                                      placeholder="1.2"
                                    />
                                  </div>
                                </div>
                                {/* Size · Color · Align */}
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <label className="block text-[10px] text-slate-500 mb-1">Size</label>
                                    <input
                                      type="number" min={8} max={220}
                                      value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.fontSize ?? ''}
                                      onChange={(e) => updateSelectedBlock({ fontSize: e.target.value === '' ? '' : Number(e.target.value) })}
                                      className={`w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-xs text-white ${DARK_INPUT_CLASS}`}
                                      placeholder="auto"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-500 mb-1">Color</label>
                                    <input
                                      type="color"
                                      value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.color || '#ffffff'}
                                      onChange={(e) => updateSelectedBlock({ color: e.target.value })}
                                      className="w-full h-[30px] rounded-lg border border-white/10 bg-slate-900"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-500 mb-1">Align</label>
                                    <div className="flex rounded-lg border border-white/10 overflow-hidden">
                                      {['left', 'center', 'right'].map((al) => {
                                        const cur = normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.align || 'center';
                                        return (
                                          <button
                                            key={al}
                                            type="button"
                                            onClick={() => updateSelectedBlock({ align: al })}
                                            className={`flex-1 py-1.5 text-[11px] transition ${cur === al ? 'bg-brand-500 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
                                            aria-label={`Align ${al}`}
                                          >{al === 'left' ? '⬅' : al === 'center' ? '↔' : '➡'}</button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                                {/* Border + corners (curve ↔ square) */}
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <label className="block text-[10px] text-slate-500 mb-1">Border</label>
                                    <input
                                      type="number" min={0} max={40}
                                      value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.borderWidth ?? ''}
                                      onChange={(e) => updateSelectedBlock({ borderWidth: e.target.value === '' ? '' : Number(e.target.value) })}
                                      className={`w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-xs text-white ${DARK_INPUT_CLASS}`}
                                      placeholder="0"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-500 mb-1">Border color</label>
                                    <input
                                      type="color"
                                      value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.borderColor || '#ffffff'}
                                      onChange={(e) => updateSelectedBlock({ borderColor: e.target.value })}
                                      className="w-full h-[30px] rounded-lg border border-white/10 bg-slate-900"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-500 mb-1">Corners</label>
                                    <input
                                      type="number" min={0} max={400}
                                      value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.cornerRadius ?? ''}
                                      onChange={(e) => updateSelectedBlock({ cornerRadius: e.target.value === '' ? '' : Number(e.target.value) })}
                                      className={`w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-xs text-white ${DARK_INPUT_CLASS}`}
                                      placeholder="0"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Entrance animation (every block) */}
                            <div className="border-t border-white/5 pt-3">
                              <label className="block text-xs text-slate-400 mb-1">✨ Entrance animation</label>
                              <select
                                value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.enterAnimation || 'none'}
                                onChange={(e) => updateSelectedBlock({ enterAnimation: e.target.value })}
                                className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}
                              >
                                {ENTER_ANIM_PRESETS.map((a) => (
                                  <option key={a.value} value={a.value}>{a.label}</option>
                                ))}
                              </select>
                              <label className="block text-xs text-slate-400 mt-2 mb-1">Delay (ms)</label>
                              <input
                                type="number" min={0} max={3000} step={50}
                                value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.enterDelayMs || 0}
                                onChange={(e) => updateSelectedBlock({ enterDelayMs: Number(e.target.value) || 0 })}
                                className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`}
                              />
                              {/* Continuous loop motion (every block) */}
                              <label className="block text-xs text-slate-400 mt-3 mb-1">🔁 Loop motion</label>
                              <select
                                value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.loopAnimation || 'none'}
                                onChange={(e) => updateSelectedBlock({ loopAnimation: e.target.value })}
                                className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}
                              >
                                {LOOP_ANIM_PRESETS.map((a) => (
                                  <option key={a.value} value={a.value}>{a.label}</option>
                                ))}
                              </select>
                              {(normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.loopAnimation || 'none') !== 'none' && (
                                <p className="mt-1 text-[10px] text-slate-500">Loop motion plays continuously (replaces the entrance for this element).</p>
                              )}
                            </div>
                          </div>
                        </div>
                        );
                      })()}

                    </div>
                    )}

                  </div>
                </div>
              )}
            </div>
          )}
        </section>
            </>
          );
          return editorActive
            ? createPortal(editorJsx, document.body)
            : editorJsx;
        })()}
      </div>

      <ConfirmDialog
        open={deleteConfirmId != null}
        title="Remove this website?"
        description="This cannot be undone. People who already published a page from it may need to create a new link."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        loading={deleteLoading}
        onClose={() => {
          if (!deleteLoading) setDeleteConfirmId(null);
        }}
        onConfirm={executeDeleteTemplate}
      />

      {/* Starter templates picker */}
      {typeof document !== 'undefined' && createPortal(
      <AnimatePresence>
        {starterPickerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
            data-lenis-prevent
            onClick={() => setStarterPickerOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="tpl-modal-card tpl-modal-scroll w-full max-w-4xl rounded-[2rem] border p-6 sm:p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold text-brand-700 dark:text-fuchsia-300">✨ Starter templates</p>
                  <h3 className="tpl-modal-title font-display text-2xl font-extrabold mt-1">Pick a starting point</h3>
                  <p className="tpl-modal-desc text-sm mt-1">Loads a ready-to-edit story. You can change anything after.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStarterPickerOpen(false)}
                  className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white text-lg w-9 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition flex items-center justify-center"
                  aria-label="Close"
                >✕</button>
              </div>
              {/* Denser grid + photo-backed cards. The accent gradient
                  sits underneath the <img> as a fallback if the Unsplash
                  photo fails to load, so cards never render as a blank
                  rectangle. A 2-stop dark gradient overlays the photo
                  so the white title at the bottom always reads. */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {STARTER_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => loadStarterTemplate(t.id)}
                    className="group text-left rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 hover:border-brand-400 dark:hover:border-brand-400 transition active:scale-[0.97] relative aspect-[3/4]"
                    style={{ background: t.accent }}
                  >
                    {t.image && (
                      <img
                        src={t.image}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover transition duration-700 group-hover:scale-[1.08]"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    {/* Tinted accent wash + bottom legibility gradient */}
                    <div className="absolute inset-0 mix-blend-overlay opacity-40" style={{ background: t.accent }} />
                    {/* Stronger 3-stop legibility gradient: pure black at
                        the very bottom so the title is bold even on
                        light/busy photos, fading to transparent ~55%
                        up so the image still reads. */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" style={{ '--tw-gradient-via-position': '32%', '--tw-gradient-to-position': '60%' }} />
                    {/* Story-progress bars */}
                    <div className="absolute inset-x-2 top-2 flex gap-1">
                      <span className="h-0.5 flex-1 rounded-full bg-white/90" />
                      <span className="h-0.5 flex-1 rounded-full bg-white/40" />
                      <span className="h-0.5 flex-1 rounded-full bg-white/40" />
                    </div>
                    {/* Emoji pill in the top-left */}
                    <div className="absolute top-4 left-2.5 w-9 h-9 rounded-full bg-white/95 backdrop-blur flex items-center justify-center text-xl shadow-lg">
                      {t.emoji}
                    </div>
                    {/* Bottom caption */}
                    <div className="absolute inset-x-3 bottom-3 text-white">
                      <p className="font-display font-extrabold text-[15px] leading-tight" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.85)' }}>
                        {t.name}
                      </p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/85 font-bold" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.85)' }}>
                        {t.category} · {t.builderState.pages.length} pages
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
      )}

      {/* New-website modal — portaled to body so motion.main's transform
          doesn't create a wrong containing block for its `fixed inset-0`. */}
      {typeof document !== 'undefined' && formOpen && !editing && createStep === 1 && createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-md"
          data-lenis-prevent
          onClick={dismissCreate}
        >
          <motion.form
            initial={{ scale: 0.94, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            className="tpl-modal-card relative w-full max-w-5xl rounded-[2rem] border shadow-2xl flex flex-col max-h-[94vh] overflow-hidden"
          >
            {/* Soft gradient stripe across the top */}
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-400 via-violet-500 to-pink-500" />

            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-6 pt-6 sm:px-8 sm:pt-7">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-700 dark:text-fuchsia-300">
                  {creationMode === 'starters' ? '🪄 Pick a starter' : '✨ Create new website'}
                </p>
                <h2 className="tpl-modal-title mt-2 font-display text-2xl sm:text-3xl font-extrabold">
                  {creationMode === 'starters' ? 'Pick a starting point' : 'Start a blank canvas'}
                </h2>
                <p className="tpl-modal-desc mt-1 text-sm max-w-2xl">
                  {creationMode === 'starters'
                    ? 'Tap a template to start with a ready-made story. You can rename and customize everything in the next step.'
                    : 'Name your page and jump into the editor. You can add pages, photos, stickers, and effects from there.'}
                </p>
              </div>
              <button
                type="button"
                onClick={dismissCreate}
                className="shrink-0 text-slate-400 hover:text-slate-900 dark:hover:text-white text-lg w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition flex items-center justify-center"
                aria-label="Close"
              >✕</button>
            </div>

            {/* Body: gallery (starters mode) OR centered illustration (blank mode).
                `min-h-0` is critical here — without it the flex child claims its
                content height as min-height, ignores the parent's max-h cap,
                and overflows the modal (clipped by `overflow-hidden` above). */}
            <div className="px-6 sm:px-8 py-5 overflow-y-auto flex-1 min-h-0">
              {creationMode === 'starters' ? (
                /* Same photo-backed card pattern as the standalone picker
                   — denser grid (4 cols on lg), 3:4 portrait aspect,
                   gradient fallback under the Unsplash photo. */
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {STARTER_TEMPLATES.map((t) => {
                    const active = pickedStarterId === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => pickStarter(t.id)}
                        aria-pressed={active}
                        className={`group text-left rounded-xl overflow-hidden border transition active:scale-[0.97] relative aspect-[3/4] ${
                          active
                            ? 'border-brand-500 ring-4 ring-brand-500/20 shadow-xl shadow-brand-500/15'
                            : 'border-slate-200 dark:border-white/10 hover:border-brand-400 dark:hover:border-brand-400'
                        }`}
                        style={{ background: t.accent }}
                      >
                        {t.image && (
                          <img
                            src={t.image}
                            alt=""
                            loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover transition duration-700 group-hover:scale-[1.08]"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                        <div className="absolute inset-0 mix-blend-overlay opacity-50" style={{ background: t.accent }} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                        {active && (
                          <span className="absolute top-2 right-2 rounded-full bg-white text-brand-700 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 shadow">✓ Picked</span>
                        )}
                        <div className="absolute inset-x-2 top-2 flex gap-1 pr-16">
                          <span className="h-0.5 flex-1 rounded-full bg-white/90" />
                          <span className="h-0.5 flex-1 rounded-full bg-white/40" />
                          <span className="h-0.5 flex-1 rounded-full bg-white/40" />
                        </div>
                        <div className="absolute top-4 left-2.5 w-9 h-9 rounded-full bg-white/95 backdrop-blur flex items-center justify-center text-xl shadow-lg">
                          {t.emoji}
                        </div>
                        <div className="absolute inset-x-3 bottom-2.5 text-white">
                          <p className="font-display font-extrabold text-sm leading-tight drop-shadow">
                            {t.name}
                          </p>
                          <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-white/80">
                            {t.category} · {t.builderState.pages.length} pages
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  {/* Thumbnail picker — tap the + tile to upload an image */}
                  {thumbnailPreviewUrl ? (
                    <div className="relative group mb-3">
                      <img
                        src={thumbnailPreviewUrl}
                        alt="Thumbnail"
                        className="w-32 h-32 rounded-3xl object-cover border-2 border-slate-200 dark:border-white/15 shadow-pop"
                      />
                      <button
                        type="button"
                        onClick={() => setThumbnailFile(null)}
                        className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-rose-500 text-white text-sm font-bold flex items-center justify-center shadow-lg hover:bg-rose-600 transition active:scale-90"
                        aria-label="Remove thumbnail"
                      >×</button>
                      <label className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 group-hover:opacity-100 transition rounded-3xl text-white text-xs font-bold cursor-pointer">
                        📸 Change
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <label
                      className="add-cover-tile relative w-28 h-28 rounded-3xl flex flex-col items-center justify-center mb-3 cursor-pointer transition group overflow-hidden"
                    >
                      {/* Pastel candy gradient bg — pops on dark, soft on light */}
                      <span
                        className="absolute inset-0 rounded-3xl"
                        style={{
                          background: 'linear-gradient(135deg, #C4B5FD 0%, #F9A8D4 45%, #FDE68A 100%)',
                          opacity: 0.92,
                        }}
                        aria-hidden="true"
                      />
                      {/* Glassy inner overlay so the gradient reads as a sticker */}
                      <span
                        className="absolute inset-0 rounded-3xl"
                        style={{
                          background: 'linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 60%)',
                        }}
                        aria-hidden="true"
                      />
                      {/* Soft inner ring */}
                      <span
                        className="absolute inset-[6px] rounded-[1.4rem] border-2 border-dashed border-white/70"
                        aria-hidden="true"
                      />
                      <span
                        className="relative z-10 w-10 h-10 rounded-full inline-flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-90"
                        style={{
                          background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                          boxShadow: '0 6px 14px -4px rgba(139,92,246,0.55)',
                        }}
                        aria-hidden="true"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </span>
                      <span
                        className="relative z-10 text-[10px] font-extrabold uppercase tracking-[0.18em] mt-2"
                        style={{ color: '#5B21B6' }}
                      >
                        Add cover
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                  )}
                  <p className="tpl-modal-title font-display text-xl font-extrabold" style={{ fontSize: '20px' }}>Blank canvas</p>
                  <p className="tpl-modal-desc text-sm mt-1 max-w-md">
                    {thumbnailPreviewUrl
                      ? '3 empty pages with your cover image. Add text, photos, stickers, and music in the editor.'
                      : '3 empty pages ready for your text, photos, stickers, and music. Tap + to add a cover image.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => { setCreationMode('starters'); setStarterFromBlank(true); }}
                    className="mt-3 text-xs font-bold text-brand-700 dark:text-fuchsia-300 hover:underline"
                  >
                    or pick a starter instead →
                  </button>
                </div>
              )}

              {/* Category selector — only relevant for the blank-website
                  flow. In starters mode the category is determined by
                  whichever starter the admin picks (pre-filled by
                  pickStarter), so showing a chooser would be redundant. */}
              {creationMode === 'blank' && (
                <div className="mt-5 pt-5 border-t border-slate-100 dark:border-white/5">
                  <p className="tpl-modal-label block text-[10px] font-extrabold uppercase tracking-[0.16em] mb-2">
                    Category
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: 'Birthday',   emoji: '🎂' },
                      { name: 'Love',       emoji: '💖' },
                      { name: 'Wedding',    emoji: '💍' },
                      { name: 'Friendship', emoji: '🫶' },
                      { name: 'Memories',   emoji: '📸' },
                    ].map((c) => {
                      const active = form.category === c.name;
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, category: c.name }))}
                          aria-pressed={active}
                          className={`tpl-modal-chip ${active ? 'is-active' : ''} inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition active:scale-95`}
                        >
                          <span>{c.emoji}</span>
                          <span>{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky footer: name + Continue */}
            <div className="tpl-modal-footer border-t border-slate-200 dark:border-white/10 backdrop-blur-sm px-6 sm:px-8 py-4">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="flex-1 min-w-0">
                  <label className="tpl-modal-label block text-[10px] font-extrabold uppercase tracking-[0.16em] mb-1">
                    Name your page
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="tpl-modal-input w-full rounded-2xl border px-4 py-2.5 text-sm font-bold transition"
                    placeholder={
                      creationMode === 'starters' && pickedStarterId
                        ? STARTER_TEMPLATES.find(t => t.id === pickedStarterId)?.name || 'Name your page'
                        : "e.g. Aarav's 25th Birthday"
                    }
                    required
                  />
                  {nameRequiredError && (
                    <p className="form-error-pill mt-2">
                      <span aria-hidden="true">⚠</span>
                      {nameRequiredError}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={dismissCreate}
                    className="tpl-modal-cancel rounded-full px-4 py-2.5 text-sm font-bold transition"
                  >
                    Cancel
                  </button>
                  <Button
                    onClick={commitStarterAndContinue}
                    disabled={creationMode === 'starters' && !pickedStarterId}
                    className="whitespace-nowrap"
                  >
                    {creationMode === 'starters'
                      ? (pickedStarterId
                          ? `Use ${STARTER_TEMPLATES.find(t => t.id === pickedStarterId)?.emoji || ''} ${STARTER_TEMPLATES.find(t => t.id === pickedStarterId)?.name || 'starter'} →`
                          : 'Pick a template above ↑')
                      : 'Open the editor →'}
                  </Button>
                </div>
              </div>
            </div>
          </motion.form>
        </motion.div>,
        document.body
      )}

      {/* Legacy modal step 2 — never renders now (we hide modal when createStep===2 or editing), but kept for any edge cases. */}
      {false && (
        <motion.div>
          <motion.form onSubmit={handleSubmit}>
            {!editing && createStep === 1 && null}

            {(editing || createStep === 2) && (
              <div className="space-y-6">
                {editing && (
                  <div className="grid sm:grid-cols-2 gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="sm:col-span-2">
                      <label className="text-xs text-zinc-500">Website name</label>
                      <input
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        className={`mt-1 ${APP_INPUT_CLASS}`}
                        required
                      />
                      {nameRequiredError && <p className="mt-1 text-xs text-red-400">{nameRequiredError}</p>}
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500">Category</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                        className={`mt-1 ${APP_SELECT_CLASS}`}
                      >
                        {['Love', 'Friendship', 'Birthday', 'Memories', 'Wedding'].map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500">Description</label>
                      <input
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        className={`mt-1 ${APP_INPUT_CLASS}`}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-zinc-500">Thumbnail</label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                        className="mt-1 w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-500/20 file:text-brand-400"
                      />
                      {(thumbnailPreviewUrl || editing?.thumbnailUrl) && (
                        <img
                          src={thumbnailPreviewUrl || editing?.thumbnailUrl}
                          alt=""
                          className="mt-2 h-20 w-28 object-cover rounded-lg border border-white/10"
                        />
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-3 mb-3 rounded-3xl border border-white/10 bg-slate-950/85 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Live story preview</p>
                      <p className="text-xs text-slate-400">Same as your published experience.</p>
                    </div>
                    <span className="rounded-full bg-brand-500/15 px-3 py-1 text-xs font-semibold text-brand-200">Live</span>
                  </div>
                  <div className="mx-auto max-w-[min(100%,380px)] rounded-[2rem] border-4 border-white/10 bg-slate-950 p-3 shadow-2xl">
                    <div className="overflow-hidden rounded-[1.5rem] bg-black">
                      {builderPreviewError ? (
                        <div className="p-4 text-sm text-amber-300/95">{builderPreviewError}</div>
                      ) : (
                        <SlideshowBuilder
                          structure={previewStructure}
                          fills={{}}
                          editable
                          dragMode={dragMode}
                          activeIndex={activePage}
                          onActiveIndexChange={setActivePage}
                          onTextSlotCommit={(slot, text) =>
                            setBuilderState((prev) => updateBuilderTextBySlot(prev, slot, text))
                          }
                          onBlockMoveCommit={(slot, x, y) =>
                            setBuilderState((prev) => updateBuilderBlockPositionBySlot(prev, slot, x, y))
                          }
                          className="w-full [&_.html-deck-root]:min-h-[min(68vh,520px)] [&_.html-deck-root]:h-auto"
                        />
                      )}
                    </div>
                  </div>
                  <p className="text-center text-[11px] text-zinc-600 mt-2">
                    Click any heading/text in the phone to edit it live. Use controls below for media, buttons, and timers.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 space-y-4">
                  <p className="text-xs font-semibold text-brand-300/90">Show timer (Instagram-style)</p>
                  <p className="text-[11px] text-slate-400">
                    Set a date and time: visitors see a countdown until then, then your message with an animation (like a birthday at midnight).
                  </p>
                  <label className="flex items-center gap-2 text-sm text-zinc-200">
                    <input
                      type="checkbox"
                      checked={normalizedBuilder.scheduledReveal.enabled}
                      onChange={(e) => patchScheduledReveal({ enabled: e.target.checked })}
                    />
                    Enable countdown &amp; celebration
                  </label>
                  <label className="flex items-start gap-2 text-sm text-zinc-200">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={normalizedBuilder.scheduledReveal.hideStoryUntilReveal}
                      onChange={(e) => patchScheduledReveal({ hideStoryUntilReveal: e.target.checked })}
                      disabled={!normalizedBuilder.scheduledReveal.enabled}
                    />
                    <span>
                      Until then, show only countdown (hide all pages)
                      <span className="block text-[11px] font-normal text-zinc-500 mt-0.5">
                        Phone preview matches the published link. Uncheck this to edit page content while the timer is still running.
                      </span>
                    </span>
                  </label>
                  {normalizedBuilder.scheduledReveal.enabled && (
                    <div className="space-y-3 border-t border-white/5 pt-3">
                      <div>
                        <label className="text-xs text-zinc-500">When (your device time zone)</label>
                        <input
                          type="datetime-local"
                          value={normalizedBuilder.scheduledReveal.targetLocal}
                          onChange={(e) => patchScheduledReveal({ targetLocal: e.target.value })}
                          className={`mt-1 w-full ${APP_INPUT_CLASS}`}
                        />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-zinc-500">Countdown title</label>
                          <input
                            value={normalizedBuilder.scheduledReveal.title}
                            onChange={(e) => patchScheduledReveal({ title: e.target.value })}
                            className={`mt-1 w-full ${APP_INPUT_CLASS}`}
                            placeholder="Countdown"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-500">Animation after</label>
                          <select
                            value={normalizedBuilder.scheduledReveal.effectAfter}
                            onChange={(e) => patchScheduledReveal({ effectAfter: e.target.value })}
                            className={`mt-1 w-full ${APP_SELECT_CLASS}`}
                          >
                            <option value="none">None</option>
                            <option value="pulse">Pulse</option>
                            <option value="bounce">Bounce</option>
                            <option value="glow">Glow</option>
                            <option value="shake">Shake</option>
                            <option value="confetti">Confetti</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500">Line under title (before time)</label>
                        <input
                          value={normalizedBuilder.scheduledReveal.subtitleBefore}
                          onChange={(e) => patchScheduledReveal({ subtitleBefore: e.target.value })}
                          className={`mt-1 w-full ${APP_INPUT_CLASS}`}
                          placeholder="Something special is coming…"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500">Message at / after that time</label>
                        <textarea
                          value={normalizedBuilder.scheduledReveal.messageAfter}
                          onChange={(e) => patchScheduledReveal({ messageAfter: e.target.value })}
                          rows={2}
                          className={`mt-1 w-full ${APP_INPUT_CLASS} resize-y min-h-[3rem]`}
                          placeholder="🎉 Happy Birthday! 🎂"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <p className="text-sm font-semibold text-white">Story controls</p>
                      <p className="text-xs text-slate-400">Page navigation, add content, and fine-tune each block.</p>
                    </div>
                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">UI only</span>
                  </div>
                  <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/90 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-zinc-500 mr-1">Pages</span>
                      {normalizedBuilder.pages.map((p, i) => (
                        <button
                          key={p.id || i}
                          type="button"
                          onClick={() => setActivePage(i)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            activePage === i ? 'bg-brand-500/35 text-white' : 'bg-slate-800/80 text-slate-200 hover:bg-slate-800/95'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={addPageQuick}
                        className="rounded-full bg-slate-800/80 px-3 py-1 text-xs font-semibold text-brand-300 hover:bg-slate-800/95"
                      >
                        + Page
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex items-center gap-2 rounded-2xl bg-slate-800/80 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800/95">
                        <input type="checkbox" checked={dragMode} onChange={(e) => setDragMode(e.target.checked)} />
                        Move mode (drag with cursor)
                      </label>
                      {[
                        ['Text', 'text'],
                        ['Heading', 'heading'],
                        ['Gallery', 'gallery'],
                        ['GIF', 'gif'],
                        ['Song', 'music'],
                        ['Button', 'button'],
                      ].map(([label, kind]) => (
                        <button
                          key={kind}
                          type="button"
                          onClick={() => addBlockQuick(kind)}
                          className="rounded-2xl bg-slate-800/80 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800/95"
                        >
                          + {label}
                        </button>
                      ))}
                      <label className="rounded-2xl bg-slate-800/80 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800/95 cursor-pointer">
                        {uploadingAsset ? 'Uploading...' : '+ Photo'}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            addUploadedMediaBlock(f, 'image');
                            e.target.value = '';
                          }}
                        />
                      </label>
                      <label className="rounded-2xl bg-slate-800/80 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800/95 cursor-pointer">
                        {uploadingAsset ? 'Uploading...' : '+ Video'}
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            addUploadedMediaBlock(f, 'video');
                            e.target.value = '';
                          }}
                        />
                      </label>
                      <label className="rounded-2xl bg-slate-800/80 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800/95 cursor-pointer">
                        {uploadingAsset ? 'Uploading...' : '+ Song upload'}
                        <input
                          type="file"
                          accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/mp4"
                          className="hidden"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            setUploadingAsset(true);
                            try {
                              const { url } = await videosAPI.uploadMedia(f);
                              const page = normalizedBuilder.pages[activePage];
                              if (!page) return;
                              const blocks = [...(page.blocks || []), { type: 'subheading', text: `🎵 ${f.name}`, songUrl: url }];
                              setPageAt(activePage, { ...page, blocks });
                              setSelectedBlockIndex(blocks.length - 1);
                            } catch (err) {
                              toast.error(err.message || 'Song upload failed');
                            } finally {
                              setUploadingAsset(false);
                              e.target.value = '';
                            }
                          }}
                        />
                      </label>
                      {(normalizedBuilder.pages[activePage]?.blocks || []).length > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              updateSelectedBlock({
                                rotateDeg:
                                  (Number(normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.rotateDeg) || 0) - 15,
                              })
                            }
                            className="rounded-2xl bg-slate-800/80 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800/95"
                          >
                            Rotate -15
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateSelectedBlock({
                                rotateDeg:
                                  (Number(normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.rotateDeg) || 0) + 15,
                              })
                            }
                            className="rounded-2xl bg-slate-800/80 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800/95"
                          >
                            Rotate +15
                          </button>
                        </>
                      )}
                    </div>

                    {normalizedBuilder.pages[activePage] && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          value={normalizedBuilder.pages[activePage].pageTitle || ''}
                          onChange={(e) => patchPage(activePage, { pageTitle: e.target.value })}
                          className={APP_INPUT_CLASS}
                          placeholder="Page title"
                        />
                        <input
                          type="number"
                          min={0}
                          max={120}
                          value={
                            normalizedBuilder.pages[activePage].pageDurationMs === '' ||
                            normalizedBuilder.pages[activePage].pageDurationMs == null
                              ? ''
                              : Math.round(Number(normalizedBuilder.pages[activePage].pageDurationMs) / 1000)
                          }
                          onChange={(e) =>
                            patchPage(activePage, {
                              pageDurationMs:
                                e.target.value === '' ? '' : Math.min(120000, Math.max(0, Number(e.target.value) * 1000)),
                            })
                          }
                          className={APP_INPUT_CLASS}
                          placeholder="Timer sec"
                        />
                        <input
                          value={normalizedBuilder.pages[activePage].pageBackground || ''}
                          onChange={(e) => patchPage(activePage, { pageBackground: e.target.value })}
                          className={APP_INPUT_CLASS}
                          placeholder="Background color (#111827)"
                        />
                      </div>
                    )}

                    {(normalizedBuilder.pages[activePage]?.blocks || []).length > 0 && (
                      <div className="rounded-lg border border-white/10 bg-black/25 p-2 space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {normalizedBuilder.pages[activePage].blocks.map((b, i) => (
                            <button
                              key={`${b.type}-${i}`}
                              type="button"
                              onClick={() => setSelectedBlockIndex(i)}
                              className={`rounded-md px-2 py-1 text-xs ${
                                selectedBlockIndex === i ? 'bg-brand-500/30 text-white' : 'bg-white/10 text-zinc-300'
                              }`}
                            >
                              {b.type} {i + 1}
                            </button>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {'text' in (normalizedBuilder.pages[activePage].blocks[selectedBlockIndex] || {}) && (
                            <textarea
                              rows={3}
                              value={normalizedBuilder.pages[activePage].blocks[selectedBlockIndex].text || ''}
                              onChange={(e) => updateSelectedBlock({ text: e.target.value })}
                              className={APP_INPUT_CLASS}
                              placeholder="Text"
                            />
                          )}
                          {'label' in (normalizedBuilder.pages[activePage].blocks[selectedBlockIndex] || {}) && (
                            <input
                              value={normalizedBuilder.pages[activePage].blocks[selectedBlockIndex].label || ''}
                              onChange={(e) => updateSelectedBlock({ label: e.target.value })}
                              className={APP_INPUT_CLASS}
                              placeholder="Label"
                            />
                          )}
                          {'navPage' in (normalizedBuilder.pages[activePage].blocks[selectedBlockIndex] || {}) && (
                            <input
                              type="number"
                              min={1}
                              max={normalizedBuilder.pages.length}
                              value={normalizedBuilder.pages[activePage].blocks[selectedBlockIndex].navPage ?? 1}
                              onChange={(e) => updateSelectedBlock({ navPage: Number(e.target.value) || 1 })}
                              className={APP_INPUT_CLASS}
                              placeholder="Navigate to page"
                            />
                          )}
                          {normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.type === 'button' && (
                            <label className="inline-flex items-center gap-2 text-xs text-zinc-400">
                              <input
                                type="checkbox"
                                checked={Boolean(normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.showAfterGallery)}
                                onChange={(e) => updateSelectedBlock({ showAfterGallery: e.target.checked })}
                              />
                              Show button only after gallery completes
                            </label>
                          )}
                          {normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.type === 'gallery' && (
                            <>
                              <input
                                type="number"
                                min={1}
                                max={12}
                                value={normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.count ?? 4}
                                onChange={(e) => updateSelectedBlock({ count: Math.min(12, Math.max(1, Number(e.target.value) || 4)) })}
                                className={APP_INPUT_CLASS}
                                placeholder="How many photos"
                              />
                              <input
                                value={normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.slotPrefix || ''}
                                onChange={(e) => updateSelectedBlock({ slotPrefix: e.target.value })}
                                className={APP_INPUT_CLASS}
                                placeholder="Gallery key prefix"
                              />
                              <select
                                value={normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.galleryAnimation || 'fade'}
                                onChange={(e) => updateSelectedBlock({ galleryAnimation: e.target.value })}
                                className={APP_SELECT_CLASS}
                              >
                                <option value="fade">Fade animation</option>
                                <option value="zoom">Zoom animation</option>
                                <option value="slide">Slide-up animation</option>
                                <option value="lanes">Two-lane opposite scroll</option>
                                <option value="autoVertical">Auto up/down (no manual scroll)</option>
                                <option value="slideshow">Single-box timed slideshow</option>
                              </select>
                              <input
                                type="number"
                                min={500}
                                max={8000}
                                step={100}
                                value={normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.photoDurationMs ?? 1200}
                                onChange={(e) => updateSelectedBlock({ photoDurationMs: Number(e.target.value) || 1200 })}
                                className={APP_INPUT_CLASS}
                                placeholder="Per photo time (ms)"
                              />
                              <input
                                type="number"
                                min={4}
                                max={60}
                                step={1}
                                value={normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.laneDurationSec ?? 14}
                                onChange={(e) => updateSelectedBlock({ laneDurationSec: Number(e.target.value) || 14 })}
                                className={APP_INPUT_CLASS}
                                placeholder="Lane speed duration (sec)"
                              />
                            </>
                          )}
                          <label className="text-xs text-zinc-400">
                            Rotate (%)
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min={-100}
                                max={100}
                                value={Math.round((Number(normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.rotateDeg) || 0) / 1.8)}
                                onChange={(e) => updateSelectedBlock({ rotateDeg: (Number(e.target.value) || 0) * 1.8 })}
                                className="w-full"
                              />
                              <input
                                type="number"
                                min={-100}
                                max={100}
                                value={Math.round((Number(normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.rotateDeg) || 0) / 1.8)}
                                onChange={(e) => updateSelectedBlock({ rotateDeg: (Number(e.target.value) || 0) * 1.8 })}
                                className="w-20 rounded bg-white/5 border border-white/10 px-2 py-1 text-xs"
                              />
                            </div>
                          </label>
                          {['image', 'gif', 'video'].includes(normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.type) && (
                            <>
                              <select
                                value={normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.mediaFit || 'cover'}
                                onChange={(e) => updateSelectedBlock({ mediaFit: e.target.value })}
                                className={APP_SELECT_CLASS}
                              >
                                <option value="cover">Cover</option>
                                <option value="contain">Contain</option>
                                <option value="fill">Fill</option>
                              </select>
                              <input
                                type="number"
                                min={0}
                                max={80}
                                value={normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.mediaRadius ?? 12}
                                onChange={(e) => updateSelectedBlock({ mediaRadius: Number(e.target.value) || 0 })}
                                className={APP_INPUT_CLASS}
                                placeholder="Corner radius"
                              />
                            </>
                          )}
                        </div>
                        <div className="flex justify-end">
                          {normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.type === 'gallery' && (
                            <div className="mr-auto w-full space-y-2">
                              <p className="text-xs text-zinc-500">
                                Slots: {Array.from({ length: Math.min(12, Math.max(1, Number(normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.count) || 4)) })
                                  .map((_, i) => `${normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.slotPrefix || 'gal'}_${i}`)
                                  .join(', ')}
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {Array.from({
                                  length: Math.min(12, Math.max(1, Number(normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.count) || 4)),
                                }).map((_, i) => {
                                  const prefix = normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.slotPrefix || 'gal';
                                  const key = `${prefix}_${i}`;
                                  const val = normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.galleryDefaults?.[key];
                                  return (
                                    <label key={key} className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-zinc-300 cursor-pointer">
                                      {val ? `Photo ${i + 1} ✓` : `Photo ${i + 1}`}
                                      <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        className="hidden"
                                        onChange={(e) => {
                                          const f = e.target.files?.[0];
                                          uploadGalleryPhotoAt(i, f);
                                          e.target.value = '';
                                        }}
                                      />
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={removeSelectedBlock}
                            className="rounded-md bg-red-500/20 px-3 py-1 text-xs text-red-300"
                          >
                            Remove selected
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {(editing || createStep === 2) && (
            <div className="flex gap-3 mt-8 flex-wrap">
              {!editing && (
                <button
                  type="button"
                  disabled={formSubmitting}
                  onClick={() => setCreateStep(1)}
                  className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 transition disabled:opacity-50 text-sm"
                >
                  ← Back
                </button>
              )}
              <button
                type="button"
                disabled={formSubmitting}
                onClick={() => setFormOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition disabled:opacity-50 disabled:pointer-events-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-pink-500 text-white font-medium hover:opacity-90 transition disabled:opacity-60 disabled:pointer-events-none"
              >
                {formSubmitting ? 'Saving…' : editing ? 'Save changes' : 'Create website'}
              </button>
            </div>
            )}
          </motion.form>
        </motion.div>
      )}
    </div>
  );
}
