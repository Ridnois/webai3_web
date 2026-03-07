"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { InputField } from "@/types/task-config";
import type { ReplicateModel } from "@/types/inference";
import { Loader2 } from "lucide-react";

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
    // Override defaults with initial values (e.g. from URL params / templates)
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
        <div key={field.name} className="flex flex-col gap-2">
          <Label htmlFor={field.name}>
            {field.label}
            {field.required && (
              <span className="text-destructive ml-1" aria-hidden="true">
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
            />
          )}
        </div>
      ))}
      <Button
        type="submit"
        disabled={!selectedModel || isLoading || isSubmitDisabled}
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" />
            {loadingLabel ?? "Running..."}
          </>
        ) : (
          (submitLabel ?? "Run Inference")
        )}
      </Button>
      {!selectedModel && (
        <p className="text-xs text-muted-foreground text-center">
          Select a model above to get started
        </p>
      )}
      {helperText && (
        <p className="text-xs text-destructive text-center">{helperText}</p>
      )}
    </form>
  );
}
