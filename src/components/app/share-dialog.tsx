"use client";

// Share a published page: copy its link, download or scan its QR code.

import { Check, Copy, Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getMyPageShareInfo } from "@/app/(app)/(user)/_actions/pages";
import { Spinner } from "@/components/ui/loader";
import { useScrollLock } from "@/lib/use-scroll-lock";

type ShareInfo = { shareUrl: string; qrCode: string; recipientName: string };

export function ShareDialog({ page, onClose }: { page: { id: string; title: string }; onClose: () => void }) {
  const [info, setInfo] = useState<ShareInfo | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  useScrollLock(true);

  useEffect(() => {
    getMyPageShareInfo(page.id).then((res) => (res.ok ? setInfo(res) : setError(res.message)));
  }, [page.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function copy() {
    if (!info) return;
    await navigator.clipboard.writeText(info.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-title"
    >
      <div
        className="w-full max-w-sm animate-fade-in rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="share-title" className="font-semibold text-zinc-900">
              Share page
            </h2>
            <p className="mt-0.5 truncate text-sm text-zinc-500">{page.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100"
          >
            <X size={18} />
          </button>
        </div>

        {error ? (
          <p role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : !info ? (
          <div className="flex justify-center py-16 text-zinc-500">
            <Spinner className="size-6" />
          </div>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={info.qrCode} alt="QR code for this page" className="mx-auto mt-6 size-48" />
            <div className="mt-6 flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-1.5 pl-3">
              <span className="min-w-0 flex-1 truncate text-sm text-zinc-700">{info.shareUrl}</span>
              <button
                type="button"
                onClick={copy}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-800"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <a
              href={info.qrCode}
              download={`${page.title.replace(/[^\w-]+/g, "-").toLowerCase() || "page"}-qr.png`}
              className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              <Download size={14} aria-hidden /> Download QR code
            </a>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
