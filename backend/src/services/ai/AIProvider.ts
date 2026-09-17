import { env, isAIEnabled } from '../../config/env';
import { logger } from '../../config/logger';

export interface ChatResult {
  text: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export class AIProviderError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'AIProviderError';
  }
}

/**
 * Minimal provider abstraction. Swap providers via AI_PROVIDER env var
 * without touching any calling service.
 */
export interface AIProvider {
  readonly name: string;
  readonly chatModel: string;
  readonly embeddingModel: string;
  chat(system: string, user: string, maxTokens?: number): Promise<ChatResult>;
  embed(texts: string[]): Promise<number[][]>;
  supportsEmbeddings(): boolean;
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.AI_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ── OpenAI-compatible provider (also works with Together, Groq, local LLMs) ──
class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  readonly chatModel = env.AI_MODEL;
  readonly embeddingModel = env.EMBEDDING_MODEL;
  private baseUrl = env.AI_BASE_URL || 'https://api.openai.com/v1';

  supportsEmbeddings() {
    return true;
  }

  async chat(system: string, user: string, maxTokens = 1200): Promise<ChatResult> {
    const res = await fetchWithTimeout(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.AI_API_KEY}`
      },
      body: JSON.stringify({
        model: this.chatModel,
        max_tokens: maxTokens,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ]
      })
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new AIProviderError(`OpenAI chat failed (${res.status}): ${body.slice(0, 200)}`);
    }

    const data = (await res.json()) as any;
    return {
      text: data.choices?.[0]?.message?.content ?? '',
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens,
      totalTokens: data.usage?.total_tokens
    };
  }

  async embed(texts: string[]): Promise<number[][]> {
    const res = await fetchWithTimeout(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.AI_API_KEY}`
      },
      body: JSON.stringify({ model: this.embeddingModel, input: texts })
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new AIProviderError(`OpenAI embeddings failed (${res.status}): ${body.slice(0, 200)}`);
    }

    const data = (await res.json()) as any;
    return (data.data ?? []).map((d: any) => d.embedding as number[]);
  }
}

// ── Anthropic provider (chat only; no embeddings endpoint) ──────────────────
class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic';
  readonly chatModel = env.AI_MODEL;
  readonly embeddingModel = env.EMBEDDING_MODEL;
  private baseUrl = env.AI_BASE_URL || 'https://api.anthropic.com/v1';

  supportsEmbeddings() {
    // Anthropic has no first-party embeddings API — callers fall back to
    // lexical scoring, which the ranking engine handles gracefully.
    return false;
  }

  async chat(system: string, user: string, maxTokens = 1200): Promise<ChatResult> {
    const res = await fetchWithTimeout(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.AI_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.chatModel,
        max_tokens: maxTokens,
        temperature: 0.2,
        system,
        messages: [{ role: 'user', content: user }]
      })
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new AIProviderError(`Anthropic chat failed (${res.status}): ${body.slice(0, 200)}`);
    }

    const data = (await res.json()) as any;
    const text = (data.content ?? [])
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('\n');

    return {
      text,
      promptTokens: data.usage?.input_tokens,
      completionTokens: data.usage?.output_tokens,
      totalTokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0)
    };
  }

  async embed(): Promise<number[][]> {
    throw new AIProviderError('Anthropic does not provide an embeddings endpoint');
  }
}

let cached: AIProvider | null = null;

export function getAIProvider(): AIProvider | null {
  if (!isAIEnabled) return null;
  if (cached) return cached;

  cached = env.AI_PROVIDER === 'anthropic' ? new AnthropicProvider() : new OpenAIProvider();
  logger.info(`Scent Intelligence provider initialised: ${cached.name} (${cached.chatModel})`);
  return cached;
}

/** Strips markdown fences and parses JSON defensively. */
export function parseJsonResponse<T>(raw: string): T {
  const cleaned = raw
    .replace(/^```(?:json)?/gm, '')
    .replace(/```$/gm, '')
    .trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new AIProviderError('No JSON object found in AI response');

  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}
