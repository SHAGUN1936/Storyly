import { ArrowRight, HelpCircle, Hash, LayoutTemplate, MessageSquareQuote, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-ui";
import { Card, IconBadge } from "@/components/ui/card";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Overview" };

export default async function AdminOverviewPage() {
  const [users, templates, pages, faqs, testimonials, stats] = await Promise.all([
    db.user.count(),
    db.template.count(),
    db.page.count(),
    db.faq.count(),
    db.testimonial.count(),
    db.siteStat.count(),
  ]);

  const numbers = [
    { label: "Users", value: users, icon: Users },
    { label: "Templates", value: templates, icon: LayoutTemplate },
    { label: "Pages made", value: pages, icon: LayoutTemplate },
  ];

  const website = [
    { label: "FAQs", href: "/admin/website/faqs", icon: HelpCircle, saved: faqs },
    { label: "Testimonials", href: "/admin/website/testimonials", icon: MessageSquareQuote, saved: testimonials },
    { label: "Numbers", href: "/admin/website/numbers", icon: Hash, saved: stats },
  ];

  return (
    <>
      <AdminHeader title="Overview" description="Your platform at a glance, and the website content you can edit." />

      <dl className="grid gap-4 sm:grid-cols-3">
        {numbers.map(({ label, value, icon: Icon }) => (
          <Card key={label} padding="sm" className="flex items-center gap-4">
            <IconBadge>
              <Icon aria-hidden />
            </IconBadge>
            <div>
              <dt className="text-sm text-zinc-500">{label}</dt>
              <dd className="text-2xl font-semibold text-zinc-900">{value.toLocaleString("en-IN")}</dd>
            </div>
          </Card>
        ))}
      </dl>

      <h2 className="mt-10 mb-4 font-semibold text-zinc-900">Website content</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {website.map(({ label, href, icon: Icon, saved }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs transition-colors hover:border-zinc-300"
          >
            <div className="flex items-center justify-between">
              <IconBadge>
                <Icon aria-hidden />
              </IconBadge>
              <ArrowRight size={16} className="text-zinc-400 group-hover:text-zinc-900" aria-hidden />
            </div>
            <p className="mt-4 font-semibold text-zinc-900">{label}</p>
            <p className="text-sm text-zinc-500">
              {saved
                ? `${saved} saved`
                : label === "FAQs"
                  ? "Showing starting content"
                  : "None yet (hidden on the site)"}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
