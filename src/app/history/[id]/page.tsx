"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useInferenceDetail } from "@/hooks/use-inference-detail";
import { useAuth } from "@/hooks/use-auth";
import { TextResult } from "@/components/inference/text-result";
import { ImageResult } from "@/components/inference/image-result";
import { AudioResult } from "@/components/inference/audio-result";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";

export default function InferenceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, isLoading: authLoading, signIn, isSigningIn } = useAuth();
  const { data, isLoading, error } = useInferenceDetail(id);

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
                {data.mediaError && (
                  <div className="mb-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                    Media is stored, but URLs could not be generated right now: {data.mediaError}
                  </div>
                )}
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
