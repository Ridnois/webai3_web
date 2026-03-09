"use client";

import { type FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { InputField } from "@/types/task-config";
import type { ReplicateModel } from "@/types/inference";

interface InferenceFormProps {
  fields: InputField[];
  selectedModel: ReplicateModel | null;
  isLoading: boolean;
  isSubmitDisabled?: boolean;
  onSubmit: (input: Record<string, unknown>) => void;
  submitLabel?: string;
  loadingLabel?: string;
  helperText?: string;
  initialValues?: Record<string, string | number>;
}

export function InferenceForm({
  fields,
  selectedModel,
  isLoading,
  isSubmitDisabled,
  onSubmit,
  submitLabel,
  loadingLabel,
  helperText,
  initialValues,
}: InferenceFormProps) {
  const [values, setValues] = useState<Record<string, string | number>>(() => {
    const defaults: Record<string, string | number> = {};
    for (const field of fields) {
      if (field.defaultValue !== undefined) {
        defaults[field.name] = field.defaultValue;
      }
    }
    if (initialValues) {
      Object.assign(defaults, initialValues);
    }
    return defaults;
  });

  function handleChange(name: string, value: string | number) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const input: Record<string, unknown> = {};
    for (const field of fields) {
      const val = values[field.name];
      if (val !== undefined && val !== "") {
        input[field.name] = field.type === "number" ? Number(val) : val;
      }
    }
    onSubmit(input);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {fields.map((field) => (
        <div
          key={field.name}
          className="rounded-3xl border border-border/70 bg-background/70 p-4 shadow-sm"
        >
          <Label htmlFor={field.name} className="text-sm font-semibold">
            {field.label}
            {field.required && (
              <span className="ml-1 text-destructive" aria-hidden="true">
                *
              </span>
            )}
          </Label>
          {field.type === "textarea" && (
            <Textarea
              id={field.name}
              placeholder={field.placeholder}
              required={field.required}
              value={values[field.name] ?? ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
              rows={4}
              className="mt-3 min-h-30 rounded-2xl border-border/70 bg-background/90"
            />
          )}
          {field.type === "image-upload" && (
            <Input
              id={field.name}
              type="url"
              placeholder={field.placeholder}
              required={field.required}
              value={values[field.name] ?? ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className="mt-3 h-11 rounded-2xl border-border/70 bg-background/90"
            />
          )}
          {field.type === "number" && (
            <Input
              id={field.name}
              type="number"
              placeholder={field.placeholder}
              required={field.required}
              min={field.min}
              max={field.max}
              step={field.step}
              value={values[field.name] ?? ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className="mt-3 h-11 rounded-2xl border-border/70 bg-background/90"
            />
          )}
        </div>
      ))}
      <Button
        type="submit"
        disabled={!selectedModel || isLoading || isSubmitDisabled}
        size="lg"
        className="mt-2 h-12 rounded-full shadow-[0_20px_45px_-24px_var(--primary)]"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" />
            {loadingLabel ?? "Running..."}
          </>
        ) : (
          submitLabel ?? "Run Inference"
        )}
      </Button>
      {!selectedModel && (
        <p className="text-center text-xs text-muted-foreground">
          Select a model above to get started
        </p>
      )}
      {helperText && (
        <p className="text-center text-xs text-destructive">{helperText}</p>
      )}
    </form>
  );
}
