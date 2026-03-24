"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useInferenceDetail } from "@/hooks/use-inference-detail";
import { useShareInference } from "@/hooks/use-share-inference";
import { useAuth } from "@/hooks/use-auth";
import { fromInferenceDetail } from "@/types/output-item";
import { OutputView } from "@/components/output/output-view";
import { ConnectSignInButton } from "@/components/auth/connect-sign-in-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";
import { toastSuccess, toastError } from "@/lib/toast";

export default function InferenceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data, isLoading, error } = useInferenceDetail(id);
  const shareMutation = useShareInference();

  if (authLoading || isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 rounded-lg border p-8 text-center">
          <Shield className="size-10 text-muted-foreground/60" />
          <div>
            <p className="text-base font-medium">Sign in to view this inference</p>
            <p className="text-sm text-muted-foreground">
              Your history is tied to your signed wallet session.
            </p>
          </div>
          <ConnectSignInButton />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error?.message ?? "Inference not found"}
        </div>
      </div>
    );
  }

  const item = fromInferenceDetail(data);

  function handleTogglePublic() {
    if (!data) return;
    shareMutation.mutate(
      { id: data.id, isPublic: !(data.isPublic === 1) },
      {
        onSuccess: (result) => {
          toastSuccess(
            result.isPublic ? "Shared to gallery" : "Removed from gallery",
            result.isPublic
              ? "Anyone with the link can now view this result."
              : "This result is now private and hidden from the gallery."
          );
        },
        onError: (err) => {
          toastError("Sharing failed", {
            description: err.message,
            hint: "Check your connection and try again.",
          });
        },
      }
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/history">
            <ArrowLeft className="size-4" />
            Back to History
          </Link>
        </Button>
      </div>

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
    </div>
  );
}
