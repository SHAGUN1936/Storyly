import { ArrowUpRight, Check, FileText, KeyRound, Mail, ShieldCheck, UserRound } from "lucide-react";
import { buttonClasses } from "@/components/ui/button-styles";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type { Metadata } from "next";
import Link from "next/link";
import { changePassword, updateProfile } from "@/app/(app)/(user)/_actions/account";
import { AccountNav, ConnectGoogle, LikedCount } from "@/components/app/account-parts";
import { ActionForm, SubmitButton } from "@/components/ui/action-form";
import { Field, Input, PasswordInput } from "@/components/ui/form-controls";
import { Container } from "@/components/ui/section";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { listMyPages } from "@/server/pages";

export const metadata: Metadata = { title: "Account" };

const ROLE_LABEL = { user: "Member", builder: "Builder", admin: "Admin" } as const;
const STATUS_LABEL = {
  draft: "Draft",
  pending: "Waiting",
  processing: "Processing",
  completed: "Published",
  failed: "Failed",
};

/** A titled block in the account page, with an anchor the side menu jumps to. */
function Panel({
  id,
  icon,
  title,
  text,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white">
      <header className="flex items-start gap-3 border-b border-zinc-100 px-6 py-5">
        <span className="mt-0.5 text-zinc-400 [&_svg]:size-5" aria-hidden>
          {icon}
        </span>
        <div>
          <h2 className="font-semibold text-zinc-900">{title}</h2>
          <p className="mt-0.5 text-sm text-zinc-500">{text}</p>
        </div>
      </header>
      <div className="px-6 py-6">{children}</div>
    </section>
  );
}

export default async function AccountPage() {
  const me = await requireUser();
  const [account, pages] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: me.id }, select: { password: true, googleId: true, createdAt: true } }),
    listMyPages(me.id),
  ]);
  const hasPassword = Boolean(account.password);
  const published = pages.filter((p) => p.status === "completed").length;
  const drafts = pages.filter((p) => p.status === "draft").length;
  const initials = me.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const memberSince = account.createdAt.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const stats = [
    { label: "Pages made", value: pages.length },
    { label: "Published", value: published },
    { label: "Drafts", value: drafts },
  ];

  return (
    <>
      {/* Profile band */}
      <div className="bg-zinc-950 text-white">
        <Container className="pt-12 pb-24">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-white text-2xl font-semibold text-zinc-950">
              {initials || "U"}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl font-semibold">{me.name}</h1>
                <span className="rounded-full border border-white/20 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
                  {ROLE_LABEL[me.role]}
                </span>
              </div>
              <p className="mt-1 text-zinc-400">
                {me.email} · Member since {memberSince}
              </p>
            </div>
          </div>
        </Container>
      </div>

      <Container className="-mt-14 pb-16">
        {/* Numbers overlapping the band */}
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-200 shadow-lg shadow-zinc-900/5 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white px-6 py-5">
              <dt className="text-sm text-zinc-500">{s.label}</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900">{s.value}</dd>
            </div>
          ))}
          <div className="bg-white px-6 py-5">
            <dt className="text-sm text-zinc-500">Liked templates</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900">
              <LikedCount />
            </dd>
          </div>
        </dl>

        <div className="mt-10 grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)]">
          <AccountNav />

          <div className="space-y-6">
            <Panel id="profile" icon={<UserRound />} title="Profile" text="How you appear on Storyly.">
              <ActionForm action={updateProfile} className="grid gap-4 sm:grid-cols-2">
                <Field label="Name">
                  <Input name="name" defaultValue={me.name} required maxLength={80} autoComplete="name" />
                </Field>
                <Field label="Email" hint="Used to sign in. It can't be changed.">
                  <Input value={me.email} disabled readOnly className="bg-zinc-50 text-zinc-500" />
                </Field>
                <div className="sm:col-span-2">
                  <SubmitButton size="md">Save profile</SubmitButton>
                </div>
              </ActionForm>
            </Panel>

            <Panel id="security" icon={<ShieldCheck />} title="Sign-in & security" text="The ways you can sign in.">
              <ul className="grid gap-3 sm:grid-cols-2">
                <SignInMethod icon={<Mail />} name="Email & password" connected={hasPassword} />
                <SignInMethod icon={<KeyRound />} name="Google" connected={Boolean(account.googleId)} />
              </ul>
              {!account.googleId && (
                <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl bg-zinc-50 px-4 py-3">
                  <p className="flex-1 text-sm text-zinc-600">Connect Google to sign in with one click.</p>
                  <ConnectGoogle />
                </div>
              )}

              <div className="mt-6 border-t border-zinc-100 pt-6">
                <h3 className="text-sm font-semibold text-zinc-900">
                  {hasPassword ? "Change password" : "Add a password"}
                </h3>
                {!hasPassword && (
                  <p className="mt-1 text-sm text-zinc-500">Add one to sign in with your email as well as Google.</p>
                )}
                <ActionForm action={changePassword} resetOnSuccess className="mt-4 grid gap-4 sm:grid-cols-2">
                  {hasPassword && (
                    <Field label="Current password">
                      <PasswordInput name="currentPassword" autoComplete="current-password" required />
                    </Field>
                  )}
                  <Field label="New password" hint="At least 6 characters.">
                    <PasswordInput name="newPassword" autoComplete="new-password" minLength={6} required />
                  </Field>
                  <div className="sm:col-span-2">
                    <SubmitButton size="md" variant="secondary">
                      {hasPassword ? "Update password" : "Add password"}
                    </SubmitButton>
                  </div>
                </ActionForm>
              </div>
            </Panel>

            <Panel id="pages" icon={<FileText />} title="Recent pages" text="Your latest work.">
              {pages.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  Nothing yet.{" "}
                  <Link href="/studio" className="font-medium text-zinc-900 underline underline-offset-4">
                    Start your first page
                  </Link>
                  .
                </p>
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {pages.slice(0, 5).map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-zinc-900">{p.template?.name ?? "Untitled page"}</p>
                        <p className="text-xs text-zinc-500">
                          {p.recipientName ? `For ${p.recipientName} · ` : ""}
                          {p.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
                          p.status === "completed" ? "bg-zinc-900 text-white" : "border border-zinc-200 text-zinc-600",
                        )}
                      >
                        {STATUS_LABEL[p.status]}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/my-videos"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-zinc-900 hover:underline"
              >
                All pages <ArrowUpRight size={14} aria-hidden />
              </Link>
            </Panel>

            <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-6 py-5">
              <div>
                <h2 className="font-semibold text-zinc-900">Sign out</h2>
                <p className="mt-0.5 text-sm text-zinc-500">Sign out of Storyly on this device.</p>
              </div>
              <SignOutButton icon className={buttonClasses({ variant: "secondary" })} />
            </section>
          </div>
        </div>
      </Container>
    </>
  );
}

function SignInMethod({ icon, name, connected }: { icon: React.ReactNode; name: string; connected: boolean }) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3">
      <span className="text-zinc-500 [&_svg]:size-[18px]" aria-hidden>
        {icon}
      </span>
      <span className="flex-1 text-sm font-medium text-zinc-900">{name}</span>
      {connected ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-900">
          <Check size={14} aria-hidden /> Connected
        </span>
      ) : (
        <span className="text-xs text-zinc-400">Not set up</span>
      )}
    </li>
  );
}
