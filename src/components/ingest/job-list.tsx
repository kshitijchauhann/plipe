"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const ACTIVE = new Set(["pending", "processing"]);

export function JobList({
  jobs,
}: {
  jobs: Array<{
    id: string;
    status: string;
    originalFilename: string;
    lastError: string | null;
    createdAt: string;
    attempts: number;
  }>;
}) {
  const router = useRouter();
  const hasActive = jobs.some((row) => ACTIVE.has(row.status));

  useEffect(() => {
    if (!hasActive) {
      return;
    }
    const timer = window.setInterval(() => {
      router.refresh();
    }, 2000);
    return () => window.clearInterval(timer);
  }, [hasActive, router]);

  if (jobs.length === 0) {
    return <p className="text-sm text-muted-foreground">No uploads yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {jobs.map((row) => (
        <li
          key={row.id}
          className="flex flex-col gap-1 rounded-md border border-border px-3 py-2"
        >
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-sm font-medium">
              {row.originalFilename}
            </span>
            <span className="shrink-0 font-heading text-xs tracking-wide text-muted-foreground uppercase">
              {row.status.replaceAll("_", " ")}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(row.createdAt).toLocaleString()}
            {row.attempts > 0 ? ` · attempt ${row.attempts}` : null}
          </p>
          {row.lastError ? (
            <p className="text-xs text-destructive">{row.lastError}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
