import type { TaskType } from "./inference";

export type OutputType = "text" | "image" | "audio";

export type FieldType = "textarea" | "image-upload" | "number";

export interface InputField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: string | number;
}

export interface TaskConfig {
  task: TaskType;
  label: string;
  description: string;
  icon: string;
  collectionSlug: string;
  outputType: OutputType;
  fields: InputField[];
}

export const TASK_CONFIGS: Record<TaskType, TaskConfig> = {
  "text-to-image": {
    task: "text-to-image",
    label: "Text to Image",
    description:
      "Generate images from text prompts using AI diffusion models.",
    icon: "ImagePlus",
    collectionSlug: "text-to-image",
    outputType: "image",
    fields: [
      {
        name: "prompt",
        label: "Prompt",
        type: "textarea",
        placeholder: "A futuristic cityscape at sunset, cyberpunk style...",
        required: true,
      },
      {
        name: "negative_prompt",
        label: "Negative Prompt",
        type: "textarea",
        placeholder: "blurry, low quality, distorted...",
      },
      {
        name: "num_outputs",
        label: "Number of Images",
        type: "number",
        placeholder: "1",
        min: 1,
        max: 4,
        step: 1,
        defaultValue: 1,
      },
    ],
  },
  "text-to-text": {
    task: "text-to-text",
    label: "Text to Text",
    description:
      "Generate, summarize, translate, or transform text with language models.",
    icon: "MessageSquareText",
    collectionSlug: "language-models",
    outputType: "text",
    fields: [
      {
        name: "prompt",
        label: "Prompt",
        type: "textarea",
        placeholder: "Enter your prompt...",
        required: true,
      },
      {
        name: "max_tokens",
        label: "Max Tokens",
        type: "number",
        placeholder: "512",
        min: 1,
        max: 4096,
        step: 1,
        defaultValue: 512,
      },
    ],
  },
  "text-to-sound": {
    task: "text-to-sound",
    label: "Text to Sound",
    description:
      "Generate music, sound effects, or speech from a text description.",
    icon: "AudioLines",
    collectionSlug: "text-to-audio",
    outputType: "audio",
    fields: [
      {
        name: "prompt",
        label: "Prompt",
        type: "textarea",
        placeholder: "A soothing lo-fi beat with soft piano and rain sounds...",
        required: true,
      },
      {
        name: "duration",
        label: "Duration (seconds)",
        type: "number",
        placeholder: "10",
        min: 1,
        max: 30,
        step: 1,
        defaultValue: 10,
      },
    ],
  },
};
