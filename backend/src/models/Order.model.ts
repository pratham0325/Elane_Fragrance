import { Schema, model, Document, Types } from 'mongoose';
import { ORDER_STATUSES, OrderStatus, PAYMENT_METHODS, PaymentMethod, PAYMENT_STATUSES, PaymentStatus } from '../types/enums';
import { IAddress } from './User.model';

export interface IOrderItem {
  product: Types.ObjectId;
  name: string;
  image: string;
  size: string;
  quantity: number;
  price: number;
}

export interface IOrderStatusEvent {
  status: OrderStatus;
  note?: string;
  at: Date;
}

export interface IOrder extends Document {
  orderNumber: string;
  user: Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IAddress;
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  total: number;
  couponCode?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  timeline: IOrderStatusEvent[];
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    size: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true }
  },
  { _id: false }
);

const timelineSchema = new Schema<IOrderStatusEvent>(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    note: String,
    at: { type: Date, default: Date.now }
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    shippingAddress: { type: Schema.Types.Mixed, required: true },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    couponCode: String,
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'PENDING' },
    status: { type: String, enum: ORDER_STATUSES, default: 'Placed', index: true },
    timeline: { type: [timelineSchema], default: () => [{ status: 'Placed', at: new Date() }] }
  },
  { timestamps: true }
);

export const Order = model<IOrder>('Order', orderSchema);
