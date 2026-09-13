import Link from "next/link";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { getSession } from "@/lib/session";

export default async function SignUpPage() {
  const session = await getSession();
  if (session) {
    redirect("/");
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-sm flex-col justify-center gap-6 px-6 py-16">
      <div className="flex flex-col gap-1">
        <p className="font-heading text-sm tracking-wide text-muted-foreground">
          Plipe
        </p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Create account
        </h1>
        <p className="text-sm text-muted-foreground">
          Password must be at least 8 characters.
        </p>
      </div>
      <SignUpForm />
      <p className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </main>
  );
}
