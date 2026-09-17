import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { fadeUp, staggerContainer } from '../animations/variants';
import { getProductImageUrl } from '../utils/productImage';

const fmt = (p: number) => `₹${(p / 100).toLocaleString('en-IN')}`;

export default function Cart() {
  const { items, fetchCart, updateItem, removeItem, subtotal } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => { if (isAuthenticated) fetchCart(); }, [isAuthenticated]);

  const sub = subtotal();
  const shipping = sub >= 100000 ? 0 : 9900;
  const tax = Math.round(sub * 0.18);
  const total = sub + shipping + tax;

  if (!isAuthenticated) return (
    <div className="min-h-screen pt-32 flex flex-col items-center justify-center gap-6 px-6">
      <ShoppingBag size={48} className="text-charcoal/20" />
      <p className="font-display text-3xl">Sign in to view your cart</p>
      <Link to="/login" className="bg-charcoal text-ivory px-8 py-3 text-xs tracking-widest uppercase">Sign In</Link>
    </div>
  );

  if (items.length === 0) return (
    <div className="min-h-screen pt-32 flex flex-col items-center justify-center gap-6 px-6">
      <ShoppingBag size={48} className="text-charcoal/20" />
      <p className="font-display text-3xl">Your cart is empty</p>
      <p className="text-charcoal/50">Discover fragrances that speak to you.</p>
      <Link to="/shop" className="bg-charcoal text-ivory px-8 py-3 text-xs tracking-widest uppercase">Explore Collection</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-ivory pt-28">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <motion.div variants={staggerContainer} initial="hidden" animate="show">
          <motion.p variants={fadeUp} className="text-gold text-xs tracking-[0.4em] uppercase mb-3">Your Selection</motion.p>
          <motion.h1 variants={fadeUp} className="font-display text-5xl mb-12">Your Cart</motion.h1>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Items */}
          <div className="lg:col-span-2 space-y-6">
            {items.map((item, i) => (
              <motion.div key={item._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="flex gap-5 py-5 border-b border-charcoal/10">
                <Link to={`/product/${item.product.slug}`} className="w-24 h-28 bg-beige overflow-hidden shrink-0">
                  <img src={getProductImageUrl(item.product.thumbnail, null, item.product.slug)} alt={item.product.name}
                    className="w-full h-full object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <Link to={`/product/${item.product.slug}`} className="font-display text-lg hover:text-gold transition-colors">
                        {item.product.name}
                      </Link>
                      <p className="text-xs text-charcoal/50 mt-0.5">{item.size}</p>
                    </div>
                    <button onClick={() => removeItem(item._id)} className="text-charcoal/30 hover:text-red-500 transition-colors shrink-0">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center border border-charcoal/20">
                      <button onClick={() => updateItem(item._id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-beige transition-colors">
                        <Minus size={12} />
                      </button>
                      <span className="w-8 h-8 flex items-center justify-center text-sm">{item.quantity}</span>
                      <button onClick={() => updateItem(item._id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-beige transition-colors">
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="font-medium">{fmt(item.priceAtAdd * item.quantity)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Summary */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="lg:col-span-1">
            <div className="bg-beige p-8 sticky top-28">
              <h2 className="font-display text-xl mb-6">Order Summary</h2>
              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between"><span className="text-charcoal/60">Subtotal</span><span>{fmt(sub)}</span></div>
                <div className="flex justify-between"><span className="text-charcoal/60">Shipping</span><span>{shipping === 0 ? 'Free' : fmt(shipping)}</span></div>
                <div className="flex justify-between"><span className="text-charcoal/60">GST (18%)</span><span>{fmt(tax)}</span></div>
              </div>
              <div className="border-t border-charcoal/20 pt-4 mb-8">
                <div className="flex justify-between font-medium text-lg">
                  <span>Total</span><span>{fmt(total)}</span>
                </div>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-charcoal/40 mb-6 text-center">Free shipping on orders above ₹1,000</p>
              )}
              <button onClick={() => navigate('/checkout')}
                className="w-full bg-charcoal text-ivory py-4 text-xs tracking-[0.25em] uppercase hover:bg-espresso transition-colors">
                Proceed to Checkout
              </button>
              <Link to="/shop" className="block text-center mt-4 text-xs text-charcoal/50 hover:text-charcoal transition-colors underline underline-offset-4">
                Continue Shopping
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
