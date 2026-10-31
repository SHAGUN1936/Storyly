// The one button for the whole app. Same look as a link with <ButtonLink>.
//
//   <Button>Save</Button>
//   <Button variant="ghost" size="sm">Cancel</Button>
//   <Button loading>Save</Button>                  shows a spinner and blocks clicks
//   <ButtonLink href="/signup" icon={<Sparkles size={16} />}>Get started</ButtonLink>
//
// Classes for plain links/elements: buttonClasses() in ./button-styles.

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "./button-styles";
import { Spinner } from "./loader";

export type { ButtonSize, ButtonVariant };

type OwnProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
  /** Text shown next to the spinner while loading. */
  loadingLabel?: string;
};

function Content({
  icon,
  iconRight,
  loading,
  loadingLabel = "Please wait…",
  children,
}: OwnProps & { children?: ReactNode }) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-2">
        <Spinner className="size-3.5" />
        <span>{loadingLabel}</span>
      </span>
    );
  }
  return (
    <>
      {icon && <span className="inline-flex shrink-0 items-center">{icon}</span>}
      <span className="inline-flex items-center gap-2">{children}</span>
      {iconRight && <span className="inline-flex shrink-0 items-center">{iconRight}</span>}
    </>
  );
}

export function Button({
  variant,
  size,
  icon,
  iconRight,
  loading = false,
  loadingLabel,
  disabled,
  type = "button",
  className,
  children,
  ...rest
}: OwnProps & ComponentProps<"button">) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(buttonClasses({ variant, size, className }), isDisabled && "pointer-events-none opacity-60")}
      {...rest}
    >
      <Content icon={icon} iconRight={iconRight} loading={loading} loadingLabel={loadingLabel}>
        {children}
      </Content>
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  icon,
  iconRight,
  className,
  children,
  ...rest
}: Omit<OwnProps, "loading" | "loadingLabel"> & ComponentProps<typeof Link>) {
  return (
    <Link className={buttonClasses({ variant, size, className })} {...rest}>
      <Content icon={icon} iconRight={iconRight}>
        {children}
      </Content>
    </Link>
  );
}
