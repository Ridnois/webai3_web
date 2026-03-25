import { History } from "lucide-react";
import { InferenceHistory } from "@/components/history/inference-history";
import { PageContainer } from "@/components/layout/page-container";

export default function HistoryPage() {
  return (
    <PageContainer maxWidth="3xl">
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
    </PageContainer>
  );
}
