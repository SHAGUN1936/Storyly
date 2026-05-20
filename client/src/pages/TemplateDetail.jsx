import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { templatesAPI, videosAPI } from '../api/api';
import SlideshowBuilder from '../components/SlideshowBuilder';
import { extractSlotsFromStructure } from '../data/exampleSlideshowTemplate';
import { normalizeBuilderState } from '../lib/visualTemplateBuilder';
import UserThemeEditor from '../components/UserThemeEditor';

export default function TemplateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customText, setCustomText] = useState('');
  const [mediaUrls, setMediaUrls] = useState([]);
  const [slotFills, setSlotFills] = useState({});
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [previewMode, setPreviewMode] = useState(true);
  /** Per-job look overrides (slideshow HTML builder only); does not change the template in the DB */
  const [themeOverrides, setThemeOverrides] = useState({});

  const structure = useMemo(() => {
    const raw = template?.structure;
    if (raw == null) return null;
    if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    return null;
  }, [template?.structure]);

  const isSlideshow = useMemo(() => {
    if (!structure) return false;
    if (structure.type && String(structure.type).toLowerCase() !== 'slideshow') return false;
    if (structure.mode === 'html' && typeof structure.html === 'string' && structure.html.trim()) return true;
    if (Array.isArray(structure.slides) && structure.slides.length > 0) return true;
    return false;
  }, [structure]);

  const slots = useMemo(() => extractSlotsFromStructure(structure), [structure]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    (async () => {
      try {
        const tpl = await templatesAPI.get(id);
        if (cancelled) return;
        setTemplate(tpl);
        if (editId) {
          try {
            const job = await videosAPI.get(editId);
            if (cancelled) return;
            const jobTplId = String(job.templateId?._id || job.templateId || '');
            if (jobTplId !== id) {
              setError('This page belongs to a different website design.');
              return;
            }
            setCustomText(job.customizations?.text || '');
            setSlotFills(job.customizations?.slots || {});
            setThemeOverrides(job.customizations?.themeOverrides && typeof job.customizations.themeOverrides === 'object'
              ? job.customizations.themeOverrides
              : {});
            const urls = job.customizations?.mediaUrls;
            setMediaUrls(Array.isArray(urls) ? urls : []);
          } catch {
            if (!cancelled) setError('Could not load your saved page for editing.');
          }
        } else {
          setThemeOverrides({});
        }
      } catch {
        if (!cancelled) setTemplate(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, editId]);

  const uploadFiles = async (files) => {
    const urls = [];
    for (const file of files) {
      const { url } = await videosAPI.uploadMedia(file);
      urls.push(url);
    }
    return urls;
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setError('');
    try {
      const urls = await uploadFiles(files);
      setMediaUrls((prev) => [...prev, ...urls]);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSlotUpload = async (slotKey, e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setError('');
    try {
      const urls = await uploadFiles(files);
      setSlotFills((prev) => ({ ...prev, [slotKey]: urls[0] }));
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeMedia = (index) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    setError('');
    setGenerating(true);
    try {
      const allMedia = isSlideshow
        ? [...Object.values(slotFills).filter(Boolean), ...mediaUrls]
        : mediaUrls;

      if (editId) {
        await videosAPI.update(editId, {
          customizations: {
            text: customText,
            mediaUrls: allMedia,
            slots: isSlideshow ? slotFills : undefined,
            ...(isSlideshow && structure?.builderState ? { themeOverrides } : {}),
          },
        });
        if (!isSlideshow) {
          await videosAPI.process(editId);
        }
        navigate('/my-videos');
        return;
      }

      const { _id: jobId } = await videosAPI.createJob({
        templateId: id,
        customizations: {
          text: customText,
          mediaUrls: allMedia,
          slots: isSlideshow ? slotFills : undefined,
          ...(isSlideshow && structure?.builderState ? { themeOverrides } : {}),
        },
      });
      await videosAPI.process(jobId);
      navigate('/my-videos');
    } catch (err) {
      setError(err.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const renderSlotField = (spec) => {
    const label = spec.label || spec.id;
    if (spec.kind === 'text') {
      return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <label className="block text-sm font-medium text-zinc-300 mb-2">{label}</label>
          <textarea
            value={slotFills[spec.id] || ''}
            onChange={(e) => setSlotFills((p) => ({ ...p, [spec.id]: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-zinc-200 focus:border-brand-500 outline-none resize-y"
            placeholder="Text for this slot"
          />
        </div>
      );
    }
    if (spec.kind === 'button') {
      return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <label className="block text-sm font-medium text-zinc-300 mb-2">{label}</label>
          <input
            type="text"
            value={slotFills[spec.id] || ''}
            onChange={(e) => setSlotFills((p) => ({ ...p, [spec.id]: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-zinc-200 focus:border-brand-500 outline-none"
            placeholder="Button label"
          />
        </div>
      );
    }
    if (spec.kind === 'audio') {
      const slot = spec.id;
      return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <label className="block text-sm font-medium text-zinc-300 mb-2">{label}</label>
          <p className="text-xs text-zinc-500 mb-2">Upload audio (optional if the page has a default).</p>
          {slotFills[slot] ? (
            <div className="flex items-center gap-2 text-sm text-zinc-300">
              <audio src={slotFills[slot]} controls className="max-w-full" />
              <button
                type="button"
                onClick={() => setSlotFills((p) => {
                  const n = { ...p };
                  delete n[slot];
                  return n;
                })}
                className="text-red-400"
              >
                Remove
              </button>
            </div>
          ) : (
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/15">
              Upload audio
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => handleSlotUpload(slot, e)}
              />
            </label>
          )}
        </div>
      );
    }
    const accept = spec.kind === 'video' ? 'video/*' : 'image/*,video/*';
    const slot = spec.id;
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <label className="block text-sm font-medium text-zinc-300 mb-2">{label}</label>
        {slotFills[slot] ? (
          <div className="relative inline-block">
            {slotFills[slot].match(/\.(mp4|webm|mov)$/i) ? (
              <video src={slotFills[slot]} className="max-h-40 rounded-lg" />
            ) : (
              <img src={slotFills[slot]} alt="" className="max-h-40 rounded-lg" />
            )}
            <button
              type="button"
              onClick={() => setSlotFills((p) => {
                const n = { ...p };
                delete n[slot];
                return n;
              })}
              className="absolute -right-2 -top-2 rounded-full bg-red-500 px-2 text-xs text-white"
            >
              ×
            </button>
          </div>
        ) : (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/15">
            {uploading ? 'Uploading...' : 'Choose file'}
            <input
              type="file"
              accept={accept}
              className="hidden"
              disabled={uploading}
              onChange={(e) => handleSlotUpload(slot, e)}
            />
          </label>
        )}
      </div>
    );
  };

  if (loading || !template) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid lg:grid-cols-2 gap-8"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-white">{template.name}</h1>
            {editId && (
              <span className="rounded-lg bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-300">
                Editing existing page
              </span>
            )}
          </div>
          <p className="text-zinc-400 text-sm mb-4">
            {template.category} • {template.description || 'Personalize with your media'}
            {isSlideshow && (
              <span className="ml-2 rounded bg-brand-500/20 px-2 py-0.5 text-xs text-brand-400">
                Mini-site (shared page)
              </span>
            )}
          </p>

          {previewMode && template.previewVideoUrl && (
            <div className="rounded-2xl overflow-hidden glass mb-6">
              <video src={template.previewVideoUrl} controls className="w-full aspect-video" />
              <p className="p-3 text-sm text-zinc-500 text-center">Preview video</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Custom message (optional)</label>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder={isSlideshow ? 'Optional note for yourself…' : 'Add a message for your video...'}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none resize-none h-24"
                maxLength={500}
              />
            </div>

            {isSlideshow ? (
              <div className="space-y-4">
                <p className="text-sm text-zinc-500">
                  This design is a <strong className="text-zinc-400">personal mini-site</strong> (not a rendered video).
                  Fill the fields it needs; you&apos;ll get a shareable link and QR code.
                </p>
                {structure?.builderState && (
                  <UserThemeEditor
                    pages={normalizeBuilderState(structure.builderState).pages}
                    value={themeOverrides}
                    onChange={setThemeOverrides}
                  />
                )}
                {structure?.mode === 'html' && slots.pages && slots.pages.length > 1
                  ? slots.pages.map((page) => (
                      <div
                        key={page.index}
                        className="rounded-2xl border border-brand-500/25 bg-black/25 p-4 space-y-4"
                      >
                        <h4 className="text-sm font-semibold text-brand-300">{page.title}</h4>
                        {(page.slots || []).map((spec) => (
                          <div key={spec.id}>{renderSlotField(spec)}</div>
                        ))}
                      </div>
                    ))
                  : slots.ordered && slots.ordered.length > 0
                  ? slots.ordered.map((spec) => <div key={spec.id}>{renderSlotField(spec)}</div>)
                  : (
                    <>
                      {[...slots.imageSlots, ...slots.videoSlots].map((slot) => (
                        <div key={slot} className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <label className="block text-sm font-medium text-zinc-300 mb-2 capitalize">
                            {slot.replace(/([A-Z])/g, ' $1').trim()} (image or video)
                          </label>
                          {slotFills[slot] ? (
                            <div className="relative inline-block">
                              {slotFills[slot].match(/\.(mp4|webm|mov)$/i) ? (
                                <video src={slotFills[slot]} className="max-h-40 rounded-lg" />
                              ) : (
                                <img src={slotFills[slot]} alt="" className="max-h-40 rounded-lg" />
                              )}
                              <button
                                type="button"
                                onClick={() => setSlotFills((p) => { const n = { ...p }; delete n[slot]; return n; })}
                                className="absolute -right-2 -top-2 rounded-full bg-red-500 px-2 text-xs text-white"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/15">
                              {uploading ? 'Uploading...' : 'Choose file'}
                              <input
                                type="file"
                                accept="image/*,video/*"
                                className="hidden"
                                disabled={uploading}
                                onChange={(e) => handleSlotUpload(slot, e)}
                              />
                            </label>
                          )}
                        </div>
                      ))}
                      {slots.textSlots?.map((slot) => (
                        <div key={slot} className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <label className="block text-sm font-medium text-zinc-300 mb-2 capitalize">
                            {slot.replace(/([A-Z])/g, ' $1').trim()}
                          </label>
                          <textarea
                            value={slotFills[slot] || ''}
                            onChange={(e) => setSlotFills((p) => ({ ...p, [slot]: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-zinc-200 focus:border-brand-500 outline-none resize-y"
                          />
                        </div>
                      ))}
                      {slots.audioSlots.map((slot) => (
                        <div key={slot} className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <label className="block text-sm font-medium text-zinc-300 mb-2">Background music ({slot})</label>
                          <p className="text-xs text-zinc-500 mb-2">Optional — this design may include a default track.</p>
                          {slotFills[slot] ? (
                            <div className="flex items-center gap-2 text-sm text-zinc-300">
                              <audio src={slotFills[slot]} controls className="max-w-full" />
                              <button
                                type="button"
                                onClick={() => setSlotFills((p) => { const n = { ...p }; delete n[slot]; return n; })}
                                className="text-red-400"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/15">
                              Upload MP3 audio
                              <input
                                type="file"
                                accept="audio/*"
                                className="hidden"
                                disabled={uploading}
                                onChange={(e) => handleSlotUpload(slot, e)}
                              />
                            </label>
                          )}
                        </div>
                      ))}
                    </>
                  )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Photos / Videos</label>
                <div className="flex flex-wrap gap-3 mb-3">
                  {mediaUrls.map((url, i) => (
                    <div key={i} className="relative group">
                      {url.match(/\.(mp4|webm|mov)$/i) ? (
                        <video src={url} className="w-20 h-20 object-cover rounded-lg" muted />
                      ) : (
                        <img src={url} alt="" className="w-20 h-20 object-cover rounded-lg" />
                      )}
                      <button
                        type="button"
                        onClick={() => removeMedia(i)}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition">
                  <span className="text-sm">{uploading ? 'Uploading...' : 'Upload media'}</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    disabled={uploading}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-3 pt-4 flex-wrap">
              {editId && (
                <Link
                  to="/my-videos"
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-zinc-300 hover:bg-white/10 transition"
                >
                  Cancel
                </Link>
              )}
              <button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition"
              >
                {previewMode ? 'Hide preview' : 'Show preview'}
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerate}
                disabled={generating}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-pink-500 text-white font-medium hover:opacity-90 disabled:opacity-50 transition"
              >
                {generating
                  ? editId
                    ? 'Saving…'
                    : 'Publishing…'
                  : editId
                    ? isSlideshow
                      ? 'Save changes'
                      : 'Save & re-render video'
                    : isSlideshow
                      ? 'Publish & get share link'
                      : 'Generate video'}
              </motion.button>
            </div>
          </div>
        </div>

        <div className="lg:pl-4 min-h-0">
          <div className="glass rounded-2xl p-6 sticky top-24 max-h-[calc(100vh-5.5rem)] overflow-y-auto overflow-x-hidden overscroll-contain">
            <h3 className="font-semibold text-white mb-3">Live preview</h3>
            <p className="text-sm text-zinc-500 mb-4">
              {isSlideshow
                ? 'Same as the published link: one full screen at a time. Use Next/Prev below the preview or the buttons on the page to move between screens.'
                : 'Your video will follow this layout with your uploaded media and text.'}
            </p>
            {isSlideshow && previewMode ? (
              <SlideshowBuilder
                structure={structure}
                fills={slotFills}
                themeOverrides={structure?.builderState ? themeOverrides : {}}
                className="shadow-xl"
                editable
                alwaysShowStoryDuringCountdown
              />
            ) : !isSlideshow && mediaUrls.length > 0 ? (
              <div className="aspect-video rounded-xl overflow-hidden bg-dark-700">
                {mediaUrls[0].match(/\.(mp4|webm|mov)$/i) ? (
                  <video src={mediaUrls[0]} controls className="w-full h-full object-contain" />
                ) : (
                  <img src={mediaUrls[0]} alt="Preview" className="w-full h-full object-cover" />
                )}
              </div>
            ) : (
              <div className="aspect-video rounded-xl bg-white/5 flex items-center justify-center text-zinc-500 text-sm">
                {isSlideshow ? 'Fill slots on the left to see images' : 'Upload media to see preview'}
              </div>
            )}
            {customText && (
              <p className="mt-3 text-sm text-zinc-400 p-2 rounded-lg bg-white/5">&quot;{customText}&quot;</p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
