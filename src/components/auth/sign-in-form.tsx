"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

function safeNextPath(next: string | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/";
  }
  return next;
}

export function SignInForm({ next }: { next?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    try {
      const { error: signInError } = await authClient.signIn.email({
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      });
      if (signInError) {
        setError(signInError.message ?? "Could not sign in.");
        return;
      }
      router.push(safeNextPath(next));
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <AuthField label="Email" name="email" type="email" autoComplete="email" />
      <AuthField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending} size="lg" className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
