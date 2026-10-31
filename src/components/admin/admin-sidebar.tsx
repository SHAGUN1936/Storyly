"use client";

// The admin menu column. On large screens it can be collapsed to icons; the choice is remembered.
// The width slides and the labels fade, while the icons stay where they are.

import { PanelLeftClose } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { AdminNav } from "./admin-nav";

const STORAGE_KEY = "storyly:admin-menu-collapsed";

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  // No animation for the remembered state on page load, only for clicks
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {}
    const frame = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const toggle = () => {
    setCollapsed((v) => {
      try {
        localStorage.setItem(STORAGE_KEY, v ? "0" : "1");
      } catch {}
      return !v;
    });
  };

  const label = collapsed ? "Expand menu" : "Collapse menu";

  return (
    <aside
      className={cn(
        "hidden lg:sticky lg:top-24 lg:block lg:shrink-0 lg:self-start lg:overflow-hidden",
        animate && "lg:transition-[width] lg:duration-300 lg:ease-[cubic-bezier(.2,.7,.2,1)]",
        collapsed ? "lg:w-11" : "lg:w-52",
      )}
    >
      <button
        type="button"
        onClick={toggle}
        title={label}
        aria-label={label}
        aria-expanded={!collapsed}
        className="mb-4 flex h-9 w-full items-center gap-2.5 overflow-hidden rounded-lg px-3.5 text-sm font-medium whitespace-nowrap text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
      >
        <PanelLeftClose
          size={16}
          className={cn("shrink-0 transition-transform duration-300", collapsed && "rotate-180")}
          aria-hidden
        />
        <span className={cn("transition-opacity duration-200", collapsed && "opacity-0")}>Collapse</span>
      </button>
      <AdminNav collapsed={collapsed} />
    </aside>
  );
}
