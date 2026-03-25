import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function BackButton({ href, label }: { href: string; label: string }) {
  return (
    <div className="mb-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href={href}>
          <ArrowLeft className="size-4" />
          {label}
        </Link>
      </Button>
    </div>
  );
}
