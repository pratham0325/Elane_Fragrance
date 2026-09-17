export const FRAGRANCE_FAMILIES = [
  'Woody',
  'Floral',
  'Oriental',
  'Fresh',
  'Citrus',
  'Gourmand',
  'Aquatic',
  'Spicy',
  'Musky'
] as const;
export type FragranceFamily = (typeof FRAGRANCE_FAMILIES)[number];

export const GENDERS = ['Men', 'Women', 'Unisex'] as const;
export type Gender = (typeof GENDERS)[number];

export const CONCENTRATIONS = ['Eau de Parfum', 'Eau de Toilette', 'Parfum', 'Cologne'] as const;
export type Concentration = (typeof CONCENTRATIONS)[number];

export const USER_ROLES = ['CUSTOMER', 'ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ORDER_STATUSES = [
  'Placed',
  'Confirmed',
  'Processing',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled'
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ['COD', 'ONLINE'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
