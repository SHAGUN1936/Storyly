const fs = require('fs');

const filePath = 'c:/Users/agraw/OneDrive/Desktop/Personal/client/src/pages/Admin.jsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Find builder start
let startIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{(editing || createStep === 2) && (')) {
    startIdx = i;
    break;
  }
}

if (startIdx === -1) {
  console.error('❌ Could not find builder start');
  process.exit(1);
}

// Count brackets to find end
let depth = 0;
let endIdx = -1;
for (let i = startIdx; i < lines.length; i++) {
  const line = lines[i];
  for (const char of line) {
    if (char === '(') depth++;
    if (char === ')') depth--;
  }
  if (i > startIdx && depth === -1) {
    endIdx = i;
    break;
  }
}

if (endIdx === -1) {
  console.error('❌ Could not find builder end');
  process.exit(1);
}

console.log(`Found builder: lines ${startIdx + 1} - ${endIdx + 1}`);

// New builder code
const newBuilder = `              {(editing || createStep === 2) && (
                <div className="flex h-[calc(94vh-15rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
                  {/* Top Toolbar */}
                  <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/95 px-4 py-3">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm font-semibold text-white">{form.name || 'Untitled'}</p>
                        <p className="text-xs text-slate-400">Page {activePage + 1} of {normalizedBuilder.pages.length}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10">
                        <input type="checkbox" checked={dragMode} onChange={(e) => setDragMode(e.target.checked)} />
                        <span>Drag mode</span>
                      </label>
                      <button
                        type="button"
                        disabled={!normalizedBuilder.pages[activePage]?.blocks?.length}
                        onClick={removeSelectedBlock}
                        className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Main Content Area */}
                  <div className="flex flex-1 overflow-hidden gap-4 p-4">
                    {/* Left Sidebar - Elements & Layers */}
                    <div className="w-56 flex flex-col gap-4 overflow-y-auto border-r border-white/10 pr-4">
                      {/* Templates/Elements Section */}
                      <div>
                        <h4 className="mb-3 text-xs uppercase tracking-widest text-slate-400">Add Elements</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: '📝 Text', kind: 'text' },
                            { label: '📌 Heading', kind: 'heading' },
                            { label: '🖼️ Gallery', kind: 'gallery' },
                            { label: '🎬 GIF', kind: 'gif' },
                            { label: '🎵 Song', kind: 'music' },
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
                        </div>
                      </div>

                      {/* Media Upload */}
                      <div>
                        <h4 className="mb-3 text-xs uppercase tracking-widest text-slate-400">Media</h4>
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

                      {/* Pages/Layers */}
                      <div>
                        <h4 className="mb-3 text-xs uppercase tracking-widest text-slate-400">Pages</h4>
                        <div className="flex flex-wrap gap-2">
                          {normalizedBuilder.pages.map((p, i) => (
                            <button
                              key={p.id || i}
                              type="button"
                              onClick={() => setActivePage(i)}
                              className={\`rounded-lg px-3 py-2 text-xs font-semibold transition \${
                                activePage === i ? 'bg-brand-500 text-slate-950' : 'bg-slate-800/80 text-slate-200 hover:bg-slate-800'
                              }\`}
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

                      {/* Blocks List */}
                      {(normalizedBuilder.pages[activePage]?.blocks || []).length > 0 && (
                        <div>
                          <h4 className="mb-3 text-xs uppercase tracking-widest text-slate-400">Blocks</h4>
                          <div className="space-y-2">
                            {normalizedBuilder.pages[activePage].blocks.map((b, i) => (
                              <button
                                key={\`\${b.type}-\${i}\`}
                                type="button"
                                onClick={() => setSelectedBlockIndex(i)}
                                className={\`w-full rounded-lg px-3 py-2 text-left text-xs font-semibold transition \${
                                  selectedBlockIndex === i ? 'bg-brand-500 text-slate-950' : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
                                }\`}
                              >
                                {b.type} {i + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Center Canvas */}
                    <div className="flex-1 flex flex-col gap-3 overflow-hidden">
                      <div className="flex-1 rounded-xl border border-white/10 bg-black overflow-hidden shadow-2xl">
                        {builderPreviewError ? (
                          <div className="p-6 text-sm text-amber-300 flex items-center justify-center h-full">{builderPreviewError}</div>
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
                            className="w-full h-full [&_.html-deck-root]:h-full [&_.html-deck-root]:min-h-full"
                          />
                        )}
                      </div>
                      <p className="text-center text-xs text-slate-500">Click any text to edit • Drag to move (if drag mode enabled)</p>
                    </div>

                    {/* Right Sidebar - Properties */}
                    <div className="w-64 flex flex-col gap-4 overflow-y-auto border-l border-white/10 pl-4">
                      {editing && (
                        <div>
                          <h4 className="mb-3 text-xs uppercase tracking-widest text-slate-400">Campaign Info</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Name</label>
                              <input
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                className={\`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white \${APP_INPUT_CLASS}\`}
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
                              className={\`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white \${APP_INPUT_CLASS}\`}
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
                              className={\`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white \${APP_INPUT_CLASS}\`}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Background</label>
                            <input
                              value={normalizedBuilder.pages[activePage]?.pageBackground || ''}
                              onChange={(e) => patchPage(activePage, { pageBackground: e.target.value })}
                              className={\`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white \${APP_INPUT_CLASS}\`}
                              placeholder="#1a1a1a"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Selected Block Properties */}
                      {(normalizedBuilder.pages[activePage]?.blocks || []).length > 0 && (
                        <div>
                          <h4 className="mb-3 text-xs uppercase tracking-widest text-slate-400">Block Properties</h4>
                          <div className="space-y-3">
                            {'text' in (normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex] || {}) && (
                              <div>
                                <label className="block text-xs text-slate-400 mb-1">Text</label>
                                <textarea
                                  rows={3}
                                  value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.text || ''}
                                  onChange={(e) => updateSelectedBlock({ text: e.target.value })}
                                  className={\`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white \${APP_INPUT_CLASS}\`}
                                  placeholder="Edit text"
                                />
                              </div>
                            )}
                            {'label' in (normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex] || {}) && (
                              <div>
                                <label className="block text-xs text-slate-400 mb-1">Label</label>
                                <input
                                  value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.label || ''}
                                  onChange={(e) => updateSelectedBlock({ label: e.target.value })}
                                  className={\`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white \${APP_INPUT_CLASS}\`}
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
                                  className={\`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white \${APP_INPUT_CLASS}\`}
                                />
                              </div>
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
                                    className={\`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white \${APP_INPUT_CLASS}\`}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">Animation</label>
                                  <select
                                    value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.galleryAnimation || 'fade'}
                                    onChange={(e) => updateSelectedBlock({ galleryAnimation: e.target.value })}
                                    className={\`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white \${APP_SELECT_CLASS}\`}
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
                            {['image', 'gif', 'video'].includes(normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.type) && (
                              <div>
                                <label className="block text-xs text-slate-400 mb-1">Fit</label>
                                <select
                                  value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.mediaFit || 'cover'}
                                  onChange={(e) => updateSelectedBlock({ mediaFit: e.target.value })}
                                  className={\`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white \${APP_SELECT_CLASS}\`}
                                >
                                  <option value="cover">Cover</option>
                                  <option value="contain">Contain</option>
                                  <option value="fill">Fill</option>
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Countdown Timer */}
                      <div className="border-t border-white/10 pt-4">
                        <h4 className="mb-3 text-xs uppercase tracking-widest text-slate-400">Countdown Timer</h4>
                        <label className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-slate-200">
                          <input
                            type="checkbox"
                            checked={normalizedBuilder.scheduledReveal.enabled}
                            onChange={(e) => patchScheduledReveal({ enabled: e.target.checked })}
                          />
                          Enable
                        </label>
                        {normalizedBuilder.scheduledReveal.enabled && (
                          <div className="mt-3 space-y-3">
                            <input
                              type="datetime-local"
                              value={normalizedBuilder.scheduledReveal.targetLocal}
                              onChange={(e) => patchScheduledReveal({ targetLocal: e.target.value })}
                              className={\`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white \${APP_INPUT_CLASS}\`}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )})`.split('\n');

// Replace
const result = [
  ...lines.slice(0, startIdx),
  ...newBuilder,
  ...lines.slice(endIdx + 1)
];

fs.writeFileSync(filePath, result.join('\n'));
console.log(`✅ Replaced builder UI (lines ${startIdx + 1}-${endIdx + 1})`);
