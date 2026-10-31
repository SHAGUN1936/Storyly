"use client";

// New template: start from a starter design, paste an HTML page, or upload a website.
// Every way creates a draft and opens the review screen.

import { AlertTriangle, Code2, FileArchive, FolderOpen, LayoutTemplate, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/form-controls";
import { cn } from "@/lib/utils";

type Result = { id: string; slots: number; warnings: string[]; usedAi: boolean };
type Starter = { id: string; name: string; category: string; description: string };
type Mode = "starter" | "html" | "upload";

const MODES: Array<{ id: Mode; label: string; icon: typeof Code2 }> = [
  { id: "starter", label: "Starter designs", icon: LayoutTemplate },
  { id: "html", label: "Paste HTML", icon: Code2 },
  { id: "upload", label: "Upload website", icon: FolderOpen },
];

export function ImportForm({ aiEnabled, starters }: { aiEnabled: boolean; starters: Starter[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("starter");
  const [files, setFiles] = useState<File[]>([]);
  const [html, setHtml] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  async function submit(form: FormData, key: string) {
    setBusy(key);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/admin/templates/import", { method: "POST", body: form });
      const data = (await res.json()) as Result & { message?: string };
      if (!res.ok) throw new Error(data.message || "Could not create the template");
      if (data.warnings.length) setResult(data);
      else router.push(`/editor/${data.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  function createFromStarter(id: string) {
    const form = new FormData();
    form.append("starter", id);
    submit(form, id);
  }

  function createFromHtml() {
    const form = new FormData();
    form.append("html", html);
    submit(form, "html");
  }

  function uploadFiles() {
    const form = new FormData();
    // Folder uploads keep each file's path inside the folder, so assets resolve
    for (const file of files) form.append("files", file, file.webkitRelativePath || file.name);
    submit(form, "upload");
  }

  const pickZone =
    "flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-300 p-6 text-center hover:bg-zinc-50";

  return (
    <div className="grid max-w-4xl gap-6">
      <div role="tablist" aria-label="How to create the template" className="flex flex-wrap gap-2">
        {MODES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => setMode(id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
              mode === id
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300",
            )}
          >
            <Icon size={16} aria-hidden /> {label}
          </button>
        ))}
      </div>

      {mode === "starter" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {starters.map((s) => (
            <Card key={s.id} className="flex flex-col">
              <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">{s.category}</p>
              <h2 className="mt-1 font-semibold text-zinc-900">{s.name}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-zinc-600">{s.description}</p>
              <Button
                className="mt-5 self-start"
                loading={busy === s.id}
                loadingLabel="Creating…"
                disabled={busy !== null}
                onClick={() => createFromStarter(s.id)}
              >
                Use this design
              </Button>
            </Card>
          ))}
        </div>
      )}

      {mode === "html" && (
        <Card>
          <h2 className="font-semibold text-zinc-900">Paste a page</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Paste a complete HTML page, for example one you generated with an AI chat. Names, dates, messages and photos
            become editable automatically.
          </p>
          <Textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            rows={14}
            spellCheck={false}
            placeholder="<!doctype html>&#10;<html>…</html>"
            className="mt-4 font-mono text-xs"
          />
          <Button
            className="mt-4"
            disabled={!html.trim() || busy !== null}
            loading={busy === "html"}
            loadingLabel="Creating…"
            onClick={createFromHtml}
          >
            Create template
          </Button>
        </Card>
      )}

      {mode === "upload" && (
        <Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={pickZone}>
              <FileArchive className="text-zinc-500" aria-hidden />
              <span className="font-medium text-zinc-900">Choose a .zip</span>
              <span className="text-xs text-zinc-500">The website zipped into one file</span>
              <input
                type="file"
                accept=".zip"
                className="sr-only"
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              />
            </label>
            <label className={pickZone}>
              <FolderOpen className="text-zinc-500" aria-hidden />
              <span className="font-medium text-zinc-900">Choose a folder</span>
              <span className="text-xs text-zinc-500">The folder containing index.html</span>
              <input
                type="file"
                multiple
                className="sr-only"
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                {...{ webkitdirectory: "", directory: "" }}
              />
            </label>
          </div>
          {files.length > 0 && (
            <p className="mt-4 text-sm text-zinc-600">
              {files.length === 1 ? files[0]!.name : `${files.length} files`} ·{" "}
              {(files.reduce((n, f) => n + f.size, 0) / 1024 / 1024).toFixed(1)} MB
            </p>
          )}
          <Button
            className="mt-5"
            disabled={!files.length || busy !== null}
            loading={busy === "upload"}
            loadingLabel={aiEnabled ? "Importing… this can take a minute" : "Importing…"}
            onClick={uploadFiles}
          >
            Import
          </Button>
          <ul className="mt-6 list-disc space-y-1.5 border-t border-zinc-100 pt-5 pl-5 text-sm text-zinc-600">
            <li>A finished website: an index.html with its CSS, JavaScript and images (max 25 MB).</li>
            <li>A built project: upload its dist, build or out folder.</li>
            <li className="flex items-start gap-1.5">
              <Sparkles size={14} className="mt-0.5 shrink-0" aria-hidden />
              <span>
                Project source code (React, Vue and others):{" "}
                {aiEnabled
                  ? "AI converts it into a page."
                  : "needs ANTHROPIC_API_KEY in .env, or upload the built folder."}
              </span>
            </li>
            <li>Only what runs in the browser works. Server code, databases, logins and payments are left out.</li>
          </ul>
        </Card>
      )}

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {result && (
        <Card className="border-amber-200">
          <p className="flex items-center gap-2 font-medium text-zinc-900">
            <AlertTriangle size={18} className="text-amber-600" aria-hidden /> Created with notes
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-600">
            {result.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          <Button className="mt-5" onClick={() => router.push(`/editor/${result.id}`)}>
            Open in editor
          </Button>
        </Card>
      )}
    </div>
  );
}
