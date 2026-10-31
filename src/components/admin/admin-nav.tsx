"use client";

// The admin menu: the sidebar on large screens (collapsible to icons, see <AdminSidebar>)
// and the side drawer on phones and tablets (see <AdminMobileMenu>).

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

export function AdminNav({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="flex flex-col gap-5">
      {SECTIONS.map((section, i) => (
        <div key={i} className="flex flex-col gap-1">
          {section.title && (
            <p
              aria-hidden={collapsed}
              className={cn(
                "overflow-hidden px-3.5 text-xs font-semibold tracking-wide whitespace-nowrap text-zinc-400 uppercase transition-all duration-300",
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
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-3 overflow-hidden rounded-lg px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors lg:py-2",
                  active ? "bg-zinc-100 text-zinc-900" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
                )}
              >
                <Icon size={16} className="shrink-0" aria-hidden />
                <span className={cn("transition-opacity duration-200", collapsed && "opacity-0")}>{label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
