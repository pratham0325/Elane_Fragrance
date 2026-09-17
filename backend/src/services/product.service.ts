import slugify from 'slugify';
import { FilterQuery } from 'mongoose';
import { Product, IProduct } from '../models/Product.model';
import { ApiError } from '../utils/ApiError';
import { z } from 'zod';
import { productQuerySchema, createProductSchema, updateProductSchema } from '../validators/product.validator';

type ProductQuery = z.infer<typeof productQuerySchema>;
type CreateProductInput = z.infer<typeof createProductSchema>;
type UpdateProductInput = z.infer<typeof updateProductSchema>;

const SORT_MAP: Record<ProductQuery['sort'], Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  rating: { averageRating: -1 },
  bestselling: { isBestSeller: -1, reviewCount: -1 },
  featured: { isFeatured: -1, createdAt: -1 }
};

export async function listProducts(query: ProductQuery) {
  const filter: FilterQuery<IProduct> = { isActive: true };

  if (query.search) filter.$text = { $search: query.search };
  if (query.gender) filter.gender = query.gender;
  if (query.fragranceFamily) filter.fragranceFamily = query.fragranceFamily;
  if (query.concentration) filter.concentration = query.concentration;
  if (query.category) filter.category = query.category;
  if (query.isFeatured) filter.isFeatured = true;
  if (query.isNew) filter.isNew = true;
  if (query.isBestSeller) filter.isBestSeller = true;
  if (query.minRating) filter.averageRating = { $gte: query.minRating };
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = query.minPrice;
    if (query.maxPrice) filter.price.$lte = query.maxPrice;
  }

  const skip = (query.page - 1) * query.limit;

  const [items, total] = await Promise.all([
    Product.find(filter).sort(SORT_MAP[query.sort]).skip(skip).limit(query.limit).populate('category', 'name slug'),
    Product.countDocuments(filter)
  ]);

  return {
    items,
    pagination: {
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit)
    }
  };
}

export async function getProductBySlug(slug: string) {
  const product = await Product.findOne({ slug, isActive: true }).populate('category', 'name slug');
  if (!product) throw ApiError.notFound('Perfume not found');
  return product;
}

export async function getRelatedProducts(product: IProduct, limit = 4) {
  return Product.find({
    _id: { $ne: product._id },
    isActive: true,
    $or: [{ fragranceFamily: product.fragranceFamily }, { category: product.category }]
  })
    .limit(limit)
    .select('name slug thumbnail price averageRating fragranceFamily');
}

function deriveBasePrice(sizes: CreateProductInput['sizes']) {
  return Math.min(...sizes.map((s) => s.price));
}

export async function createProduct(input: CreateProductInput) {
  const slug = slugify(input.name, { lower: true, strict: true });
  const existing = await Product.findOne({ slug });
  if (existing) throw ApiError.conflict('A perfume with this name already exists');

  const product = await Product.create({
    ...input,
    slug,
    price: deriveBasePrice(input.sizes)
  });
  return product;
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  const product = await Product.findById(id);
  if (!product) throw ApiError.notFound('Perfume not found');

  if (input.name) {
    product.slug = slugify(input.name, { lower: true, strict: true });
  }
  Object.assign(product, input);
  if (input.sizes && input.sizes.length > 0) {
    product.price = deriveBasePrice(input.sizes as CreateProductInput['sizes']);
  }
  await product.save();
  return product;
}

export async function deactivateProduct(id: string) {
  const product = await Product.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!product) throw ApiError.notFound('Perfume not found');
  return product;
}

export async function adjustStock(productId: string, size: string, delta: number) {
  const product = await Product.findOne({ _id: productId, 'sizes.size': size });
  if (!product) throw ApiError.notFound('Product/size not found');

  const sizeEntry = product.sizes.find((s) => s.size === size);
  if (!sizeEntry) throw ApiError.notFound('Size not found');

  const newStock = sizeEntry.stock + delta;
  if (newStock < 0) throw ApiError.badRequest('Insufficient stock');

  sizeEntry.stock = newStock;
  await product.save();
  return product;
}
