import { Schema, model, Document, Types } from 'mongoose';

export interface ICartItem {
  _id?: Types.ObjectId;
  product: Types.ObjectId;
  size: string;
  quantity: number;
  priceAtAdd: number;
}

export interface ICart extends Document {
  user: Types.ObjectId;
  items: ICartItem[];
  couponCode?: string;
  updatedAt: Date;
  createdAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    size: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    priceAtAdd: { type: Number, required: true }
  },
  { _id: true }
);

const cartSchema = new Schema<ICart>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    items: [cartItemSchema],
    couponCode: { type: String }
  },
  { timestamps: true }
);

export const Cart = model<ICart>('Cart', cartSchema);
