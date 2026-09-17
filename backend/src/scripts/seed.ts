/**
 * Run: npm run seed
 * Seeds the ÉLANÉ database with 25 luxury perfumes across 5 categories,
 * 2 users (admin + customer), coupons, and sample orders.
 */
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import slugify from 'slugify';
import { env } from '../config/env';
import { User } from '../models/User.model';
import { Category } from '../models/Category.model';
import { Product } from '../models/Product.model';
import { Review } from '../models/Review.model';
import { Coupon } from '../models/Coupon.model';
import { Order } from '../models/Order.model';

// ─── HELPERS ────────────────────────────────────────────────────────────────

function slug(name: string) {
  return slugify(name, { lower: true, strict: true });
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function orderNumber() {
  return `EL-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

// ─── CATEGORIES ─────────────────────────────────────────────────────────────

const CATEGORIES = [
  { name: 'Signature Collection', description: 'The pillars of ÉLANÉ — timeless, definitive fragrances.' },
  { name: 'Noir Collection', description: 'Dark, intense, and seductive. For evenings that matter.' },
  { name: 'Lumière Collection', description: 'Light, fresh, and radiant. For effortless days.' },
  { name: 'Oud & Amber', description: 'Rich Middle-Eastern inspired compositions.' },
  { name: 'Limited Editions', description: 'Rare, numbered fragrances created in small batches.' }
];

// ─── PERFUMES ────────────────────────────────────────────────────────────────

const PERFUMES = [
  // ── SIGNATURE ──────────────────────────────────────────────────────────────
  {
    name: 'ÉLANÉ NOIR',
    categoryKey: 'Signature Collection',
    gender: 'Unisex',
    fragranceFamily: 'Woody',
    concentration: 'Eau de Parfum',
    shortDescription: 'A dark, smoky accord of oud and black pepper with a velvet musk finish.',
    description:
      'ÉLANÉ NOIR is the definitive statement of the house. Smoky guaiac wood and black pepper open with an almost violent freshness, giving way to an iris heart wrapped in warm amber. The base settles into a long-lasting velvet musk that clings to skin for hours. This is a fragrance that does not ask for attention — it commands it.',
    topNotes: ['Black Pepper', 'Bergamot', 'Pink Pepper'],
    middleNotes: ['Iris', 'Leather', 'Amber'],
    baseNotes: ['Guaiac Wood', 'Musk', 'Vetiver', 'Oud'],
    scentProfile: { freshness: 40, sweetness: 20, woody: 90, spicy: 75, projection: 85, longevity: 92 },
    sizes: [
      { size: '50ml', price: 12900, sku: 'EL-NOIR-50', stock: 45 },
      { size: '100ml', price: 19900, sku: 'EL-NOIR-100', stock: 30 }
    ],
    isFeatured: true,
    isBestSeller: true,
    tags: ['smoky', 'dark', 'leather', 'oud', 'signature']
  },
  {
    name: 'ÉLANÉ ÉCLAT',
    categoryKey: 'Signature Collection',
    gender: 'Women',
    fragranceFamily: 'Floral',
    concentration: 'Eau de Parfum',
    shortDescription: 'A luminous bouquet of rose de mai and white jasmine over warm musks.',
    description:
      'ÉCLAT — French for "radiance" — was created to capture the golden hour. The opening is a burst of fresh bergamot and neroli that immediately dissolves into the heart: a rich, heady bouquet of rose de mai and white jasmine. The base is warm and sensual, skin-close musks and soft sandalwood that make this a second-skin fragrance for all occasions.',
    topNotes: ['Bergamot', 'Neroli', 'Peach'],
    middleNotes: ['Rose de Mai', 'White Jasmine', 'Magnolia'],
    baseNotes: ['Sandalwood', 'White Musk', 'Amber', 'Cedarwood'],
    scentProfile: { freshness: 60, sweetness: 65, woody: 35, spicy: 20, projection: 70, longevity: 80 },
    sizes: [
      { size: '30ml', price: 8900, sku: 'EL-ECL-30', stock: 60 },
      { size: '50ml', price: 13900, sku: 'EL-ECL-50', stock: 50 },
      { size: '100ml', price: 21900, sku: 'EL-ECL-100', stock: 25 }
    ],
    isFeatured: true,
    isBestSeller: true,
    tags: ['floral', 'rose', 'jasmine', 'feminine', 'luminous']
  },
  {
    name: 'ÉLANÉ SANTAL',
    categoryKey: 'Signature Collection',
    gender: 'Unisex',
    fragranceFamily: 'Woody',
    concentration: 'Eau de Parfum',
    shortDescription: 'Creamy Mysore sandalwood deepened with cardamom and vanilla.',
    description:
      'SANTAL is an homage to the sacred. Inspired by the Mysore sandalwood forests of South India, this fragrance wraps the wearer in warm creaminess from the first spray. Cardamom and saffron provide an exotic opening before the fragrance settles into its true heart: luxuriously creamy sandalwood, smooth and meditative. Vanilla and musk seal the composition into a long, skin-loving trail.',
    topNotes: ['Cardamom', 'Saffron', 'Bergamot'],
    middleNotes: ['Mysore Sandalwood', 'Vetiver', 'Rose'],
    baseNotes: ['Vanilla', 'White Musk', 'Amber'],
    scentProfile: { freshness: 35, sweetness: 70, woody: 85, spicy: 45, projection: 65, longevity: 88 },
    sizes: [
      { size: '50ml', price: 14900, sku: 'EL-SAN-50', stock: 40 },
      { size: '100ml', price: 22900, sku: 'EL-SAN-100', stock: 22 }
    ],
    isFeatured: true,
    tags: ['sandalwood', 'creamy', 'warm', 'unisex', 'meditative']
  },
  {
    name: 'ÉLANÉ AURA',
    categoryKey: 'Signature Collection',
    gender: 'Unisex',
    fragranceFamily: 'Fresh',
    concentration: 'Eau de Toilette',
    shortDescription: 'A crystalline fresh accord of sea breeze and white cedar.',
    description:
      'AURA is the most accessible fragrance in the ÉLANÉ portfolio — but never ordinary. An effortlessly clean composition built on a mineral sea accord and the cool transparency of white cedar. Green tea adds an intellectual freshness while the base brings in soft musk and ambergris. AURA is the scent of impeccable mornings.',
    topNotes: ['Sea Accord', 'Green Tea', 'Lemon'],
    middleNotes: ['White Cedar', 'Iris', 'Jasmine'],
    baseNotes: ['Ambergris', 'White Musk', 'Sandalwood'],
    scentProfile: { freshness: 92, sweetness: 20, woody: 45, spicy: 10, projection: 60, longevity: 65 },
    sizes: [
      { size: '50ml', price: 9900, sku: 'EL-AUR-50', stock: 80 },
      { size: '100ml', price: 15900, sku: 'EL-AUR-100', stock: 55 }
    ],
    isNew: true,
    tags: ['fresh', 'clean', 'aquatic', 'morning', 'unisex']
  },
  {
    name: 'ÉLANÉ VELVET',
    categoryKey: 'Signature Collection',
    gender: 'Women',
    fragranceFamily: 'Oriental',
    concentration: 'Parfum',
    shortDescription: 'An opulent oriental of rose, oud, and dark benzoin.',
    description:
      'VELVET is ÉLANÉ at its most indulgent. A thick, opulent oriental that opens with candied rose and ripe plum before revealing the beating heart — pure rose absolute and oud. The base is deeply resinous: benzoin, labdanum, and dark musk create a trail that lingers for an entire day. Parfum concentration, maximum intensity.',
    topNotes: ['Rose', 'Plum', 'Saffron'],
    middleNotes: ['Rose Absolute', 'Oud', 'Patchouli'],
    baseNotes: ['Benzoin', 'Labdanum', 'Dark Musk', 'Vanilla'],
    scentProfile: { freshness: 15, sweetness: 75, woody: 70, spicy: 50, projection: 90, longevity: 97 },
    sizes: [
      { size: '30ml', price: 18900, compareAtPrice: 22900, sku: 'EL-VEL-30', stock: 20 },
      { size: '50ml', price: 28900, sku: 'EL-VEL-50', stock: 15 }
    ],
    isFeatured: true,
    isBestSeller: true,
    tags: ['oriental', 'rose', 'oud', 'intense', 'luxury', 'evening']
  },
  // ── NOIR COLLECTION ────────────────────────────────────────────────────────
  {
    name: 'ÉLANÉ OMBRE',
    categoryKey: 'Noir Collection',
    gender: 'Men',
    fragranceFamily: 'Woody',
    concentration: 'Eau de Parfum',
    shortDescription: 'Smoked vetiver and dark tobacco for the man who makes no compromises.',
    description:
      'OMBRE is the most masculine expression in the ÉLANÉ wardrobe. Dark tobacco absolute and smoked vetiver form the spine while rum and black pepper add a defiant heat. The drydown is a deep, earthy accord of labdanum and patchouli that lasts well past midnight. Made for men who understand that restraint is a form of power.',
    topNotes: ['Black Pepper', 'Rum', 'Grapefruit'],
    middleNotes: ['Tobacco Absolute', 'Vetiver', 'Leather'],
    baseNotes: ['Labdanum', 'Patchouli', 'Dark Musk'],
    scentProfile: { freshness: 25, sweetness: 30, woody: 95, spicy: 80, projection: 80, longevity: 90 },
    sizes: [
      { size: '50ml', price: 13900, sku: 'EL-OMB-50', stock: 35 },
      { size: '100ml', price: 20900, sku: 'EL-OMB-100', stock: 28 }
    ],
    isBestSeller: true,
    tags: ['tobacco', 'vetiver', 'masculine', 'dark', 'evening']
  },
  {
    name: 'ÉLANÉ ENCENS',
    categoryKey: 'Noir Collection',
    gender: 'Unisex',
    fragranceFamily: 'Oriental',
    concentration: 'Eau de Parfum',
    shortDescription: 'Sacred incense and resins with a smoke-tinged cedar heart.',
    description:
      'ENCENS draws on the ancient tradition of burning resins and woods as offerings. Frankincense and myrrh open with an almost spiritual intensity; the heart reveals cedarwood and rose, softening the composition before the base anchors everything in dark amber and precious musk. A fragrance for moments of reflection.',
    topNotes: ['Frankincense', 'Cardamom', 'Pink Pepper'],
    middleNotes: ['Myrrh', 'Cedarwood', 'Rose'],
    baseNotes: ['Dark Amber', 'Benzoin', 'Precious Musk'],
    scentProfile: { freshness: 20, sweetness: 40, woody: 75, spicy: 60, projection: 75, longevity: 88 },
    sizes: [
      { size: '50ml', price: 14900, sku: 'EL-ENC-50', stock: 30 },
      { size: '100ml', price: 22900, sku: 'EL-ENC-100', stock: 18 }
    ],
    isNew: true,
    tags: ['incense', 'resin', 'spiritual', 'unisex', 'smoky']
  },
  {
    name: 'ÉLANÉ CUIR',
    categoryKey: 'Noir Collection',
    gender: 'Men',
    fragranceFamily: 'Spicy',
    concentration: 'Eau de Parfum',
    shortDescription: 'A refined leather fougère with smoky birch and warm spice.',
    description:
      'CUIR translates leather into a language of pure elegance. Smoky birch tar and black pepper create an unforgettable opening. The leather heart is classical and refined, not harsh — more the scent of fine Italian suede than raw hide. Tonka bean and white musk soften the drydown into something deeply wearable and compelling.',
    topNotes: ['Black Pepper', 'Elemi', 'Grapefruit'],
    middleNotes: ['Birch Tar', 'Suede', 'Geranium'],
    baseNotes: ['Tonka Bean', 'Vetiver', 'White Musk', 'Cedarwood'],
    scentProfile: { freshness: 40, sweetness: 35, woody: 70, spicy: 85, projection: 72, longevity: 85 },
    sizes: [
      { size: '50ml', price: 12900, sku: 'EL-CUI-50', stock: 42 },
      { size: '100ml', price: 19900, sku: 'EL-CUI-100', stock: 25 }
    ],
    tags: ['leather', 'spicy', 'masculine', 'birch', 'fougere']
  },
  // ── LUMIÈRE COLLECTION ─────────────────────────────────────────────────────
  {
    name: 'ÉLANÉ BLOOM',
    categoryKey: 'Lumière Collection',
    gender: 'Women',
    fragranceFamily: 'Floral',
    concentration: 'Eau de Toilette',
    shortDescription: 'A dewy peony and lily-of-the-valley in the early morning.',
    description:
      'BLOOM is the feeling of a garden just after rain. Peony absolute, lily-of-the-valley, and fresh green notes come together in a composition that feels genuinely alive. Light and modern, BLOOM never crosses into soapy or generic — it retains a natural quality that makes it unmistakably ÉLANÉ.',
    topNotes: ['Green Notes', 'Cucumber', 'Bergamot'],
    middleNotes: ['Peony', 'Lily-of-the-Valley', 'White Rose'],
    baseNotes: ['White Musk', 'Ambrette', 'Cedarwood'],
    scentProfile: { freshness: 88, sweetness: 45, woody: 25, spicy: 10, projection: 55, longevity: 60 },
    sizes: [
      { size: '30ml', price: 6900, sku: 'EL-BLO-30', stock: 70 },
      { size: '50ml', price: 10900, sku: 'EL-BLO-50', stock: 60 },
      { size: '100ml', price: 16900, sku: 'EL-BLO-100', stock: 40 }
    ],
    isNew: true,
    tags: ['peony', 'fresh', 'floral', 'feminine', 'daytime']
  },
  {
    name: 'ÉLANÉ SOLEIL',
    categoryKey: 'Lumière Collection',
    gender: 'Women',
    fragranceFamily: 'Citrus',
    concentration: 'Eau de Toilette',
    shortDescription: 'A sun-drenched citrus with neroli, mimosa, and warm driftwood.',
    description:
      'SOLEIL captures the feeling of a sun-drenched afternoon. Sicilian lemon, mandarin, and neroli open with extraordinary brightness. The heart blooms into mimosa and ylang-ylang — warm and golden. Driftwood and benzoin anchor the drydown, giving SOLEIL unexpected depth for a citrus fragrance.',
    topNotes: ['Sicilian Lemon', 'Mandarin', 'Neroli'],
    middleNotes: ['Mimosa', 'Ylang-Ylang', 'Orange Blossom'],
    baseNotes: ['Driftwood', 'Benzoin', 'Musks'],
    scentProfile: { freshness: 85, sweetness: 55, woody: 30, spicy: 5, projection: 60, longevity: 62 },
    sizes: [
      { size: '50ml', price: 9900, sku: 'EL-SOL-50', stock: 65 },
      { size: '100ml', price: 15900, sku: 'EL-SOL-100', stock: 45 }
    ],
    isBestSeller: true,
    tags: ['citrus', 'summer', 'feminine', 'bright', 'sunny']
  },
  {
    name: 'ÉLANÉ ROSÉE',
    categoryKey: 'Lumière Collection',
    gender: 'Women',
    fragranceFamily: 'Floral',
    concentration: 'Eau de Parfum',
    shortDescription: 'A sophisticated rose reconstructed with lychee and patchouli.',
    description:
      'ROSÉE is not a traditional rose fragrance. ÉLANÉ has deconstructed rose and rebuilt it: lychee and litchi add translucent fruitiness up top; the heart is pure rose accord — clear, refined, not cloying. Patchouli grounds it, preventing sweetness from becoming saccharine. The result is a modern rose for discerning wearers.',
    topNotes: ['Lychee', 'Litchi', 'Aldehydes'],
    middleNotes: ['Rose Accord', 'Peony', 'Jasmine'],
    baseNotes: ['Patchouli', 'Amber', 'Musk'],
    scentProfile: { freshness: 55, sweetness: 62, woody: 40, spicy: 20, projection: 68, longevity: 75 },
    sizes: [
      { size: '30ml', price: 8900, sku: 'EL-ROS-30', stock: 55 },
      { size: '50ml', price: 13900, sku: 'EL-ROS-50', stock: 38 },
      { size: '100ml', price: 20900, sku: 'EL-ROS-100', stock: 20 }
    ],
    tags: ['rose', 'lychee', 'modern', 'feminine', 'floral']
  },
  {
    name: 'ÉLANÉ NUAGE',
    categoryKey: 'Lumière Collection',
    gender: 'Unisex',
    fragranceFamily: 'Musky',
    concentration: 'Eau de Parfum',
    shortDescription: 'A skin-close cloud of white musks and soft woods.',
    description:
      'NUAGE (French: cloud) is almost invisible in the best way. Close to the skin, it radiates a warmth that seems like your own skin amplified. Cashmeran and clean musks dominate; violet leaf and iris provide slight powdery texture; ambrette rounds everything into a gossamer drydown. The fragrance equivalent of cashmere.',
    topNotes: ['Iris', 'Violet Leaf', 'Bergamot'],
    middleNotes: ['Cashmeran', 'Ambrette', 'Violet'],
    baseNotes: ['White Musk', 'Sandalwood', 'Cedarwood'],
    scentProfile: { freshness: 55, sweetness: 40, woody: 45, spicy: 5, projection: 40, longevity: 72 },
    sizes: [
      { size: '50ml', price: 11900, sku: 'EL-NUA-50', stock: 50 },
      { size: '100ml', price: 17900, sku: 'EL-NUA-100', stock: 35 }
    ],
    isNew: true,
    tags: ['musky', 'skin', 'soft', 'unisex', 'clean']
  },
  // ── OUD & AMBER ────────────────────────────────────────────────────────────
  {
    name: 'ÉLANÉ OUD IMPÉRIAL',
    categoryKey: 'Oud & Amber',
    gender: 'Men',
    fragranceFamily: 'Oriental',
    concentration: 'Parfum',
    shortDescription: 'A royal oud composition with saffron and aged Hindi oud.',
    description:
      'OUD IMPÉRIAL is ÉLANÉ\'s most precious creation. Hindi oud — genuine, aged, and rare — forms the undeniable nucleus. Saffron, rose absolute, and orris butter surround it in a composition that is complex, evolving, and deeply personal. On every skin it smells different. On yours, it will be something you never want to remove.',
    topNotes: ['Saffron', 'Pink Pepper', 'Elemi'],
    middleNotes: ['Hindi Oud', 'Rose Absolute', 'Orris Butter'],
    baseNotes: ['Dark Amber', 'Sandalwood', 'Musk', 'Incense'],
    scentProfile: { freshness: 10, sweetness: 45, woody: 90, spicy: 65, projection: 88, longevity: 98 },
    sizes: [
      { size: '30ml', price: 29900, sku: 'EL-OUD-30', stock: 12 },
      { size: '50ml', price: 45900, sku: 'EL-OUD-50', stock: 8 }
    ],
    isFeatured: true,
    tags: ['oud', 'saffron', 'royal', 'masculine', 'intense', 'luxury']
  },
  {
    name: 'ÉLANÉ AMBRE NOCTURNE',
    categoryKey: 'Oud & Amber',
    gender: 'Unisex',
    fragranceFamily: 'Oriental',
    concentration: 'Eau de Parfum',
    shortDescription: 'A nocturnal amber study — warm, rich, and deeply comforting.',
    description:
      'AMBRE NOCTURNE is built for the night. A complex amber accord forms its backbone — not the synthetic amber of cheaper fragrances, but a layered construction of benzoin, labdanum, and styrax. Cinnamon and clove add a spiced warmth; vanilla smooths the edges into something reassuringly beautiful.',
    topNotes: ['Cinnamon', 'Clove', 'Orange'],
    middleNotes: ['Benzoin', 'Labdanum', 'Styrax'],
    baseNotes: ['Vanilla', 'Dark Amber', 'Musks', 'Patchouli'],
    scentProfile: { freshness: 20, sweetness: 80, woody: 55, spicy: 70, projection: 78, longevity: 91 },
    sizes: [
      { size: '50ml', price: 15900, sku: 'EL-AMB-50', stock: 33 },
      { size: '100ml', price: 23900, sku: 'EL-AMB-100', stock: 20 }
    ],
    isBestSeller: true,
    tags: ['amber', 'oriental', 'warm', 'spiced', 'nocturnal']
  },
  {
    name: 'ÉLANÉ BOIS PRÉCIEUX',
    categoryKey: 'Oud & Amber',
    gender: 'Unisex',
    fragranceFamily: 'Woody',
    concentration: 'Eau de Parfum',
    shortDescription: 'A forest of rare woods — oud, cedarwood, gaiac, and rosewood.',
    description:
      'BOIS PRÉCIEUX (precious woods) is a study in complexity through simplicity. Four rare woods — oud, Atlas cedarwood, guaiac, and Brazilian rosewood — are blended in a way that reveals each individually while creating something greater collectively. Slight smokiness, slight sweetness, and extraordinary depth.',
    topNotes: ['Cardamom', 'Bergamot', 'Elemi'],
    middleNotes: ['Guaiac Wood', 'Cedarwood', 'Rosewood'],
    baseNotes: ['Oud', 'Musk', 'Amber', 'Vetiver'],
    scentProfile: { freshness: 30, sweetness: 30, woody: 97, spicy: 40, projection: 70, longevity: 87 },
    sizes: [
      { size: '50ml', price: 16900, sku: 'EL-BOI-50', stock: 28 },
      { size: '100ml', price: 25900, sku: 'EL-BOI-100', stock: 16 }
    ],
    tags: ['woods', 'oud', 'cedarwood', 'unisex', 'complex']
  },
  {
    name: 'ÉLANÉ SAFRAN DORÉ',
    categoryKey: 'Oud & Amber',
    gender: 'Women',
    fragranceFamily: 'Oriental',
    concentration: 'Eau de Parfum',
    shortDescription: 'Opulent saffron and golden honey with jasmine absolute.',
    description:
      'SAFRAN DORÉ (golden saffron) opens with the metallic, earthy richness of genuine saffron threads. Honey and jasmine absolute create the heart — sweet but not saccharine, opulent but not heavy. The base — amber, benzoin, and precious musks — ensures a long, radiating projection.',
    topNotes: ['Saffron', 'Mandarin', 'Aldehydes'],
    middleNotes: ['Jasmine Absolute', 'Honey', 'Rose'],
    baseNotes: ['Amber', 'Benzoin', 'Precious Musks'],
    scentProfile: { freshness: 25, sweetness: 78, woody: 40, spicy: 55, projection: 82, longevity: 89 },
    sizes: [
      { size: '30ml', price: 14900, sku: 'EL-SAF-30', stock: 22 },
      { size: '50ml', price: 21900, sku: 'EL-SAF-50', stock: 18 }
    ],
    isNew: true,
    tags: ['saffron', 'honey', 'jasmine', 'golden', 'feminine', 'oriental']
  },
  // ── LIMITED EDITIONS ───────────────────────────────────────────────────────
  {
    name: 'ÉLANÉ MAGNOLIA NOIRE',
    categoryKey: 'Limited Editions',
    gender: 'Women',
    fragranceFamily: 'Floral',
    concentration: 'Parfum',
    shortDescription: 'Limited. 500 numbered bottles. Dark magnolia with black orchid.',
    description:
      'Limited to 500 numbered bottles worldwide. MAGNOLIA NOIRE places the magnolia — usually a symbol of fresh, white femininity — into shadow. Black orchid, dark woods, and incense surround the magnolia bloom, creating something simultaneously light and dark, familiar and alien. Each bottle bears a unique number and a certificate of authenticity.',
    topNotes: ['Dark Magnolia', 'Black Pepper', 'Bergamot'],
    middleNotes: ['Black Orchid', 'Jasmine', 'Ylang-Ylang'],
    baseNotes: ['Dark Amber', 'Incense', 'Patchouli', 'Vetiver'],
    scentProfile: { freshness: 35, sweetness: 50, woody: 65, spicy: 45, projection: 85, longevity: 95 },
    sizes: [
      { size: '50ml', price: 34900, sku: 'EL-MAG-50-LE', stock: 15 }
    ],
    isFeatured: true,
    tags: ['limited', 'magnolia', 'orchid', 'dark', 'floral', 'numbered']
  },
  {
    name: 'ÉLANÉ IRIS ABSOLU',
    categoryKey: 'Limited Editions',
    gender: 'Unisex',
    fragranceFamily: 'Floral',
    concentration: 'Parfum',
    shortDescription: 'Pure iris absolute — powdery, violet, impossibly refined.',
    description:
      'Iris absolute is one of the most expensive raw materials in perfumery — derived from aged iris roots (orris butter), a single kilogram can cost more than gold. IRIS ABSOLU showcases this material in near-purity, supported only by violet, cedarwood, and the quietest musk. The result is exquisitely refined and completely singular.',
    topNotes: ['Violet', 'Bergamot', 'Aldehydes'],
    middleNotes: ['Iris Absolute', 'Orris Butter', 'Lily'],
    baseNotes: ['Cedarwood', 'White Musk', 'Cashmere'],
    scentProfile: { freshness: 50, sweetness: 40, woody: 50, spicy: 10, projection: 65, longevity: 83 },
    sizes: [
      { size: '30ml', price: 38900, sku: 'EL-IRI-30-LE', stock: 10 }
    ],
    isFeatured: true,
    isNew: true,
    tags: ['iris', 'limited', 'powdery', 'unisex', 'refined', 'luxury']
  },
  {
    name: 'ÉLANÉ MARINE ABSOLUE',
    categoryKey: 'Lumière Collection',
    gender: 'Men',
    fragranceFamily: 'Aquatic',
    concentration: 'Eau de Toilette',
    shortDescription: 'A deep-sea aquatic with sea kelp, driftwood, and ambergris.',
    description:
      'MARINE ABSOLUE goes deeper than typical aquatics. Rather than simulating the surface of the sea, it explores the depth — cold, mineral, slightly salty. Sea kelp and marine accord form the nucleus; driftwood brings texture; genuine ambergris in the base creates warmth that lifts the composition above the aquatic category entirely.',
    topNotes: ['Marine Accord', 'Bergamot', 'Sea Kelp'],
    middleNotes: ['Driftwood', 'Jasmine', 'Violet'],
    baseNotes: ['Ambergris', 'White Musk', 'Cedarwood'],
    scentProfile: { freshness: 90, sweetness: 20, woody: 50, spicy: 10, projection: 62, longevity: 68 },
    sizes: [
      { size: '50ml', price: 10900, sku: 'EL-MAR-50', stock: 55 },
      { size: '100ml', price: 16900, sku: 'EL-MAR-100', stock: 40 }
    ],
    tags: ['aquatic', 'marine', 'masculine', 'sea', 'fresh']
  },
  {
    name: 'ÉLANÉ CACHEMIRE',
    categoryKey: 'Signature Collection',
    gender: 'Women',
    fragranceFamily: 'Gourmand',
    concentration: 'Eau de Parfum',
    shortDescription: 'A warm gourmand of salted caramel, cashmere wood, and vanilla.',
    description:
      'CACHEMIRE is comfort made wearable. Salted caramel and a hint of almond create an edible opening; tonka bean and cashmere wood give the fragrance its signature softness; vanilla bourbon and musks round it into a drydown so pleasant it borders on addictive. This is the fragrance you will reach for on cold evenings.',
    topNotes: ['Salted Caramel', 'Almond', 'Bergamot'],
    middleNotes: ['Tonka Bean', 'Cashmere Wood', 'Heliotrope'],
    baseNotes: ['Vanilla Bourbon', 'Sandalwood', 'White Musk'],
    scentProfile: { freshness: 20, sweetness: 90, woody: 45, spicy: 15, projection: 65, longevity: 80 },
    sizes: [
      { size: '50ml', price: 12900, sku: 'EL-CAC-50', stock: 48 },
      { size: '100ml', price: 19900, sku: 'EL-CAC-100', stock: 30 }
    ],
    isBestSeller: true,
    tags: ['gourmand', 'vanilla', 'caramel', 'sweet', 'feminine', 'warm']
  },
  {
    name: 'ÉLANÉ PATCHOULI MYSTIQUE',
    categoryKey: 'Noir Collection',
    gender: 'Unisex',
    fragranceFamily: 'Musky',
    concentration: 'Eau de Parfum',
    shortDescription: 'Dark patchouli elevated with bergamot and vetiver.',
    description:
      'Patchouli is perhaps the most polarising note in fragrance. ÉLANÉ has worked to give it the context it deserves: bergamot and lemon lift the opening; rose and geranium humanise the heart; the dark patchouli base is rich but clean, earthy but sophisticated. A fragrance that converts sceptics.',
    topNotes: ['Bergamot', 'Lemon', 'Black Pepper'],
    middleNotes: ['Rose', 'Geranium', 'Jasmine'],
    baseNotes: ['Dark Patchouli', 'Vetiver', 'Amber', 'Musk'],
    scentProfile: { freshness: 45, sweetness: 35, woody: 80, spicy: 50, projection: 73, longevity: 86 },
    sizes: [
      { size: '50ml', price: 12900, sku: 'EL-PAT-50', stock: 38 },
      { size: '100ml', price: 19900, sku: 'EL-PAT-100', stock: 24 }
    ],
    tags: ['patchouli', 'earthy', 'dark', 'unisex', 'sophisticated']
  },
  {
    name: 'ÉLANÉ MUSC BLANC',
    categoryKey: 'Lumière Collection',
    gender: 'Women',
    fragranceFamily: 'Musky',
    concentration: 'Eau de Parfum',
    shortDescription: 'Pure white musk — close, clean, and quietly captivating.',
    description:
      'MUSC BLANC is a study in minimalism. A carefully curated chord of clean white musks — some soft and powdery, some bright and crystalline — is supported by just enough iris and cedarwood to provide context. The effect is the illusion of perfect skin. Understated power.',
    topNotes: ['Bergamot', 'Aldehydes', 'Lemon'],
    middleNotes: ['Iris', 'White Rose', 'Peony'],
    baseNotes: ['White Musk', 'Cedarwood', 'Ambrette'],
    scentProfile: { freshness: 70, sweetness: 35, woody: 40, spicy: 5, projection: 45, longevity: 70 },
    sizes: [
      { size: '50ml', price: 10900, sku: 'EL-MUS-50', stock: 60 },
      { size: '100ml', price: 16900, sku: 'EL-MUS-100', stock: 42 }
    ],
    tags: ['musk', 'clean', 'white', 'feminine', 'minimalist']
  },
  {
    name: 'ÉLANÉ ÉPICE ROYALE',
    categoryKey: 'Oud & Amber',
    gender: 'Men',
    fragranceFamily: 'Spicy',
    concentration: 'Eau de Parfum',
    shortDescription: 'A royal spice cabinet — cinnamon, clove, rose, and sandalwood.',
    description:
      'ÉPICE ROYALE is a spice merchant\'s dream. Every opening is warm and complex: cinnamon, clove, and cumin fused together. Rose and geranium cool the spice at the heart; sandalwood and amber provide a rich, warm base that evolves beautifully on skin over 10+ hours.',
    topNotes: ['Cinnamon', 'Clove', 'Cumin'],
    middleNotes: ['Rose', 'Geranium', 'Cardamom'],
    baseNotes: ['Sandalwood', 'Amber', 'Vetiver', 'Musk'],
    scentProfile: { freshness: 30, sweetness: 55, woody: 70, spicy: 92, projection: 80, longevity: 88 },
    sizes: [
      { size: '50ml', price: 13900, sku: 'EL-EPI-50', stock: 36 },
      { size: '100ml', price: 20900, sku: 'EL-EPI-100', stock: 22 }
    ],
    tags: ['spice', 'cinnamon', 'masculine', 'oriental', 'warm']
  },
  {
    name: 'ÉLANÉ THÉ VERT',
    categoryKey: 'Lumière Collection',
    gender: 'Unisex',
    fragranceFamily: 'Fresh',
    concentration: 'Eau de Toilette',
    shortDescription: 'Refreshing green tea with cedar, mint, and soft musks.',
    description:
      'THÉ VERT (green tea) is ÉLANÉ\'s daily companion. A composition built around the dry, slightly vegetal freshness of green tea — simultaneously refreshing and calming. Mint adds sparkle up top; cedarwood gives the drydown gentle structure; soft musks make it skin-friendly and universally appropriate.',
    topNotes: ['Green Tea', 'Mint', 'Lemon'],
    middleNotes: ['Jasmine', 'White Rose', 'Iris'],
    baseNotes: ['Cedarwood', 'Vetiver', 'White Musk'],
    scentProfile: { freshness: 94, sweetness: 25, woody: 40, spicy: 8, projection: 55, longevity: 60 },
    sizes: [
      { size: '50ml', price: 8900, sku: 'EL-THE-50', stock: 75 },
      { size: '100ml', price: 13900, sku: 'EL-THE-100', stock: 55 }
    ],
    tags: ['green tea', 'fresh', 'mint', 'unisex', 'daily']
  },
  {
    name: 'ÉLANÉ JASMIN SACRÉ',
    categoryKey: 'Signature Collection',
    gender: 'Women',
    fragranceFamily: 'Floral',
    concentration: 'Eau de Parfum',
    shortDescription: 'Grand jasmine absolute — heady, indolic, and deeply feminine.',
    description:
      'Grasse jasmine absolute is the queen of the garden. JASMIN SACRÉ places her on a throne. The opening is intensely floral and slightly heady — jasmine as it truly smells, not the clean approximation of cheaper fragrances. Ylang-ylang adds tropicality; tuberose deepens the floral intensity. The base of sandalwood and musk frames the flower without dimming its light.',
    topNotes: ['Bergamot', 'Ylang-Ylang', 'Green Notes'],
    middleNotes: ['Jasmine Absolute', 'Tuberose', 'Orange Blossom'],
    baseNotes: ['Sandalwood', 'Musk', 'Cedarwood'],
    scentProfile: { freshness: 40, sweetness: 58, woody: 35, spicy: 15, projection: 80, longevity: 82 },
    sizes: [
      { size: '30ml', price: 10900, sku: 'EL-JAS-30', stock: 48 },
      { size: '50ml', price: 15900, sku: 'EL-JAS-50', stock: 38 },
      { size: '100ml', price: 23900, sku: 'EL-JAS-100', stock: 22 }
    ],
    isFeatured: true,
    isBestSeller: true,
    tags: ['jasmine', 'floral', 'feminine', 'heady', 'tuberose']
  }
];

const REVIEWS = [
  { rating: 5, title: 'Absolutely captivating', comment: 'I have worn many luxury fragrances but ÉLANÉ NOIR is something else. The sillage is incredible and it lasts all day on my skin.' },
  { rating: 5, title: 'My signature scent', comment: 'ÉCLAT has become the scent everyone asks about when I enter a room. Floral without being generic — it is refined and deeply feminine.' },
  { rating: 4, title: 'Luxurious but subtle', comment: 'SANTAL is a quiet luxury. Not a crowd-pleaser in the obvious sense, but people who know fragrance consistently compliment it.' },
  { rating: 5, title: 'Daily driver perfection', comment: 'AURA hits the sweet spot for work — professional, fresh, never overpowering. Exactly what I needed.' },
  { rating: 5, title: 'Worth every rupee', comment: 'VELVET is intense but magnificent. Put it on at 8pm and it was still going at midnight. The rose-oud combination is done perfectly here.' },
  { rating: 4, title: 'Deeply masculine', comment: 'OMBRE is not for the faint-hearted. Tobacco and vetiver done with real artistry. Compliment magnet.' },
  { rating: 5, title: 'Spiritual experience', comment: 'ENCENS transports me. I put it on and feel immediately calmer. Remarkable fragrance.' },
  { rating: 4, title: 'Modern leather done right', comment: 'CUIR avoids the harsh leather trap that many fragrances fall into. Refined and polished.' }
];

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌸 ÉLANÉ seed script starting...');
  await mongoose.connect(env.MONGO_URI);
  console.log('  ✓ MongoDB connected');

  // Clear existing
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Review.deleteMany({}),
    Coupon.deleteMany({}),
    Order.deleteMany({})
  ]);
  console.log('  ✓ Cleared existing data');

  // ── USERS
  const adminHash = await bcrypt.hash('Admin@1234', 12);
  const customerHash = await bcrypt.hash('Customer@1234', 12);

  const [admin, customer] = await User.insertMany([
    {
      name: 'ÉLANÉ Admin',
      email: 'admin@elane.com',
      passwordHash: adminHash,
      role: 'ADMIN',
      isVerified: true
    },
    {
      name: 'Priya Sharma',
      email: 'priya@example.com',
      passwordHash: customerHash,
      role: 'CUSTOMER',
      isVerified: true,
      addresses: [
        {
          label: 'Home',
          fullName: 'Priya Sharma',
          phone: '+91 98765 43210',
          line1: '42 Elysian Gardens',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'India',
          isDefault: true
        }
      ]
    }
  ]);
  console.log('  ✓ Created 2 users (admin + customer)');

  const customerAddress = customer.addresses?.[0] ?? {
    label: 'Home',
    fullName: 'Priya Sharma',
    phone: '+91 98765 43210',
    line1: '42 Elysian Gardens',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400001',
    country: 'India',
    isDefault: true
  };

  // ── CATEGORIES
  const catDocs = await Category.insertMany(
    CATEGORIES.map((c) => ({ ...c, slug: slug(c.name) }))
  );
  const catMap = Object.fromEntries(catDocs.map((c) => [c.name, c._id]));
  console.log(`  ✓ Created ${catDocs.length} categories`);

  // ── PRODUCTS
  const thumbnails: Record<string, string> = {
    'ÉLANÉ NOIR': '/perfumes/noir.jpg',
    'ÉLANÉ ÉCLAT': '/perfumes/eclat.jpg',
    'ÉLANÉ SANTAL': 'https://images.unsplash.com/photo-1566977776052-6e61e35bf9be?w=600&q=80',
    'ÉLANÉ VELVET': '/perfumes/velvet.jpg',
    'ÉLANÉ AURA': 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&q=80',
    'ÉLANÉ OMBRE': 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=600&q=80',
    'ÉLANÉ ENCENS': 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=600&q=80',
    'ÉLANÉ CUIR': 'https://images.unsplash.com/photo-1619994403073-2cec844b8e63?w=600&q=80',
    'ÉLANÉ BLOOM': 'https://images.unsplash.com/photo-1557170334-a9632e77c6e4?w=600&q=80',
    'ÉLANÉ SOLEIL': 'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?w=600&q=80',
    'ÉLANÉ ROSÉE': 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&q=80',
    'ÉLANÉ NUAGE': 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=600&q=80',
    'ÉLANÉ OUD IMPÉRIAL': '/perfumes/oud.jpg',
    'ÉLANÉ AMBRE NOCTURNE': '/perfumes/boss-alive.jpg',
    'ÉLANÉ BOIS PRÉCIEUX': '/perfumes/met-bottle.jpg',
    'ÉLANÉ SAFRAN DORÉ': 'https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg',
    'ÉLANÉ MAGNOLIA NOIRE': 'https://images.pexels.com/photos/1961791/pexels-photo-1961791.jpeg',
    'ÉLANÉ IRIS ABSOLU': 'https://images.unsplash.com/photo-1595535373192-fc8935bacd89?w=600&q=80',
    'ÉLANÉ MARINE ABSOLUE': 'https://images.unsplash.com/photo-1519669011783-4eaa95fa1b7d?w=600&q=80',
    'ÉLANÉ CACHEMIRE': 'https://images.pexels.com/photos/1961792/pexels-photo-1961792.jpeg',
    'ÉLANÉ PATCHOULI MYSTIQUE': 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&q=80',
    'ÉLANÉ MUSC BLANC': '/perfumes/crystal.jpg',
    'ÉLANÉ ÉPICE ROYALE': '/perfumes/malachite-1.jpg',
    'ÉLANÉ THÉ VERT': '/perfumes/glass-aryballos.jpg',
    'ÉLANÉ JASMIN SACRÉ': '/perfumes/rosaline-detail.jpg'
  };

  const productDocs = await Product.insertMany(
    PERFUMES.map((p) => ({
      ...p,
      slug: slug(p.name),
      category: catMap[p.categoryKey],
      thumbnail: thumbnails[p.name],
      images: [thumbnails[p.name]],
      brand: 'ÉLANÉ',
      price: Math.min(...p.sizes.map((s) => s.price)),
      discountPercent: 0,
      averageRating: +(4 + Math.random()).toFixed(1),
      reviewCount: randInt(12, 120)
    }))
  );
  console.log(`  ✓ Created ${productDocs.length} perfumes`);

  // ── REVIEWS (attach to first 8 products, by customer)
  const reviewDocs = REVIEWS.map((r, i) => ({
    ...r,
    product: productDocs[i]._id,
    user: customer._id,
    isVerifiedBuyer: true,
    isApproved: true
  }));
  await Review.insertMany(reviewDocs);
  console.log(`  ✓ Created ${reviewDocs.length} reviews`);

  // ── COUPONS
  const future = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  await Coupon.insertMany([
    { code: 'ELANE10', discountType: 'PERCENTAGE', discountValue: 10, minCartAmount: 5000, usageLimit: 200, expiresAt: future },
    { code: 'WELCOME20', discountType: 'PERCENTAGE', discountValue: 20, minCartAmount: 10000, usageLimit: 100, expiresAt: future },
    { code: 'FLAT500', discountType: 'FIXED', discountValue: 500, minCartAmount: 8000, usageLimit: 0, expiresAt: future }
  ]);
  console.log('  ✓ Created 3 coupons (ELANE10 / WELCOME20 / FLAT500)');

  // ── SAMPLE ORDER
  const p0 = productDocs[0];
  const p1 = productDocs[1];
  await Order.insertMany([
    {
      orderNumber: orderNumber(),
      user: customer._id,
      items: [
        { product: p0._id, name: p0.name, image: p0.thumbnail, size: '50ml', quantity: 1, price: p0.sizes[0].price },
        { product: p1._id, name: p1.name, image: p1.thumbnail, size: '100ml', quantity: 1, price: p1.sizes[1]?.price ?? p1.sizes[0].price }
      ],
      shippingAddress: customerAddress,
      subtotal: p0.sizes[0].price + (p1.sizes[1]?.price ?? p1.sizes[0].price),
      discount: 0,
      shippingFee: 0,
      tax: 0,
      total: p0.sizes[0].price + (p1.sizes[1]?.price ?? p1.sizes[0].price),
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      status: 'Placed',
      timeline: [{ status: 'Placed', at: new Date() }]
    }
  ]);
  console.log('  ✓ Created 1 sample order');

  await mongoose.disconnect();
  console.log('\n✅ Seed complete! Credentials:');
  console.log('   Admin  → admin@elane.com / Admin@1234');
  console.log('   User   → priya@example.com / Customer@1234');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
