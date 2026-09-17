import { Schema, model, Document, Types } from 'mongoose';
import { FRAGRANCE_FAMILIES, FragranceFamily, GENDERS, Gender, CONCENTRATIONS, Concentration } from '../types/enums';

export interface IProductSize {
  size: string; // e.g. "30ml", "50ml", "100ml"
  price: number;
  compareAtPrice?: number;
  sku: string;
  stock: number;
}

export interface IScentProfile {
  freshness: number; // 0-100
  sweetness: number;
  woody: number;
  spicy: number;
  projection: number;
  longevity: number;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  brand: string;
  description: string;
  shortDescription: string;
  category: Types.ObjectId;
  gender: Gender;
  fragranceFamily: FragranceFamily;
  concentration: Concentration;
  topNotes: string[];
  middleNotes: string[];
  baseNotes: string[];
  scentProfile: IScentProfile;
  ingredients: string[];
  images: string[];
  thumbnail: string;
  sizes: IProductSize[];
  price: number; // base/default display price (lowest size price)
  compareAtPrice?: number;
  discountPercent: number;
  averageRating: number;
  reviewCount: number;
  isFeatured: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  isActive: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const sizeSchema = new Schema<IProductSize>(
  {
    size: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    sku: { type: String, required: true, unique: true },
    stock: { type: Number, required: true, default: 0, min: 0 }
  },
  { _id: false }
);

const scentProfileSchema = new Schema<IScentProfile>(
  {
    freshness: { type: Number, min: 0, max: 100, default: 50 },
    sweetness: { type: Number, min: 0, max: 100, default: 50 },
    woody: { type: Number, min: 0, max: 100, default: 50 },
    spicy: { type: Number, min: 0, max: 100, default: 50 },
    projection: { type: Number, min: 0, max: 100, default: 50 },
    longevity: { type: Number, min: 0, max: 100, default: 50 }
  },
  { _id: false }
);

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    brand: { type: String, required: true, default: 'ÉLANÉ' },
    description: { type: String, required: true },
    shortDescription: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    gender: { type: String, enum: GENDERS, required: true, index: true },
    fragranceFamily: { type: String, enum: FRAGRANCE_FAMILIES, required: true, index: true },
    concentration: { type: String, enum: CONCENTRATIONS, required: true },
    topNotes: [{ type: String }],
    middleNotes: [{ type: String }],
    baseNotes: [{ type: String }],
    scentProfile: { type: scentProfileSchema, default: () => ({}) },
    ingredients: [{ type: String }],
    images: [{ type: String }],
    thumbnail: { type: String, required: true },
    sizes: { type: [sizeSchema], required: true, validate: (v: IProductSize[]) => v.length > 0 },
    price: { type: Number, required: true, index: true },
    compareAtPrice: { type: Number },
    discountPercent: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isNew: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    tags: [{ type: String, index: true }]
  } as any,
  { timestamps: true }
);

productSchema.index({ name: 'text', tags: 'text', brand: 'text' });
productSchema.index({ createdAt: -1 });

export const Product = model<IProduct>('Product', productSchema);
