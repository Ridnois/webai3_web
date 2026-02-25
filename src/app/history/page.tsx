import { History } from "lucide-react";
import { InferenceHistory } from "@/components/history/inference-history";

export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <History className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">History</h1>
          <p className="text-sm text-muted-foreground">
            Your past inference results
          </p>
        </div>
      </div>
      <InferenceHistory />
    </div>
  );
}
