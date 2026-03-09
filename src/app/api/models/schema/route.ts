import { NextRequest, NextResponse } from "next/server";
import { getReplicateClient } from "@/lib/replicate";
import type { InputField } from "@/types/task-config";

interface OpenAPIProperty {
  type?: string;
  title?: string;
  description?: string;
  default?: unknown;
  minimum?: number;
  maximum?: number;
  enum?: unknown[];
  format?: string;
  "x-order"?: number;
}

function mapPropertyToField(
  name: string,
  prop: OpenAPIProperty,
  required: Set<string>
): InputField | null {
  // Skip internal/output-only fields
  if (name === "seed" || name === "raw") return null;

  const label =
    prop.title ?? name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const isRequired = required.has(name);

  if (prop.type === "integer" || prop.type === "number") {
    return {
      name,
      label,
      type: "number",
      placeholder: prop.default != null ? String(prop.default) : undefined,
      required: isRequired,
      min: prop.minimum,
      max: prop.maximum,
      step: prop.type === "integer" ? 1 : 0.01,
      defaultValue: prop.default != null ? Number(prop.default) : undefined,
    };
  }

  if (prop.type === "string" && prop.format === "uri") {
    return {
      name,
      label,
      type: "image-upload",
      placeholder: prop.description ?? `Enter a URL for ${label}`,
      required: isRequired,
    };
  }

  if (prop.type === "string") {
    const isLong =
      name === "prompt" ||
      name === "lyrics" ||
      name === "text" ||
      name === "system_prompt" ||
      (prop.description?.length ?? 0) > 80;

    return {
      name,
      label,
      type: isLong ? "textarea" : "textarea",
      placeholder:
        prop.default != null ? String(prop.default) : prop.description ?? "",
      required: isRequired,
      defaultValue: prop.default != null ? String(prop.default) : undefined,
    };
  }

  if (prop.type === "boolean") {
    // Map booleans as a number field with 0/1 for now
    // The form can render them, and they'll be sent as numbers
    return null;
  }

  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const model = searchParams.get("model");

  if (!model || !/^[a-z0-9_-]+\/[a-z0-9._-]+$/i.test(model)) {
    return NextResponse.json(
      { error: "Invalid model identifier", code: "INVALID_MODEL" },
      { status: 400 }
    );
  }

  try {
    const replicate = getReplicateClient();
    const [owner, name] = model.split("/");
    const modelData = await replicate.models.get(owner, name);

    const latestVersion = modelData.latest_version;
    if (!latestVersion?.openapi_schema) {
      return NextResponse.json({ fields: [] });
    }

    const schema = latestVersion.openapi_schema as {
      components?: {
        schemas?: {
          Input?: {
            properties?: Record<string, OpenAPIProperty>;
            required?: string[];
          };
        };
      };
    };

    const inputSchema = schema.components?.schemas?.Input;
    if (!inputSchema?.properties) {
      return NextResponse.json({ fields: [] });
    }

    const requiredSet = new Set(inputSchema.required ?? []);
    const properties = inputSchema.properties;

    const fields: InputField[] = [];
    // Sort by x-order if present, then by name
    const sortedEntries = Object.entries(properties).sort(([aName, a], [bName, b]) => {
      const aOrder = a["x-order"] ?? 999;
      const bOrder = b["x-order"] ?? 999;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return aName.localeCompare(bName);
    });

    for (const [propName, prop] of sortedEntries) {
      const field = mapPropertyToField(propName, prop, requiredSet);
      if (field) fields.push(field);
    }

    return NextResponse.json(
      { fields },
      { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[api/models/schema] Error:", message);
    return NextResponse.json(
      { error: message, code: "REPLICATE_ERROR" },
      { status: 502 }
    );
  }
}
