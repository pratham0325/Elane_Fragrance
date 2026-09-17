export interface Product {
  _id: string;
  name: string;
  slug: string;
  brand: string;
  description: string;
  shortDescription: string;
  category: { _id: string; name: string; slug: string };
  gender: 'Men' | 'Women' | 'Unisex';
  fragranceFamily: string;
  concentration: string;
  topNotes: string[];
  middleNotes: string[];
  baseNotes: string[];
  scentProfile: { freshness: number; sweetness: number; woody: number; spicy: number; projection: number; longevity: number };
  sizes: { size: string; price: number; compareAtPrice?: number; sku: string; stock: number }[];
  price: number;
  compareAtPrice?: number;
  discountPercent: number;
  thumbnail: string;
  images: string[];
  averageRating: number;
  reviewCount: number;
  isFeatured: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  isActive: boolean;
  tags: string[];
}

export interface Review {
  _id: string;
  user: { name: string; avatar?: string };
  rating: number;
  title: string;
  comment: string;
  isVerifiedBuyer: boolean;
  createdAt: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  items: { product: string; name: string; image: string; size: string; quantity: number; price: number }[];
  status: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  timeline: { status: string; note?: string; at: string }[];
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}
