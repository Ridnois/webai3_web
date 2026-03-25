import { cn } from "@/lib/utils";

export function ErrorAlert({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive",
        className,
      )}
    >
      {children}
    </div>
  );
}
