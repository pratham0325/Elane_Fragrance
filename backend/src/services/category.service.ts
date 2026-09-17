import slugify from 'slugify';
import { Category } from '../models/Category.model';
import { ApiError } from '../utils/ApiError';

export async function listCategories() {
  return Category.find({ isActive: true }).sort({ name: 1 });
}

export async function getCategoryBySlug(slug: string) {
  const cat = await Category.findOne({ slug, isActive: true });
  if (!cat) throw ApiError.notFound('Category not found');
  return cat;
}

export async function createCategory(name: string, description?: string, image?: string) {
  const slug = slugify(name, { lower: true, strict: true });
  const existing = await Category.findOne({ slug });
  if (existing) throw ApiError.conflict('Category already exists');
  return Category.create({ name, slug, description, image });
}

export async function updateCategory(id: string, data: { name?: string; description?: string; image?: string; isActive?: boolean }) {
  const cat = await Category.findById(id);
  if (!cat) throw ApiError.notFound('Category not found');
  if (data.name) {
    cat.name = data.name;
    cat.slug = slugify(data.name, { lower: true, strict: true });
  }
  if (data.description !== undefined) cat.description = data.description;
  if (data.image !== undefined) cat.image = data.image;
  if (data.isActive !== undefined) cat.isActive = data.isActive;
  await cat.save();
  return cat;
}
