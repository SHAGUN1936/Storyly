import express from 'express';

const router = express.Router();

/**
 * GET /api/music/search?q=...
 * Proxies the iTunes Search API (no key needed) so the browser avoids CORS.
 * Returns real songs with 30-second preview clips that play in <audio> and can
 * be trimmed/faded in the Music Engine.
 */
router.get('/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const source = String(req.query.source || 'itunes');
  if (!q) return res.json({ results: [] });
  try {
    if (source === 'archive') {
      // Internet Archive — FULL-length royalty-free / public-domain tracks.
      // Returns items; the playable file URL is resolved lazily via /resolve.
      const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(`(${q}) AND mediatype:(audio)`)}&fl[]=identifier&fl[]=title&fl[]=creator&rows=24&page=1&output=json`;
      const r = await fetch(url, { headers: { 'User-Agent': 'StorylyMusicEngine/1.0' } });
      if (!r.ok) return res.status(502).json({ message: 'Music search is unavailable right now.' });
      const data = await r.json();
      const docs = (data && data.response && Array.isArray(data.response.docs)) ? data.response.docs : [];
      const results = docs.map((d) => ({
        id: d.identifier,
        identifier: d.identifier,
        title: Array.isArray(d.title) ? d.title[0] : (d.title || d.identifier),
        artist: Array.isArray(d.creator) ? d.creator[0] : (d.creator || ''),
        artwork: `https://archive.org/services/img/${encodeURIComponent(d.identifier)}`,
        url: '',          // resolved on pick
        full: true,
        duration: 0,
      }));
      return res.json({ results });
    }

    // iTunes — any song, 30-second preview.
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=24`;
    const r = await fetch(url, { headers: { 'User-Agent': 'StorylyMusicEngine/1.0' } });
    if (!r.ok) return res.status(502).json({ message: 'Music search is unavailable right now.' });
    const data = await r.json();
    const results = (Array.isArray(data.results) ? data.results : [])
      .filter((t) => t.previewUrl)
      .map((t) => ({
        id: String(t.trackId || t.previewUrl),
        title: t.trackName || 'Track',
        artist: t.artistName || '',
        url: t.previewUrl,
        artwork: String(t.artworkUrl100 || '').replace('100x100', '200x200'),
        duration: t.trackTimeMillis ? Math.round(t.trackTimeMillis / 1000) : 30,
      }));
    res.json({ results });
  } catch {
    res.status(502).json({ message: 'Music search failed.' });
  }
});

/** Resolve an Internet Archive item to a playable audio file URL + duration. */
router.get('/resolve', async (req, res) => {
  const id = String(req.query.id || '').trim();
  if (!id) return res.status(400).json({ message: 'id required' });
  try {
    const r = await fetch(`https://archive.org/metadata/${encodeURIComponent(id)}`);
    if (!r.ok) return res.status(502).json({ message: 'Could not load that track.' });
    const m = await r.json();
    const files = Array.isArray(m.files) ? m.files : [];
    const mp3 = files.find((f) => /\.mp3$/i.test(f.name || '')) || files.find((f) => /\.ogg$/i.test(f.name || ''));
    if (!mp3) return res.status(404).json({ message: 'No playable audio in this item.' });
    const server = m.server || 'archive.org';
    const dir = m.dir || `/${id}`;
    const url = `https://${server}${dir}/${encodeURIComponent(mp3.name)}`;
    let duration = 0;
    if (mp3.length) {
      const L = String(mp3.length);
      duration = L.includes(':')
        ? L.split(':').reduce((a, b) => a * 60 + Number(b), 0)
        : Math.round(Number(L) || 0);
    }
    res.json({ url, duration, title: mp3.title || '' });
  } catch {
    res.status(502).json({ message: 'Could not load that track.' });
  }
});

/**
 * GET /api/music/stream?url=...
 * Same-origin audio proxy so the Music Engine can decode a remote preview into
 * a waveform (decodeAudioData needs CORS, which Apple's CDN doesn't send).
 * Host-allowlisted to avoid being an open proxy (SSRF).
 */
const STREAM_HOSTS = ['mzstatic.com', 'itunes.apple.com', 'apple.com', 'pixabay.com', 'cdn.pixabay.com', 'archive.org', 'us.archive.org'];
router.get('/stream', async (req, res) => {
  const raw = String(req.query.url || '');
  let host = '';
  try { host = new URL(raw).hostname; } catch { return res.status(400).end(); }
  if (!/^https:/i.test(raw) || !STREAM_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) {
    return res.status(400).json({ message: 'URL not allowed' });
  }
  try {
    const r = await fetch(raw);
    if (!r.ok) return res.status(502).end();
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Content-Type', r.headers.get('content-type') || 'audio/mpeg');
    res.send(Buffer.from(await r.arrayBuffer()));
  } catch {
    res.status(502).end();
  }
});

export default router;
