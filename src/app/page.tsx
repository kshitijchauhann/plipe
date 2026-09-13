import { SignOutButton } from "@/components/auth/sign-out-button";
import { JobList } from "@/components/ingest/job-list";
import { UploadForm } from "@/components/ingest/upload-form";
import { listJobs } from "@/lib/ingest/queries";
import { requireSession } from "@/lib/session";

export default async function Home() {
  const session = await requireSession();
  const jobs = await listJobs();

  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg flex-col gap-8 px-6 py-16">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="font-heading text-sm tracking-wide text-muted-foreground">
            Plipe
          </p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Ingest
          </h1>
          <p className="text-sm text-muted-foreground">
            {session.user.name} · {session.user.email}
          </p>
        </div>
        <SignOutButton />
      </div>
      <UploadForm />
      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-medium tracking-wide uppercase">
          Jobs
        </h2>
        <JobList jobs={jobs} />
      </section>
    </main>
  );
}
