"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { normalizeTextOutput } from "@/lib/output-helpers";

interface TextResultProps {
  output: unknown;
}

export function TextResult({ output }: TextResultProps) {
  const [copied, setCopied] = useState(false);
  const text = normalizeTextOutput(output);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative rounded-lg border bg-muted/50 p-4">
      <Button
        variant="ghost"
        size="icon-xs"
        className="absolute right-2 top-2"
        onClick={handleCopy}
        aria-label={copied ? "Copied" : "Copy to clipboard"}
      >
        {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      </Button>
      <pre className="whitespace-pre-wrap text-sm leading-relaxed pr-8 font-[family-name:var(--font-geist-mono)]">
        {text}
      </pre>
    </div>
  );
}
