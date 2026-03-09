"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toastSuccess, toastError } from "@/lib/toast";
import { useInferenceDetail } from "@/hooks/use-inference-detail";
import { useShareInference } from "@/hooks/use-share-inference";
import { useAuth } from "@/hooks/use-auth";
import { TextResult } from "@/components/inference/text-result";
import { ImageResult } from "@/components/inference/image-result";
import { AudioResult } from "@/components/inference/audio-result";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Shield, Copy, Check, ExternalLink } from "lucide-react";

export default function InferenceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, isLoading: authLoading, signIn, isSigningIn } = useAuth();
  const { data, isLoading, error } = useInferenceDetail(id);
  const shareMutation = useShareInference();
  const [linkCopied, setLinkCopied] = useState(false);

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
          <Button onClick={signIn} disabled={isSigningIn} variant="outline">
            {isSigningIn ? "Signing..." : "Sign In"}
          </Button>
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

  const isPublic = data.isPublic === 1;
  const canShare = data.status === "succeeded";
  const publicUrl = typeof window !== "undefined"
    ? `${window.location.origin}/r/${data.id}`
    : `/r/${data.id}`;

  function handleToggleShare() {
    if (!data) return;
    shareMutation.mutate(
      { id: data.id, isPublic: !isPublic },
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

  function handleCopyLink() {
    navigator.clipboard.writeText(publicUrl).then(() => {
      setLinkCopied(true);
      toastSuccess("Link copied", "Public permalink is ready to share.");
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }

  const output =
    data.outputType === "text"
      ? data.outputData
      : data.mediaUrls && data.mediaUrls.length === 1
        ? data.mediaUrls[0]
        : data.mediaUrls;

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">{data.model}</h1>
            <p className="text-sm text-muted-foreground">
              {new Date(data.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {canShare && (
              <>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <Checkbox
                    checked={isPublic}
                    disabled={shareMutation.isPending}
                    onCheckedChange={() => handleToggleShare()}
                    aria-label="Share to public gallery"
                  />
                  <span className="text-sm text-muted-foreground select-none">
                    Public
                  </span>
                </label>
                {isPublic && (
                  <>
                    <Button variant="outline" size="sm" onClick={handleCopyLink}>
                      {linkCopied ? (
                        <Check className="size-4" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                      {linkCopied ? "Copied" : "Copy Link"}
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-4" />
                      </a>
                    </Button>
                  </>
                )}
              </>
            )}
            <Badge
              variant={
                data.status === "succeeded"
                  ? "default"
                  : data.status === "failed"
                    ? "destructive"
                    : "secondary"
              }
            >
              {data.status}
            </Badge>
          </div>
        </div>

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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Output</CardTitle>
          </CardHeader>
          <CardContent>
            {data.status === "failed" && data.errorMessage && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                {data.errorMessage}
              </div>
            )}

            {data.status === "succeeded" && (
              <>
                {data.outputType === "text" && <TextResult output={output} />}
                {data.outputType === "image" && <ImageResult output={output} />}
                {data.outputType === "audio" && <AudioResult output={output} />}
              </>
            )}

            {data.predictTimeMs && (
              <p className="text-xs text-muted-foreground text-right mt-3">
                Completed in {(data.predictTimeMs / 1000).toFixed(1)}s
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
