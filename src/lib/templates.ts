import type { TaskType } from "@/types/inference";

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  task: TaskType;
  category: string;
  input: Record<string, unknown>;
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  // ── Text-to-Image ──────────────────────────────────────────────────────────
  {
    id: "cyberpunk-city",
    title: "Cyberpunk Cityscape",
    description: "Neon-lit futuristic city at night with flying cars and holographic billboards.",
    task: "text-to-image",
    category: "Sci-Fi",
    input: {
      prompt:
        "A sprawling cyberpunk cityscape at night, neon signs in Japanese and English, flying cars weaving between skyscrapers, holographic advertisements, rain-slicked streets reflecting pink and blue light, cinematic wide-angle shot, ultra detailed, 8k",
    },
  },
  {
    id: "studio-portrait",
    title: "Studio Portrait",
    description: "Professional studio portrait with dramatic Rembrandt lighting.",
    task: "text-to-image",
    category: "Photography",
    input: {
      prompt:
        "Professional studio portrait photograph, Rembrandt lighting, dark background, sharp focus on eyes, shallow depth of field, catch light in eyes, subtle rim light, editorial quality, shot on Hasselblad medium format",
    },
  },
  {
    id: "watercolor-landscape",
    title: "Watercolor Landscape",
    description: "Soft watercolor painting of a peaceful countryside scene.",
    task: "text-to-image",
    category: "Art",
    input: {
      prompt:
        "Delicate watercolor painting of a rolling countryside at golden hour, soft washes of warm yellows and greens, a small stone cottage with smoke rising from the chimney, wildflowers in the foreground, loose brushwork, paper texture visible",
    },
  },
  {
    id: "product-shot",
    title: "Product Photography",
    description: "Clean product shot on a minimalist background with soft shadows.",
    task: "text-to-image",
    category: "Photography",
    input: {
      prompt:
        "Minimalist product photography of a sleek perfume bottle on a white marble surface, soft directional lighting, subtle shadows, clean background gradient, commercial quality, shot on Phase One IQ4",
    },
  },
  {
    id: "anime-character",
    title: "Anime Character",
    description: "Detailed anime-style character illustration with dynamic pose.",
    task: "text-to-image",
    category: "Art",
    input: {
      prompt:
        "Anime-style character illustration, a young mage with flowing silver hair and glowing blue eyes, wearing an ornate dark cloak with golden runes, dynamic pose casting a spell, magical particles swirling, detailed background of a fantasy library, studio Ghibli inspired color palette",
    },
  },
  {
    id: "isometric-room",
    title: "Isometric Room",
    description: "Cute isometric 3D render of a cozy room with tiny details.",
    task: "text-to-image",
    category: "3D",
    input: {
      prompt:
        "Isometric 3D render of a cozy bedroom, warm lighting from a desk lamp, tiny bookshelves filled with books, a cat sleeping on the bed, plants on the windowsill, pixel-perfect details, soft pastel color palette, miniature diorama style",
    },
  },

  // ── Text-to-Text ───────────────────────────────────────────────────────────
  {
    id: "explain-concept",
    title: "Explain Like I'm 5",
    description: "Break down a complex topic into a simple, fun explanation.",
    task: "text-to-text",
    category: "Education",
    input: {
      prompt:
        "Explain quantum entanglement like I'm 5 years old. Use a simple analogy with everyday objects. Keep it fun and under 150 words.",
      max_tokens: 256,
    },
  },
  {
    id: "code-review",
    title: "Code Review",
    description: "Get a thorough code review with actionable suggestions.",
    task: "text-to-text",
    category: "Development",
    input: {
      prompt:
        "Review this code for bugs, performance issues, and best practices. Suggest concrete improvements with code examples:\n\n```javascript\nfunction fetchUsers(ids) {\n  const results = [];\n  for (const id of ids) {\n    const res = await fetch(`/api/users/${id}`);\n    const user = await res.json();\n    results.push(user);\n  }\n  return results;\n}\n```",
      max_tokens: 1024,
    },
  },
  {
    id: "blog-outline",
    title: "Blog Post Outline",
    description: "Generate a structured blog post outline with key talking points.",
    task: "text-to-text",
    category: "Writing",
    input: {
      prompt:
        "Create a detailed blog post outline about 'The Future of Decentralized AI'. Include: an attention-grabbing title, 5-6 main sections with 2-3 sub-points each, a compelling introduction hook, and a call-to-action conclusion. Target audience: tech-savvy developers.",
      max_tokens: 1024,
    },
  },
  {
    id: "tweet-thread",
    title: "Tweet Thread",
    description: "Turn an idea into an engaging tweet thread with hooks.",
    task: "text-to-text",
    category: "Social Media",
    input: {
      prompt:
        "Write a 5-tweet thread about why pay-per-use AI is the future of developer tools. First tweet should be a strong hook. Use short punchy sentences. Include a call to action in the last tweet. No hashtags.",
      max_tokens: 512,
    },
  },
  {
    id: "refactor-sql",
    title: "SQL Query Optimizer",
    description: "Optimize a slow SQL query with explanations.",
    task: "text-to-text",
    category: "Development",
    input: {
      prompt:
        "Optimize this SQL query for a PostgreSQL database with millions of rows. Explain what makes it slow and provide the optimized version with index recommendations:\n\nSELECT u.name, COUNT(o.id) as order_count, SUM(o.total) as total_spent\nFROM users u\nLEFT JOIN orders o ON o.user_id = u.id\nWHERE o.created_at > '2024-01-01'\nGROUP BY u.name\nHAVING COUNT(o.id) > 5\nORDER BY total_spent DESC;",
      max_tokens: 1024,
    },
  },

  // ── Text-to-Sound ──────────────────────────────────────────────────────────
  {
    id: "lofi-beat",
    title: "Lo-fi Study Beat",
    description: "Chill lo-fi hip hop beat perfect for studying or working.",
    task: "text-to-sound",
    category: "Music",
    input: {
      prompt:
        "A warm lo-fi hip hop beat with soft piano chords, gentle vinyl crackle, mellow bass, and a slow relaxing drum pattern. Cozy and nostalgic atmosphere, perfect for late night studying.",
      duration: 15,
    },
  },
  {
    id: "cinematic-trailer",
    title: "Cinematic Trailer",
    description: "Epic orchestral trailer music with building intensity.",
    task: "text-to-sound",
    category: "Music",
    input: {
      prompt:
        "Epic cinematic trailer music, starting with a quiet piano melody, gradually building with strings, brass, and percussion into a powerful crescendo. Dramatic, heroic, and emotionally moving.",
      duration: 20,
    },
  },
  {
    id: "rain-ambiance",
    title: "Rain Ambiance",
    description: "Relaxing rain sounds with distant thunder for focus.",
    task: "text-to-sound",
    category: "Ambient",
    input: {
      prompt:
        "Gentle rain falling on a window, with occasional distant thunder rumbles. Soft wind in the background. Calming, meditative ambient soundscape for relaxation and sleep.",
      duration: 20,
    },
  },
  {
    id: "retro-game",
    title: "Retro Game Theme",
    description: "Chiptune-style 8-bit video game theme music.",
    task: "text-to-sound",
    category: "Music",
    input: {
      prompt:
        "Upbeat 8-bit chiptune video game music, catchy melody with arpeggiated synths, punchy square wave bass, fast-paced drums, nostalgic retro game feel, energetic and fun.",
      duration: 15,
    },
  },
  {
    id: "podcast-intro",
    title: "Podcast Intro Jingle",
    description: "Short upbeat jingle for a tech podcast intro.",
    task: "text-to-sound",
    category: "Jingle",
    input: {
      prompt:
        "Short upbeat podcast intro jingle, modern electronic sound with a catchy synth hook, clean production, energetic but professional, tech-forward vibe, suitable for a technology podcast.",
      duration: 8,
    },
  },
];

export function getTemplatesByTask(task: TaskType): PromptTemplate[] {
  return PROMPT_TEMPLATES.filter((t) => t.task === task);
}

export function getTemplateById(id: string): PromptTemplate | undefined {
  return PROMPT_TEMPLATES.find((t) => t.id === id);
}

export function getCategories(task?: TaskType): string[] {
  const templates = task ? getTemplatesByTask(task) : PROMPT_TEMPLATES;
  return [...new Set(templates.map((t) => t.category))];
}
