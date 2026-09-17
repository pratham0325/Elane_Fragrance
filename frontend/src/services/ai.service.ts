import { apiClient } from './apiClient';
import type { Product } from '../types/api';

export interface SearchIntent {
  semanticQuery: string;
  budget: { min: number | null; max: number | null };
  occasion: string[];
  season: string[];
  sweetness: 'low' | 'medium' | 'high' | null;
  freshness: 'low' | 'medium' | 'high' | null;
  intensity: 'light' | 'moderate' | 'strong' | null;
  projection: 'low' | 'moderate' | 'high' | null;
  longevity: 'short' | 'medium' | 'long' | null;
  style: string[];
  gender: 'Men' | 'Women' | 'Unisex' | null;
  fragranceFamilies: string[];
  notes: string[];
  avoid: string[];
  confidence: number;
}

export interface AiSearchResult {
  productId: string;
  matchScore: number;
  reason: string;
  matchedOn: string[];
  product: Product;
}

export interface AiSearchResponse {
  intent: SearchIntent;
  results: AiSearchResult[];
  explanation: string;
  usedFallback: boolean;
  aiAvailable: boolean;
  notice?: string;
}

export interface ComparisonResponse {
  recommendation: { productId: string; productName: string; reason: string };
  comparison: {
    productId: string;
    productName: string;
    strengths: string[];
    weaknesses: string[];
    bestFor: string[];
  }[];
  attributes: { label: string; values: { productId: string; value: string }[] }[];
  products: Product[];
  usedFallback: boolean;
  notice?: string;
}

export async function aiFragranceSearch(query: string): Promise<AiSearchResponse> {
  const { data } = await apiClient.post('/ai/fragrance-search', { query });
  return data.data;
}

export async function aiCompareProducts(productIds: string[], needs?: string): Promise<ComparisonResponse> {
  const { data } = await apiClient.post('/ai/compare', { productIds, needs });
  return data.data;
}

export async function aiStatus(): Promise<{ available: boolean; label: string }> {
  const { data } = await apiClient.get('/ai/status');
  return data.data;
}

/** Turns structured intent into readable chips for the "we understood" row. */
export function intentToChips(intent: SearchIntent): string[] {
  const chips: string[] = [];
  intent.occasion.forEach((o) => chips.push(cap(o)));
  intent.season.forEach((s) => chips.push(cap(s)));
  intent.fragranceFamilies.forEach((f) => chips.push(f));
  if (intent.gender) chips.push(intent.gender);
  if (intent.sweetness) chips.push(`${cap(intent.sweetness)} sweetness`);
  if (intent.freshness) chips.push(`${cap(intent.freshness)} freshness`);
  if (intent.intensity) chips.push(`${cap(intent.intensity)} intensity`);
  if (intent.longevity) chips.push(`${cap(intent.longevity)} longevity`);
  intent.style.slice(0, 3).forEach((s) => chips.push(cap(s)));
  if (intent.budget.max) chips.push(`Under ₹${intent.budget.max.toLocaleString('en-IN')}`);
  if (intent.budget.min) chips.push(`Above ₹${intent.budget.min.toLocaleString('en-IN')}`);
  intent.avoid.forEach((a) => chips.push(`No ${a}`));
  return Array.from(new Set(chips)).slice(0, 10);
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
