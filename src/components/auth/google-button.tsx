"use client";

// "Sign in with Google" button (Google Identity Services).
// Hidden when NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set.

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type GoogleIdentity = {
  accounts: {
    id: {
      initialize(options: { client_id: string; callback: (response: { credential: string }) => void }): void;
      renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function GoogleButton({ onCredential }: { onCredential: (credential: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  // Keep the latest callback without re-rendering Google's button
  const callback = useRef(onCredential);
  callback.current = onCredential;

  useEffect(() => {
    const google = window.google;
    if (!clientId || !container.current || !google?.accounts?.id) return;
    google.accounts.id.initialize({ client_id: clientId, callback: (res) => callback.current(res.credential) });
    google.accounts.id.renderButton(container.current, {
      theme: "outline",
      size: "large",
      width: 384,
      type: "standard",
      shape: "rectangular",
      text: "continue_with",
    });
  }, [scriptReady]);

  if (!clientId) return null;

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div ref={container} className="flex min-h-[44px] justify-center [&>div]:w-full" />
    </>
  );
}
