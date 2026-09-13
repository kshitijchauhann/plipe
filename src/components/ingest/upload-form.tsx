"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function UploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Choose one file.");
      return;
    }

    setError(null);
    setPending(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/jobs", { method: "POST", body });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Upload failed.");
        return;
      }
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      setFilename(null);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        One Cursor transcript at a time. Extraction runs in the background; this
        page only tracks job status.
      </p>
      <input
        ref={inputRef}
        name="file"
        type="file"
        accept=".json,.jsonl,.txt,.md,application/json,text/plain"
        disabled={pending}
        className="text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5"
        onChange={(event) => {
          setFilename(event.target.files?.[0]?.name ?? null);
          setError(null);
        }}
      />
      {filename ? (
        <p className="text-sm text-muted-foreground">Selected: {filename}</p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" size="lg" disabled={pending || !filename}>
        {pending ? "Uploading…" : "Upload"}
      </Button>
    </form>
  );
}
