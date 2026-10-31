"use client";

import { useEffect } from "react";

/**
 * Freezes the page behind an open dialog. Pinning <body> (rather than only overflow: hidden)
 * is what stops touch-scrolling on iOS; the scroll position is restored on close.
 */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const { body, documentElement: html } = document;
    const scrollY = window.scrollY;
    const scrollbar = Math.max(0, window.innerWidth - html.clientWidth);
    const saved = { body: body.style.cssText, overflow: html.style.overflow };

    Object.assign(body.style, {
      position: "fixed",
      top: `-${scrollY}px`,
      left: "0",
      right: `${scrollbar}px`,
      width: `calc(100% - ${scrollbar}px)`,
    });
    html.style.overflow = "hidden";

    return () => {
      body.style.cssText = saved.body;
      html.style.overflow = saved.overflow;
      // Jump back instantly; smooth scrolling here would look like the page moving on its own.
      const behavior = html.style.scrollBehavior;
      html.style.scrollBehavior = "auto";
      window.scrollTo({ top: scrollY, left: 0, behavior: "auto" });
      html.style.scrollBehavior = behavior;
    };
  }, [locked]);
}
