"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    try {
      const { error: signUpError } = await authClient.signUp.email({
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      });
      if (signUpError) {
        setError(signUpError.message ?? "Could not create an account.");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <AuthField label="Name" name="name" type="text" autoComplete="name" />
      <AuthField label="Email" name="email" type="email" autoComplete="email" />
      <AuthField
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending} size="lg" className="w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
