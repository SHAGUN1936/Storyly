"use client";

// Toast messages: import { toast } from "sonner"; toast.success("Saved").
// They sit below the header, close after 1.5s, and close on any click.

import { useEffect } from "react";
import { Toaster, toast } from "sonner";

export function Toasts() {
  useEffect(() => {
    const dismissAll = () => toast.dismiss();
    // Wait a frame so the click that opened a toast doesn't close it straight away
    const frame = requestAnimationFrame(() => document.addEventListener("pointerdown", dismissAll));
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", dismissAll);
    };
  }, []);

  return (
    <Toaster
      position="top-center"
      offset="5rem"
      duration={1500}
      richColors
      toastOptions={{ style: { borderRadius: "10px", fontFamily: "var(--font-inter), system-ui, sans-serif" } }}
    />
  );
}
