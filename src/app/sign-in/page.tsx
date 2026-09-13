import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/sign-in-form";
import { getSession } from "@/lib/session";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSession();
  if (session) {
    redirect("/");
  }

  const { next } = await searchParams;

  return (
    <main className="mx-auto flex min-h-full w-full max-w-sm flex-col justify-center gap-6 px-6 py-16">
      <div className="flex flex-col gap-1">
        <p className="font-heading text-sm tracking-wide text-muted-foreground">
          Plipe
        </p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Sign in
        </h1>
        <p className="text-sm text-muted-foreground">
          Email and password. Anyone with an account can upload and review.
        </p>
      </div>
      <SignInForm next={next} />
      <p className="text-sm text-muted-foreground">
        No account?{" "}
        <Link
          href="/sign-up"
          className="text-foreground underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </main>
  );
}
