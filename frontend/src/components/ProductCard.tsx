import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { apiClient } from '../services/apiClient';
import toast from '../store/toast';
import type { Product } from '../types/api';
import { getProductImageUrl } from '../utils/productImage';

function formatPrice(p: number) {
  return `₹${(p / 100).toLocaleString('en-IN')}`;
}

interface Props { product: Product }

export default function ProductCard({ product }: Props) {
  const { isAuthenticated } = useAuthStore();
  const { addItem } = useCartStore();
  const [wishlisted, setWishlisted] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.info('Sign in to save to wishlist'); return; }
    try {
      if (wishlisted) {
        await apiClient.delete(`/wishlist/${product._id}`);
        setWishlisted(false);
        toast.info('Removed from wishlist');
      } else {
        await apiClient.post(`/wishlist/${product._id}`);
        setWishlisted(true);
        toast.success('Added to wishlist');
      }
    } catch { toast.error('Could not update wishlist'); }
  };

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.info('Sign in to add to cart'); return; }
    if (!product.sizes.length) return;
    setAddingToCart(true);
    try {
      await addItem(product._id, product.sizes[0].size, 1);
    } finally {
      setAddingToCart(false);
    }
  };

  const badge = product.isNew ? 'New' : product.isBestSeller ? 'Best Seller' : product.discountPercent > 0 ? `-${product.discountPercent}%` : null;

  return (
    <Link to={`/product/${product.slug}`} className="group block relative">
      {/* Product visual */}
      <div className="relative overflow-hidden bg-beige aspect-[3/4]">
        <img src={getProductImageUrl(product.thumbnail, product.images?.[0], product.slug)} alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />

        {/* Badge */}
        {badge && (
          <div className="absolute top-3 left-3 bg-charcoal text-ivory text-[10px] tracking-widest uppercase px-2 py-1">
            {badge}
          </div>
        )}

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-ivory/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-ivory"
        >
          <Heart
            size={14}
            className={wishlisted ? 'fill-charcoal text-charcoal' : 'text-charcoal'}
          />
        </button>

        {/* Quick add */}
        <motion.button
          onClick={handleQuickAdd}
          disabled={addingToCart || !product.sizes.some(s => s.stock > 0)}
          className="absolute bottom-0 inset-x-0 bg-charcoal/90 text-ivory text-xs tracking-[0.2em] uppercase py-3 flex items-center justify-center gap-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300 disabled:opacity-60"
        >
          <ShoppingBag size={13} />
          {addingToCart ? 'Adding…' : 'Quick Add'}
        </motion.button>
      </div>

      {/* Info */}
      <div className="mt-4 space-y-1">
        <p className="text-[10px] tracking-[0.25em] uppercase text-charcoal/50">{product.fragranceFamily}</p>
        <h3 className="font-display text-base leading-snug group-hover:text-gold transition-colors">{product.name}</h3>
        <div className="flex items-center gap-1.5">
          <Star size={11} className="fill-gold text-gold" />
          <span className="text-xs text-charcoal/60">{product.averageRating.toFixed(1)} ({product.reviewCount})</span>
        </div>
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-sm font-medium">{formatPrice(product.price)}</span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-xs text-charcoal/40 line-through">{formatPrice(product.compareAtPrice)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
