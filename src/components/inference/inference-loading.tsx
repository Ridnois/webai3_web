import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export function InferenceLoading() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border bg-muted/50 p-8">
      <Loader2 className="size-8 animate-spin text-primary" />
      <div className="text-center">
        <p className="text-sm font-medium">Running inference...</p>
        <p className="text-xs text-muted-foreground mt-1">
          This may take a few seconds depending on the model
        </p>
      </div>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}
