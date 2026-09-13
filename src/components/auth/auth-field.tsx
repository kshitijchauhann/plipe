import { cn } from "@/lib/utils";

export function AuthField({
  label,
  name,
  type,
  autoComplete,
  required = true,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className={cn(
          "h-9 rounded-md border border-input bg-background px-3 text-sm outline-none",
          "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
        )}
      />
    </label>
  );
}
