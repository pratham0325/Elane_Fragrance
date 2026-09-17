import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import * as categoryService from '../services/category.service';
import { z } from 'zod';

const createCategorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  image: z.string().optional()
});

export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await categoryService.listCategories();
  sendSuccess(res, categories);
});

export const getCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
  const cat = await categoryService.getCategoryBySlug(req.params.slug);
  sendSuccess(res, cat);
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, image } = createCategorySchema.parse(req.body);
  const cat = await categoryService.createCategory(name, description, image);
  sendSuccess(res, cat, 'Category created', 201);
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.params.id) throw ApiError.badRequest('Category id required');
  const cat = await categoryService.updateCategory(req.params.id, req.body);
  sendSuccess(res, cat, 'Category updated');
});
