const fs = require("fs");
const path = require("path");
const file = path.join("C:\\Users\\agraw\\OneDrive\\Desktop\\Personal\\client\\src\\pages","Admin.jsx");
let text = fs.readFileSync(file, "utf8");
const start = text.indexOf('  return (\r\n    <div className="max-w-5xl mx-auto">');
const end = text.lastIndexOf('  );\r\n}');
if (start === -1) { console.error("start not found"); process.exit(1); }
if (end === -1) { console.error("end not found"); process.exit(1); }
const newBody = `  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-[2rem] border border-slate-200/70 bg-white/95 p-8 shadow-sm mb-8"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.25em] text-brand-700 mb-3">Admin workspace</p>
            <h1 className="text-4xl font-semibold text-slate-900">Storyly website manager</h1>
            <p className="mt-4 text-slate-600 leading-7">
              Manage templates, publish campaigns, and build story-driven pages from one clean dashboard.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openCreate}
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-brand-500 to-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_60px_-30px_rgba(59,130,246,0.3)]"
          >
            + New website
          </motion.button>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.1fr]">
        <section className="glass rounded-[2rem] border border-slate-200/70 bg-white/95 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Template library</h2>
              <p className="text-sm text-slate-600">Your published and draft websites in one place.</p>
            </div>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">
              {templates.length} templates
            </div>
          </div>

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
            <div className="space-y-4">
              {templates.map((t) => (
                <motion.div
                  key={t._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-[1.75rem] border p-4 shadow-sm transition ${
                    editing?._id === t._id ? 'border-brand-300/40 bg-brand-50/70' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      {t.thumbnailUrl ? (
                        <img src={t.thumbnailUrl} alt="" className="w-20 h-14 rounded-2xl object-cover" />
                      ) : (
                        <div className="w-20 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl">🎬</div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{t.name}</h3>
                        <p className="text-sm text-slate-500">{t.category}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${t.published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                        {t.published ? 'Published' : 'Draft'}
                      </span>
                      <button
                        onClick={() => openEdit(t)}
                        className="rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200 transition"
                      >
                        Edit
                      </button>
                      {!t.published && (
                        <button
                          onClick={() => handlePublish(t._id)}
                          className="rounded-2xl bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100 transition"
                        >
                          Publish
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(t._id)}
                        className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        <section className="glass rounded-[2rem] border border-slate-200/70 bg-white/95 p-6 shadow-sm min-h-[660px]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Editor panel</h2>
              <p className="text-sm text-slate-600">Build or edit the selected website in the story-driven editor.</p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="rounded-2xl bg-brand-500/10 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100 transition"
            >
              Start new website
            </button>
          </div>

          {!formOpen ? (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-slate-700 text-lg font-semibold">No website selected</p>
              <p className="mt-3 text-sm text-slate-500 max-w-md">
                Choose a template from the left list or create a new website to begin editing in the live builder.
              </p>
              <button
                type="button"
                onClick={openCreate}
                className="mt-6 rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-95 transition"
              >
                Create new website
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {error && !nameRequiredError && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
              {success && <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}

              {!editing && createStep === 1 && (
                <div className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-sm text-slate-700 mb-2">Website name</label>
                      <input
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        className={`rounded-xl ${APP_INPUT_CLASS}`}
                        required
                      />
                      {nameRequiredError && <p className="mt-2 text-xs text-rose-600">{nameRequiredError}</p>}
                    </div>
                    <div>
                      <label className="block text-sm text-slate-700 mb-2">Category</label>
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
                      <label className="block text-sm text-slate-700 mb-2">Description</label>
                      <input
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        className={APP_INPUT_CLASS}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm text-slate-700 mb-2">Thumbnail</label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-500/10 file:text-brand-700"
                      />
                      {thumbnailPreviewUrl && (
                        <img
                          src={thumbnailPreviewUrl}
                          alt=""
                          className="mt-3 h-24 w-32 rounded-2xl object-cover border border-slate-200"
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {(editing || createStep === 2) && (
                <div className="space-y-6">
                  <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Live preview</h3>
                        <p className="text-sm text-slate-600">Interact with the page just like a visitor would.</p>
                      </div>
                      <div className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                        {editing ? 'Editing existing template' : 'Draft website'}
                      </div>
                    </div>
                    <div className="mt-4 mx-auto max-w-[min(100%,460px)] rounded-[2rem] border border-slate-200 bg-white p-2 shadow-xl">
                      <div className="overflow-hidden rounded-[1.5rem] bg-white">
                        {builderPreviewError ? (
                          <div className="p-4 text-sm text-amber-700/95 bg-amber-50 rounded-lg">{builderPreviewError}</div>
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
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <input
                        value={normalizedBuilder.pages[activePage]?.pageTitle || ''}
                        onChange={(e) => patchPage(activePage, { pageTitle: e.target.value })}
                        className={APP_INPUT_CLASS}
                        placeholder="Page title"
                      />
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
                        className={APP_INPUT_CLASS}
                        placeholder="Timer sec"
                      />
                      <input
                        value={normalizedBuilder.pages[activePage]?.pageBackground || ''}
                        onChange={(e) => patchPage(activePage, { pageBackground: e.target.value })}
                        className={APP_INPUT_CLASS}
                        placeholder="Background color"
                      />
                    </div>

                    {(normalizedBuilder.pages[activePage]?.blocks || []).length > 0 && (
                      <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-3">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {normalizedBuilder.pages[activePage].blocks.map((b, i) => (
                            <button
                              key={`${b.type}-${i}`}
                              type="button"
                              onClick={() => setSelectedBlockIndex(i)}
                              className={`rounded-full px-3 py-1 text-xs ${
                                selectedBlockIndex === i ? 'bg-brand-500/20 text-brand-700' : 'bg-white border border-slate-200 text-slate-700'
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
                        </div>
                        <div className="flex flex-wrap gap-2 justify-between items-center mt-4">
                          <button
                            type="button"
                            onClick={removeSelectedBlock}
                            className="rounded-full bg-red-50 px-4 py-2 text-xs text-red-700"
                          >
                            Remove selected block
                          </button>
                          <button
                            type="button"
                            onClick={() => setCreateStep(1)}
                            className="rounded-full bg-slate-100 px-4 py-2 text-xs text-slate-700"
                          >
                            Back to details
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3 mt-6">
                {createStep === 2 && !editing && (
                  <button
                    type="button"
                    disabled={formSubmitting}
                    onClick={() => setCreateStep(1)}
                    className="py-2.5 px-4 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 transition disabled:opacity-50"
                  >
                    ← Back
                  </button>
                )}
                <button
                  type="button"
                  disabled={formSubmitting}
                  onClick={() => setFormOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition disabled:opacity-50 disabled:pointer-events-none"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-slate-900 text-white font-medium hover:opacity-90 transition disabled:opacity-60 disabled:pointer-events-none"
                >
                  {formSubmitting ? 'Saving…' : editing ? 'Save changes' : 'Create website'}
                </button>
              </div>
            </div>
          )}
        </section>
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
    </div>
  );
}
`;
const result = text.slice(0, start) + newBody + text.slice(end);
fs.writeFileSync(file, result, 'utf8');
console.log('written');
