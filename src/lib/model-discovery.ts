import type { TaskType, ReplicateModel } from "@/types/inference";

interface CuratedModelSeed {
  owner: string;
  name: string;
  description: string;
}

interface ModelDiscoveryConfig {
  collectionSlugs: string[];
  fallbackModels: CuratedModelSeed[];
}

const MODEL_DISCOVERY_BY_TASK: Record<TaskType, ModelDiscoveryConfig> = {
  "text-to-image": {
    collectionSlugs: ["text-to-image", "image-generation"],
    fallbackModels: [
      {
        owner: "black-forest-labs",
        name: "flux-schnell",
        description: "Fast text-to-image generation with FLUX Schnell.",
      },
      {
        owner: "stability-ai",
        name: "stable-diffusion-3.5-large",
        description: "High-quality diffusion model for image generation.",
      },
    ],
  },
  "text-to-text": {
    collectionSlugs: ["language-models", "text-generation"],
    fallbackModels: [
      {
        owner: "meta",
        name: "meta-llama-3-70b-instruct",
        description: "General-purpose instruction-tuned text generation model.",
      },
      {
        owner: "mistralai",
        name: "mixtral-8x7b-instruct-v0.1",
        description: "Instruction model suitable for chat and summarization.",
      },
    ],
  },
  "text-to-sound": {
    collectionSlugs: ["ai-music-generation", "text-to-speech"],
    fallbackModels: [
      {
        owner: "minimax",
        name: "music-1.5",
        description: "Latest MiniMax music generation model.",
      },
      {
        owner: "stability-ai",
        name: "stable-audio-2.5",
        description: "Generate music and audio clips from text prompts.",
      },
      {
        owner: "elevenlabs",
        name: "music",
        description: "ElevenLabs music generation.",
      },
      {
        owner: "minimax",
        name: "music-01",
        description: "Text-to-music generation model.",
      },
      {
        owner: "minimax",
        name: "speech-2.8-turbo",
        description: "Fast text-to-speech model.",
      },
      {
        owner: "resemble-ai",
        name: "chatterbox-turbo",
        description: "High-quality text-to-speech model.",
      },
      {
        owner: "meta",
        name: "musicgen",
        description: "Meta's open-source music generation model.",
      },
    ],
  },
};

export function getModelDiscoveryConfig(task: TaskType): ModelDiscoveryConfig {
  return MODEL_DISCOVERY_BY_TASK[task];
}

export function getCuratedFallbackModels(task: TaskType): ReplicateModel[] {
  return getModelDiscoveryConfig(task).fallbackModels.map((model) => ({
    owner: model.owner,
    name: model.name,
    description: model.description,
    coverImageUrl: null,
    runCount: 0,
    url: `https://replicate.com/${model.owner}/${model.name}`,
  }));
}

