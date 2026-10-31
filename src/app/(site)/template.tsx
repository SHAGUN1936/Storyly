"use client";

// Wraps every website page and plays a soft fade-up each time a new page opens.
// (A template, unlike a layout, re-renders on every navigation.)

import { motion } from "motion/react";

export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
