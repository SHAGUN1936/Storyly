"use client";

// Sidebar menu of the admin panel. On phones it becomes a scrollable row of tabs.
// collapsed: icons only (large screens), see <AdminSidebar>.

import {
  FileText,
  HelpCircle,
  Hash,
  Inbox,
  LayoutDashboard,
  LayoutTemplate,
  MessageSquareQuote,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { title: "", items: [{ label: "Overview", href: "/admin", icon: LayoutDashboard }] },
  {
    title: "Website",
    items: [
      { label: "FAQs", href: "/admin/website/faqs", icon: HelpCircle },
      { label: "Testimonials", href: "/admin/website/testimonials", icon: MessageSquareQuote },
      { label: "Numbers", href: "/admin/website/numbers", icon: Hash },
      { label: "Feedback", href: "/admin/feedback", icon: Inbox },
    ],
  },
  {
    title: "Product",
    items: [
      { label: "Templates", href: "/admin/templates", icon: LayoutTemplate },
      { label: "Pages", href: "/admin/pages", icon: FileText },
      { label: "Users", href: "/admin/users", icon: Users },
    ],
  },
  { title: "", items: [{ label: "Settings", href: "/admin/settings", icon: Settings }] },
];

export function AdminNav({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-5 lg:overflow-visible">
      {SECTIONS.map((section, i) => (
        <div key={i} className="flex gap-1 lg:flex-col">
          {section.title && (
            <p
              aria-hidden={collapsed}
              className={cn(
                "hidden overflow-hidden px-3.5 text-xs font-semibold tracking-wide whitespace-nowrap text-zinc-400 uppercase transition-all duration-300 lg:block",
                collapsed ? "max-h-0 pb-0 opacity-0" : "max-h-6 pb-1 opacity-100",
              )}
            >
              {section.title}
            </p>
          )}
          {section.items.map(({ label, href, icon: Icon }) => {
            const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2.5 overflow-hidden rounded-lg px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  active ? "bg-zinc-100 text-zinc-900" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
                )}
              >
                <Icon size={16} className="shrink-0" aria-hidden />
                <span className={cn("transition-opacity duration-200", collapsed && "lg:opacity-0")}>{label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
