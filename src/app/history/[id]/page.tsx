"use client";

import { useParams } from "next/navigation";
import { useInferenceDetail } from "@/hooks/use-inference-detail";
import { useShareInference, shareToggleCallbacks } from "@/hooks/use-share-inference";
import { useAuth } from "@/hooks/use-auth";
import { fromInferenceDetail } from "@/types/output-item";
import { OutputView } from "@/components/output/output-view";
import { AuthGuardScreen } from "@/components/auth/auth-guard-screen";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorAlert } from "@/components/ui/error-alert";
import { BackButton } from "@/components/layout/back-button";

export default function InferenceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data, isLoading, error } = useInferenceDetail(id);
  const shareMutation = useShareInference();

  if (authLoading || isLoading) {
    return (
      <PageContainer maxWidth="3xl">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </PageContainer>
    );
  }

  if (!isAuthenticated) {
    return (
      <PageContainer maxWidth="3xl">
        <AuthGuardScreen
          title="Sign in to view this inference"
          subtitle="Your history is tied to your signed wallet session."
        />
      </PageContainer>
    );
  }

  if (error || !data) {
    return (
      <PageContainer maxWidth="3xl">
        <ErrorAlert>{error?.message ?? "Inference not found"}</ErrorAlert>
      </PageContainer>
    );
  }

  const item = fromInferenceDetail(data);

  function handleTogglePublic() {
    if (!data) return;
    shareMutation.mutate(
      { id: data.id, isPublic: !(data.isPublic === 1) },
      shareToggleCallbacks(),
    );
  }

  return (
    <PageContainer maxWidth="3xl">
      <BackButton href="/history" label="Back to History" />

      <div className="flex flex-col gap-6">
        <OutputView
          item={item}
          variant="detail"
          showPrompt
          showMetadata
          showActions
          isOwner
          onTogglePublic={handleTogglePublic}
          isToggling={shareMutation.isPending}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Input</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm rounded-lg border bg-muted/50 p-4 font-[family-name:var(--font-geist-mono)]">
              {JSON.stringify(data.input, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
