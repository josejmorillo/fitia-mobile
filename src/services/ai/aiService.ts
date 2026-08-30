import type { NutritionData } from '../../utils/types';
import type { ApiKeys } from '../keys';

export type NutritionProvider = 'groq' | 'mistral' | 'none';

export interface NutritionResult {
  success: boolean;
  provider: NutritionProvider;
  confidence: 'high' | 'medium' | 'low';
  data: NutritionData;
  error: string | null;
}

const TIMEOUT_MS = 30_000;

const SYSTEM_PROMPT =
  'You are a precise sports nutrition database assistant. ' +
  'Given a text input, return ONLY a raw JSON object with nutritional values per 100g. ' +
  'No markdown, no code fences, no explanation, no preamble. ' +
  'If a value is unknown, use null. Never invent values you are not confident about — use null instead. ' +
  'For "category" pick the single best match from this fixed list (use exact string or null): ' +
  'Aperitivos, Bebidas, Carnes, Cereales, Condimentos, Embutidos, Frutas, Grasas, Huevos, Legumbres, ' +
  'Lácteos, Mariscos, Otros, Panes y masas, Pescados, Postres, Precocinados, Salsas, Snacks, Verduras. ' +
  'For "serving_name" use the most common serving unit name in Spanish (e.g. "lata", "rebanada", "unidad"), or null. ' +
  'For "serving_amount_g" use the weight in grams of that one serving unit, or null. ' +
  'For "emoji" use a single emoji that best represents the food. ' +
  'Format: {"name": string, "brand": string|null, "kcal_100g": number|null, "protein_g": number|null, ' +
  '"carbs_g": number|null, "fat_g": number|null, "fiber_g": number|null, "sugar_g": number|null, ' +
  '"serving_size_g": number|null, "serving_name": string|null, "serving_amount_g": number|null, ' +
  '"category": string|null, "emoji": string|null}';

const buildUserPrompt = (input: string): string =>
  `Food: ${input}\nLanguage of input: Spanish/English (auto-detect)\nReturn nutritional values per 100g.`;

const emptyData = (): NutritionData => ({
  name: null,
  brand: null,
  kcal_100g: null,
  protein_g: null,
  carbs_g: null,
  fat_g: null,
  fiber_g: null,
  sugar_g: null,
  serving_size_g: null,
  serving_name: null,
  serving_amount_g: null,
  category: null,
  emoji: null,
});

function calculateConfidence(data: NutritionData): NutritionResult['confidence'] {
  const primaryMacros = [data.kcal_100g, data.protein_g, data.carbs_g, data.fat_g];
  const nullCount = primaryMacros.filter((v) => v === null).length;
  if (nullCount >= 2) return 'low';
  if (nullCount === 1) return 'medium';
  return 'high';
}

function parseNutritionJson(raw: string): NutritionData {
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const parsed = JSON.parse(cleaned);

  const toNumberOrNull = (v: unknown): number | null => {
    if (v === null || v === undefined) return null;
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    return Number.isNaN(n) ? null : n;
  };
  const toStringOrNull = (v: unknown): string | null => {
    if (v === null || v === undefined || v === '') return null;
    return String(v);
  };

  return {
    name: toStringOrNull(parsed.name),
    brand: toStringOrNull(parsed.brand),
    kcal_100g: toNumberOrNull(parsed.kcal_100g),
    protein_g: toNumberOrNull(parsed.protein_g),
    carbs_g: toNumberOrNull(parsed.carbs_g),
    fat_g: toNumberOrNull(parsed.fat_g),
    fiber_g: toNumberOrNull(parsed.fiber_g),
    sugar_g: toNumberOrNull(parsed.sugar_g),
    serving_size_g: toNumberOrNull(parsed.serving_size_g),
    serving_name: toStringOrNull(parsed.serving_name),
    serving_amount_g: toNumberOrNull(parsed.serving_amount_g),
    category: toStringOrNull(parsed.category),
    emoji: toStringOrNull(parsed.emoji),
  };
}

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('timeout');
    }
    throw new Error('network');
  } finally {
    clearTimeout(timer);
  }
}

async function readErrorDetail(response: Response): Promise<string> {
  try {
    const body = await response.json();
    const msg = body?.error?.message ?? body?.message ?? body?.error?.code ?? body?.code;
    if (msg) return `${response.status}: ${msg}`;
    return `${response.status}`;
  } catch {
    return `${response.status}`;
  }
}

async function queryGroq(input: string, apiKey: string): Promise<NutritionData> {
  const response = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(input) },
      ],
      temperature: 0.1,
      max_tokens: 512,
    }),
  });

  if (response.status === 401 || response.status === 403) throw new Error('auth');
  if (response.status === 429) throw new Error('rate_limit');
  if (!response.ok) throw new Error(`server|${await readErrorDetail(response)}`);

  const json = await response.json();
  const raw: string = json?.choices?.[0]?.message?.content ?? '';
  if (!raw) throw new Error('parse');
  return parseNutritionJson(raw);
}

async function queryMistral(input: string, apiKey: string): Promise<NutritionData> {
  const response = await fetchWithTimeout('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'mistral-small-latest',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(input) },
      ],
      temperature: 0.1,
      max_tokens: 512,
    }),
  });

  if (response.status === 401 || response.status === 403) throw new Error('auth');
  if (response.status === 429) throw new Error('rate_limit');
  if (!response.ok) throw new Error(`server|${await readErrorDetail(response)}`);

  const json = await response.json();
  const raw: string = json?.choices?.[0]?.message?.content ?? '';
  if (!raw) throw new Error('parse');
  return parseNutritionJson(raw);
}

function toUserMessage(err: string): string {
  if (err.startsWith('server|')) {
    return `Error del proveedor (${err.slice('server|'.length)}).`;
  }
  switch (err) {
    case 'auth':
      return 'Clave de IA inválida. Revisa tu configuración.';
    case 'rate_limit':
      return 'Límite de consultas IA alcanzado. Inténtalo más tarde.';
    case 'network':
      return 'Sin conexión. Rellena manualmente.';
    case 'timeout':
      return 'La consulta tardó demasiado. Inténtalo de nuevo.';
    case 'parse':
      return 'No se pudo interpretar la respuesta. Prueba con otro nombre.';
    case 'config':
      return 'Configura una clave de Groq o Mistral en Ajustes.';
    default:
      return 'No se pudo obtener información. Rellena manualmente.';
  }
}

export async function searchFoodByTextAll(
  input: string,
  keys: ApiKeys
): Promise<NutritionResult[]> {
  const ok = (provider: NutritionProvider, data: NutritionData): NutritionResult => ({
    success: true,
    provider,
    confidence: calculateConfidence(data),
    data,
    error: null,
  });
  const fail = (provider: NutritionProvider, err: string): NutritionResult => ({
    success: false,
    provider,
    confidence: 'low',
    data: emptyData(),
    error: toUserMessage(err),
  });

  const tasks: Promise<NutritionResult>[] = [];
  if (keys.groq) {
    tasks.push(
      queryGroq(input, keys.groq)
        .then((data) => ok('groq', data))
        .catch((err) => fail('groq', err instanceof Error ? err.message : 'unknown'))
    );
  }
  if (keys.mistral) {
    tasks.push(
      queryMistral(input, keys.mistral)
        .then((data) => ok('mistral', data))
        .catch((err) => fail('mistral', err instanceof Error ? err.message : 'unknown'))
    );
  }

  if (tasks.length === 0) {
    return [fail('none', 'config')];
  }

  return Promise.all(tasks);
}
