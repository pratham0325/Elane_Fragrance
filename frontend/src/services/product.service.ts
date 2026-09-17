import { apiClient } from './apiClient';
import type { Product, PaginatedResponse, Review } from '../types/api';

export interface ProductFilters {
  search?: string;
  gender?: string;
  fragranceFamily?: string;
  concentration?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  isFeatured?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
}

export async function fetchProducts(filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''));
  const { data } = await apiClient.get('/products', { params });
  return data.data;
}

export async function fetchProductBySlug(slug: string): Promise<{ product: Product; related: Product[] }> {
  const { data } = await apiClient.get(`/products/${slug}`);
  return data.data;
}

export async function fetchFeatured(): Promise<Product[]> {
  const { data } = await apiClient.get('/products/featured');
  return data.data;
}

export async function fetchNewArrivals(): Promise<Product[]> {
  const { data } = await apiClient.get('/products/new-arrivals');
  return data.data;
}

export async function fetchBestSellers(): Promise<Product[]> {
  const { data } = await apiClient.get('/products/best-sellers');
  return data.data;
}

export async function fetchReviews(productId: string, page = 1): Promise<{ reviews: Review[]; pagination: any }> {
  const { data } = await apiClient.get(`/reviews/${productId}`, { params: { page } });
  return data.data;
}

export async function submitReview(payload: { productId: string; rating: number; title: string; comment: string }) {
  const { data } = await apiClient.post('/reviews', payload);
  return data.data;
}
