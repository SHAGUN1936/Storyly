"use client";

// A <form> wired to a server action, with a loading state and a success/error message.
//
//   <ActionForm action={saveFaq}>
//     <Field label="Question"><Input name="question" /></Field>
//     <SubmitButton>Save</SubmitButton>
//   </ActionForm>
//
// The action must look like: async (prevState: ActionState, formData: FormData) => ActionState
// Success shows as a toast; errors show under the form.

import { createContext, startTransition, useActionState, useContext, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import type { ActionState } from "@/lib/action";
import { cn } from "@/lib/utils";
import { Button, type ButtonSize, type ButtonVariant } from "./button";
import { ConfirmDialog } from "./confirm-dialog";

type FormAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

const PendingContext = createContext<boolean | null>(null);

export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
}: {
  action: FormAction;
  children: React.ReactNode;
  className?: string;
  /** Clear the inputs after a successful save (true for "add" forms). */
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state?.ok) return;
    toast.success(state.message);
    if (resetOnSuccess) formRef.current?.reset();
  }, [state, resetOnSuccess]);

  // Submit manually so React does not clear the form when there is a validation error
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <PendingContext.Provider value={pending}>
      <form ref={formRef} onSubmit={handleSubmit} className={className}>
        {children}
        {state && !state.ok && (
          <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.message}
          </p>
        )}
      </form>
    </PendingContext.Provider>
  );
}

/** Submit button that shows a spinner while saving. Works inside <ActionForm> or a normal <form action>. */
export function SubmitButton({
  children,
  variant,
  size = "sm",
  className,
  confirm,
  formAction,
}: {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  /** Ask "Are you sure?" (styled dialog) before submitting, e.g. for delete buttons. */
  confirm?: string;
  /** Run a different server action than the form's own (e.g. a row's delete button). */
  formAction?: (formData: FormData) => void | Promise<void>;
}) {
  const fromActionForm = useContext(PendingContext);
  const { pending: fromNativeForm } = useFormStatus();
  const pending = fromActionForm ?? fromNativeForm;

  const buttonRef = useRef<HTMLButtonElement>(null);
  const confirmed = useRef(false);
  const [asking, setAsking] = useState(false);

  return (
    <>
      <Button
        ref={buttonRef}
        type="submit"
        variant={variant}
        size={size}
        loading={pending}
        loadingLabel="Saving…"
        formAction={formAction}
        className={cn(className)}
        onClick={(e) => {
          if (!confirm) return;
          if (confirmed.current) {
            confirmed.current = false; // the confirmed click goes through
            return;
          }
          e.preventDefault();
          setAsking(true);
        }}
      >
        {children}
      </Button>
      {confirm && (
        <ConfirmDialog
          open={asking}
          message={confirm}
          onCancel={() => setAsking(false)}
          onConfirm={() => {
            setAsking(false);
            confirmed.current = true;
            buttonRef.current?.click();
          }}
        />
      )}
    </>
  );
}
