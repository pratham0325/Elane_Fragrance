import { Cart } from '../models/Cart.model';
import { Product } from '../models/Product.model';
import { ApiError } from '../utils/ApiError';

export async function getCart(userId: string) {
  const cart = await Cart.findOne({ user: userId }).populate('items.product', 'name slug thumbnail sizes isActive');
  return cart ?? { user: userId, items: [], couponCode: undefined };
}

export async function addItem(userId: string, productId: string, size: string, quantity: number) {
  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw ApiError.notFound('Product not found');

  const sizeEntry = product.sizes.find((s) => s.size === size);
  if (!sizeEntry) throw ApiError.badRequest('Size not available');
  if (sizeEntry.stock < quantity) throw ApiError.badRequest(`Only ${sizeEntry.stock} units in stock`);

  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });

  const existing = cart.items.find(
    (item) => item.product.toString() === productId && item.size === size
  );

  if (existing) {
    const newQty = existing.quantity + quantity;
    if (sizeEntry.stock < newQty) throw ApiError.badRequest(`Only ${sizeEntry.stock} units available`);
    existing.quantity = newQty;
  } else {
    cart.items.push({ product: product._id, size, quantity, priceAtAdd: sizeEntry.price });
  }

  await cart.save();
  return getCart(userId);
}

export async function updateItem(userId: string, itemId: string, quantity: number) {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw ApiError.notFound('Cart not found');

  const item = cart.items.find((entry: any) => entry._id?.toString() === itemId);
  if (!item) throw ApiError.notFound('Cart item not found');

  if (quantity <= 0) {
    cart.items = cart.items.filter((entry: any) => entry._id?.toString() !== itemId);
  } else {
    const product = await Product.findById(item.product);
    const sizeEntry = product?.sizes.find((s) => s.size === item.size);
    if (!sizeEntry || sizeEntry.stock < quantity) throw ApiError.badRequest('Insufficient stock');
    item.quantity = quantity;
  }

  await cart.save();
  return getCart(userId);
}

export async function removeItem(userId: string, itemId: string) {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw ApiError.notFound('Cart not found');
  cart.items = cart.items.filter((i: any) => i._id?.toString() !== itemId) as typeof cart.items;
  await cart.save();
  return getCart(userId);
}

export async function clearCart(userId: string) {
  await Cart.findOneAndUpdate({ user: userId }, { items: [], couponCode: undefined });
}
