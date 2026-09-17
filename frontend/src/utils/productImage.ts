const LOCAL_PRODUCT_IMAGES = [
  '/perfumes/noir.jpg',
  '/perfumes/eclat.jpg',
  '/perfumes/velvet.jpg',
  '/perfumes/oud.jpg',
  '/perfumes/rosaline.jpg',
  '/perfumes/rosaline-detail.jpg',
  '/perfumes/boss-alive.jpg',
  '/perfumes/crystal.jpg',
  '/perfumes/malachite-1.jpg',
  '/perfumes/met-bottle.jpg',
  '/perfumes/glass-aryballos.jpg'
];

export const FALLBACK_PRODUCT_IMAGE = LOCAL_PRODUCT_IMAGES[0];

function localImageFor(seed?: string | null): string {
  if (!seed) return FALLBACK_PRODUCT_IMAGE;
  const hash = [...seed].reduce((total, character) => total + character.charCodeAt(0), 0);
  return LOCAL_PRODUCT_IMAGES[hash % LOCAL_PRODUCT_IMAGES.length];
}

function normalizeImageUrl(url?: string | null): string | null {
  if (!url || !url.trim()) return null;

  try {
    const candidate = url.trim();
    const parsed = new URL(candidate);
    return candidate;
  } catch {
    return null;
  }
}

export function getProductImageUrl(primary?: string | null, fallback?: string | null, seed?: string): string {
  const candidates = [primary, fallback].map(normalizeImageUrl).filter((value): value is string => Boolean(value));
  return candidates[0] ?? localImageFor(seed ?? primary ?? fallback);
}

export function getProductImageGallery(images?: Array<string | null | undefined>, thumbnail?: string | null): string[] {
  const cleaned = [...(images ?? []), thumbnail ?? '']
    .map((url) => normalizeImageUrl(url))
    .filter((value): value is string => Boolean(value));

  return cleaned.length > 0 ? cleaned : [localImageFor(thumbnail)];
}
