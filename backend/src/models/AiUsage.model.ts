import { Schema, model, Document, Types } from 'mongoose';

export type AiFeature = 'fragrance_search' | 'product_comparison' | 'embedding';

export interface IAiUsage extends Omit<Document, 'model'> {
  user?: Types.ObjectId;
  feature: AiFeature;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  latencyMs: number;
  success: boolean;
  usedFallback: boolean;
  errorMessage?: string;
  estimatedCostUsd?: number;
  createdAt: Date;
}

const aiUsageSchema = new Schema<IAiUsage>(
  {
    // Optional: anonymous searches are allowed, so user may be absent.
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    feature: {
      type: String,
      enum: ['fragrance_search', 'product_comparison', 'embedding'],
      required: true,
      index: true
    },
    model: { type: String, required: true },
    promptTokens: Number,
    completionTokens: Number,
    totalTokens: Number,
    latencyMs: { type: Number, required: true },
    success: { type: Boolean, required: true, index: true },
    usedFallback: { type: Boolean, default: false },
    errorMessage: String,
    estimatedCostUsd: Number
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

aiUsageSchema.index({ createdAt: -1 });

export const AiUsage = model<IAiUsage>('AiUsage', aiUsageSchema);
