import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import * as productService from '../services/product.service';
import { productQuerySchema, createProductSchema, updateProductSchema } from '../validators/product.validator';

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const query = productQuerySchema.parse(req.query);
  const result = await productService.listProducts(query);
  sendSuccess(res, result);
});

export const getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getProductBySlug(req.params.slug);
  const related = await productService.getRelatedProducts(product);
  sendSuccess(res, { product, related });
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const input = createProductSchema.parse(req.body);
  const product = await productService.createProduct(input);
  sendSuccess(res, { product }, 'Perfume created successfully', 201);
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const input = updateProductSchema.parse(req.body);
  const product = await productService.updateProduct(req.params.id, input);
  sendSuccess(res, { product }, 'Perfume updated');
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.deactivateProduct(req.params.id);
  sendSuccess(res, { product }, 'Perfume deactivated');
});

export const getFeaturedProducts = asyncHandler(async (_req: Request, res: Response) => {
  const result = await productService.listProducts(
    productQuerySchema.parse({ isFeatured: 'true', limit: '8', sort: 'featured' })
  );
  sendSuccess(res, result.items);
});

export const getNewArrivals = asyncHandler(async (_req: Request, res: Response) => {
  const result = await productService.listProducts(
    productQuerySchema.parse({ isNew: 'true', limit: '8', sort: 'newest' })
  );
  sendSuccess(res, result.items);
});

export const getBestSellers = asyncHandler(async (_req: Request, res: Response) => {
  const result = await productService.listProducts(
    productQuerySchema.parse({ isBestSeller: 'true', limit: '8', sort: 'bestselling' })
  );
  sendSuccess(res, result.items);
});

export const validateQuery = asyncHandler(async (req: Request, _res: Response, next: Function) => {
  const result = productQuerySchema.safeParse(req.query);
  if (!result.success) {
    const errors = Object.entries(result.error.flatten().fieldErrors).map(([field, messages]) => ({
      field,
      messages
    }));
    throw ApiError.badRequest('Invalid query params', errors as unknown[]);
  }
  next();
});
