import { Order } from '../models/Order.model';
import { Cart } from '../models/Cart.model';
import { Product } from '../models/Product.model';
import { User, IAddress } from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import * as couponService from './coupon.service';

function generateOrderNumber(): string {
  return `EL-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

export interface CreateOrderInput {
  shippingAddressIndex: number;
  paymentMethod: 'COD' | 'ONLINE';
  couponCode?: string;
}

export async function createOrder(userId: string, input: CreateOrderInput) {
  // Get cart
  const cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart || cart.items.length === 0) throw ApiError.badRequest('Cart is empty');

  // Get user & address
  const user = await User.findById(userId);
  if (!user) throw ApiError.unauthorized();
  const address = user.addresses[input.shippingAddressIndex];
  if (!address) throw ApiError.badRequest('Invalid shipping address');

  // Build order items & calculate subtotal
  const orderItems = cart.items.map((item: any) => {
    const product = item.product;
    return {
      product: product._id,
      name: product.name,
      image: product.thumbnail,
      size: item.size,
      quantity: item.quantity,
      price: item.priceAtAdd
    };
  });

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Calculate discount if coupon
  let discount = 0;
  if (input.couponCode) {
    try {
      const result = await couponService.validateCoupon(input.couponCode, subtotal);
      discount = result.discount;
      await couponService.incrementUsage(input.couponCode);
    } catch (e) {
      // Coupon invalid but don't fail order — just no discount
    }
  }

  // For now, no tax + free shipping for India (Phase 10+)
  const tax = 0;
  const shippingFee = 0;
  const total = subtotal - discount + tax + shippingFee;

  // Create order
  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    user: userId,
    items: orderItems,
    shippingAddress: address,
    subtotal,
    discount,
    shippingFee,
    tax,
    total,
    couponCode: input.couponCode,
    paymentMethod: input.paymentMethod,
    paymentStatus: input.paymentMethod === 'COD' ? 'PENDING' : 'PENDING',
    status: 'Placed'
  });

  // Clear cart
  await Cart.findOneAndUpdate({ user: userId }, { items: [], couponCode: undefined });

  return order;
}

export async function getOrders(userId: string) {
  return Order.find({ user: userId }).populate('items.product', 'name').sort({ createdAt: -1 });
}

export async function getOrder(orderId: string, userId?: string) {
  const filter: any = { _id: orderId };
  if (userId) filter.user = userId; // Customer can only see own orders
  const order = await Order.findOne(filter).populate('items.product', 'name thumbnail');
  if (!order) throw ApiError.notFound('Order not found');
  return order;
}

export async function updateOrderStatus(orderId: string, status: string, note?: string) {
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');
  order.status = status as any;
  order.timeline.push({ status: status as any, note, at: new Date() });
  await order.save();
  return order;
}

export async function markOrderPaid(orderId: string) {
  const order = await Order.findByIdAndUpdate(
    orderId,
    { paymentStatus: 'PAID', status: 'Confirmed' },
    { new: true }
  );
  if (!order) throw ApiError.notFound('Order not found');
  return order;
}

// Admin analytics
export async function getOrderStats() {
  const [totalOrders, totalRevenue, ordersByStatus] = await Promise.all([
    Order.countDocuments(),
    Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
  ]);

  return {
    totalOrders,
    totalRevenue: totalRevenue[0]?.total ?? 0,
    ordersByStatus: Object.fromEntries(ordersByStatus.map((x) => [x._id, x.count]))
  };
}

// Direct address version (used by updated order route)
export async function createOrderDirect(
  userId: string,
  input: {
    shippingAddress: Record<string, unknown>;
    paymentMethod: 'COD' | 'ONLINE';
    couponCode?: string;
  }
) {
  const cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart || cart.items.length === 0) throw ApiError.badRequest('Cart is empty');

  const orderItems = (cart.items as any[]).map((item) => {
    const product = item.product;
    const sizeEntry = product.sizes?.find((s: any) => s.size === item.size);
    return {
      product: product._id,
      name: product.name,
      image: product.thumbnail,
      size: item.size,
      quantity: item.quantity,
      price: sizeEntry?.price ?? item.priceAtAdd
    };
  });

  const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shippingFee = subtotal >= 100000 ? 0 : 9900;
  const tax = Math.round(subtotal * 0.18);

  let discount = 0;
  let appliedCoupon: string | undefined;
  if (input.couponCode) {
    try {
      const result = await couponService.validateCoupon(input.couponCode, subtotal);
      discount = result.discount;
      appliedCoupon = result.code;
      await couponService.incrementUsage(input.couponCode);
    } catch { /* no discount */ }
  }

  const total = subtotal + shippingFee + tax - discount;

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    user: userId,
    items: orderItems,
    shippingAddress: input.shippingAddress,
    subtotal,
    discount,
    shippingFee,
    tax,
    total,
    couponCode: appliedCoupon,
    paymentMethod: input.paymentMethod,
    paymentStatus: 'PENDING',
    status: 'Placed',
    timeline: [{ status: 'Placed', at: new Date() }]
  });

  // Deduct stock
  for (const item of orderItems) {
    await Product.updateOne(
      { _id: item.product, 'sizes.size': item.size },
      { $inc: { 'sizes.$.stock': -item.quantity } }
    );
  }

  await Cart.findOneAndUpdate({ user: userId }, { items: [], couponCode: undefined });

  return order;
}
