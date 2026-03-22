"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ModelDetailView } from "./model-detail-view";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";

export function ModelDetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAdmin, isAuthenticated } = useAuth();

  const model = searchParams.get("model");

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg font-medium">
              {isAuthenticated ? "Access Denied" : "Admin sign-in required"}
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!model) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No model specified.</p>
            <Link href="/admin" className="mt-4 inline-block text-sm text-primary underline">
              Back to admin
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => router.push("/admin")}
        >
          <ArrowLeft className="size-4" />
          Admin
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Model Detail</h1>
        <code className="mt-1 block text-sm text-muted-foreground font-mono">{model}</code>
      </div>

      <ModelDetailView model={model} compact={false} />
    </main>
  );
}
