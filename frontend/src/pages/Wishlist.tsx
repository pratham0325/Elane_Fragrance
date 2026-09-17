import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiClient } from '../services/apiClient';
import { useAuthStore } from '../store/authStore';
import ProductCard from '../components/ProductCard';
import { staggerFast, fadeUp } from '../animations/variants';
import type { Product } from '../types/api';

export default function Wishlist() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    apiClient.get('/wishlist').then(r => setProducts(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) return (
    <div className="min-h-screen pt-32 flex flex-col items-center justify-center gap-6">
      <Heart size={48} className="text-charcoal/20" />
      <p className="font-display text-3xl">Sign in to view your wishlist</p>
      <Link to="/login" className="bg-charcoal text-ivory px-8 py-3 text-xs tracking-widest uppercase">Sign In</Link>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen pt-32 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-charcoal/20 border-t-charcoal rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-ivory pt-28">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-gold text-xs tracking-[0.4em] uppercase mb-3">Saved Fragrances</p>
        <h1 className="font-display text-5xl mb-3">Wishlist</h1>
        <p className="text-charcoal/50 text-sm mb-12">{products.length} {products.length === 1 ? 'fragrance' : 'fragrances'} saved</p>
        {products.length === 0 ? (
          <div className="py-24 text-center">
            <Heart size={48} className="text-charcoal/10 mx-auto mb-6" />
            <p className="font-display text-2xl text-charcoal/40 mb-4">Nothing saved yet</p>
            <Link to="/shop" className="text-sm underline underline-offset-4">Explore the collection</Link>
          </div>
        ) : (
          <motion.div variants={staggerFast} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {products.map(p => (
              <motion.div key={p._id} variants={fadeUp}><ProductCard product={p} /></motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
