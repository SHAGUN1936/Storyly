/**
 * Legacy slideshow JSON example (optional). New templates use Admin → HTML with data-slot / data-text-slot.
 */
export const EXAMPLE_BIRTHDAY_SLIDESHOW = {
  version: 1,
  type: 'slideshow',
  theme: {
    background: 'linear-gradient(135deg, #ff9a9e, #fad0c4)',
    textColor: '#ffffff',
    fontFamily: 'Arial, sans-serif',
  },
  slides: [
    {
      id: 's1',
      items: [
        { kind: 'title', text: '🎉 Hey! Surprise 🎉' },
        { kind: 'text', text: 'Someone special has something for you...' },
        { kind: 'button', action: 'next', label: 'Click Me 💖' },
      ],
    },
    {
      id: 's2',
      items: [
        { kind: 'image', slot: 'photo1', width: 250, borderRadius: 15 },
        { kind: 'title', text: 'Memories ❤️' },
        { kind: 'text', text: 'Yeh moment kabhi nahi bhoolenge...' },
        { kind: 'button', action: 'next', label: 'Next ➡️' },
      ],
    },
    {
      id: 's3',
      items: [
        { kind: 'image', slot: 'photo2', width: 250, borderRadius: 15 },
        { kind: 'title', text: 'More Memories 📸' },
        { kind: 'text', text: 'Har pal special hai 💫' },
        { kind: 'button', action: 'next', label: 'Next ➡️' },
      ],
    },
    {
      id: 's4',
      items: [
        { kind: 'title', text: '🎂 Happy Birthday 🎂' },
        { kind: 'text', text: 'Wish you lots of happiness and success 💖' },
        { kind: 'button', action: 'playMusic', label: 'Play Music 🎵' },
      ],
    },
  ],
  audio: {
    slot: 'music1',
    defaultUrl: 'https://www.bensound.com/bensound-music/bensound-happyrock.mp3',
  },
};

export function extractSlotsFromStructure(structure) {
  const empty = {
    imageSlots: [],
    videoSlots: [],
    audioSlots: [],
    textSlots: [],
    buttonSlots: [],
    ordered: null,
    pages: null,
  };
  const typeOk = !structure?.type || String(structure.type).toLowerCase() === 'slideshow';
  if (!structure || !typeOk) return empty;

  /* JSON-mode templates carry only a `builderState` tree — derive
     synthesized slot entries from each page's blocks so the
     customize wizard can render its per-page edit controls. Slot ids
     here match the data-* attributes emitted by visualTemplateBuilder
     for the renderer, so a wizard write to slotFills[id] lands on
     the right element. */
  const bs = structure.builderState;
  if (bs && Array.isArray(bs.pages) && bs.pages.length) {
    const imageSlots = [];
    const videoSlots = [];
    const textSlots = [];
    const buttonSlots = [];
    const audioSlots = [];
    const pages = bs.pages.map((page, pageIndex) => {
      const pageNum = pageIndex + 1;
      const blockSlots = [];
      (page.blocks || []).forEach((block, blockIndex) => {
        if (!block || typeof block !== 'object') return;
        const t = String(block.type || '').toLowerCase();
        if (t === 'heading') {
          const id = `p${pageNum}_h_${blockIndex}`;
          textSlots.push(id);
          blockSlots.push({ id, kind: 'text', label: 'Heading', placeholder: block.text || 'Heading' });
        } else if (t === 'subheading') {
          const id = `p${pageNum}_h2_${blockIndex}`;
          textSlots.push(id);
          blockSlots.push({ id, kind: 'text', label: 'Subheading', placeholder: block.text || 'Subheading' });
        } else if (t === 'text' || t === 'paragraph') {
          const id = `p${pageNum}_t_${blockIndex}`;
          textSlots.push(id);
          blockSlots.push({ id, kind: 'text', label: 'Text', placeholder: block.text || 'Text' });
        } else if (t === 'image' || t === 'photo') {
          const id = `p${pageNum}_${block.slotKey || `img_${blockIndex}`}`;
          imageSlots.push(id);
          blockSlots.push({ id, kind: 'image', label: block.label || 'Photo' });
        } else if (t === 'gif') {
          const id = `p${pageNum}_${block.slotKey || `gif_${blockIndex}`}`;
          imageSlots.push(id);
          blockSlots.push({ id, kind: 'image', label: block.label || 'GIF' });
        } else if (t === 'video') {
          const id = `p${pageNum}_${block.slotKey || `vid_${blockIndex}`}`;
          videoSlots.push(id);
          blockSlots.push({ id, kind: 'video', label: block.label || 'Video' });
        } else if (t === 'button') {
          const id = `p${pageNum}_btn_${blockIndex}`;
          buttonSlots.push(id);
          blockSlots.push({ id, kind: 'button', label: 'Button' });
        }
      });
      return { index: pageIndex, title: page.title || page.name || `Page ${pageNum}`, slots: blockSlots };
    });
    return { imageSlots, videoSlots, audioSlots, textSlots, buttonSlots, ordered: null, pages };
  }

  if (structure.mode === 'html' && Array.isArray(structure.slots)) {
    const imageSlots = [];
    const videoSlots = [];
    const audioSlots = [];
    const textSlots = [];
    const buttonSlots = [];
    for (const s of structure.slots) {
      if (s.kind === 'video') videoSlots.push(s.id);
      else if (s.kind === 'audio') audioSlots.push(s.id);
      else if (s.kind === 'text') textSlots.push(s.id);
      else if (s.kind === 'button') buttonSlots.push(s.id);
      else imageSlots.push(s.id);
    }
    const pages =
      Array.isArray(structure.pages) && structure.pages.length > 0
        ? structure.pages
        : [{ index: 0, title: 'Content', slots: structure.slots }];
    return {
      imageSlots,
      videoSlots,
      audioSlots,
      textSlots,
      buttonSlots,
      ordered: structure.slots,
      pages,
    };
  }

  if (!Array.isArray(structure.slides)) return empty;

  const imageSlots = new Set();
  const videoSlots = new Set();
  for (const slide of structure.slides) {
    for (const item of slide.items || []) {
      if (item.kind === 'image' && item.slot) imageSlots.add(item.slot);
      if (item.kind === 'video' && item.slot) videoSlots.add(item.slot);
    }
  }
  const audioSlots = structure.audio?.slot ? [structure.audio.slot] : [];
  return {
    imageSlots: [...imageSlots],
    videoSlots: [...videoSlots],
    audioSlots,
    textSlots: [],
    buttonSlots: [],
    ordered: null,
    pages: null,
  };
}
