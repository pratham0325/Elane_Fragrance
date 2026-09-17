import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Heart, ShoppingBag, ArrowRight, Check, Scale, Sparkles } from 'lucide-react';
import { fetchProductBySlug, fetchReviews, submitReview } from '../services/product.service';
import type { Product, Review } from '../types/api';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../services/apiClient';
import toast from '../store/toast';
import ProductCard from '../components/ProductCard';
import CompareDrawer from '../components/ai/CompareDrawer';
import { fadeUp, staggerContainer, staggerFast } from '../animations/variants';
import { getProductImageUrl } from '../utils/productImage';

const fmt = (p: number) => `₹${(p / 100).toLocaleString('en-IN')}`;

function ScentBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-xs tracking-widest uppercase w-20 text-charcoal/60 shrink-0">{label}</span>
      <div className="flex-1 h-px bg-charcoal/10 relative overflow-hidden">
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: 'left', width: `${value}%` }}
          className="absolute inset-y-0 left-0 bg-gold h-[2px]"
        />
      </div>
      <span className="text-xs text-charcoal/40 w-8 text-right">{value}</span>
    </div>
  );
}

function FragrancePyramid({ top, middle, base }: { top: string[]; middle: string[]; base: string[] }) {
  const [active, setActive] = useState<string | null>(null);
  const layers = [
    { label: 'Top Notes', notes: top, desc: 'First impression — lasts 15–30 min', delay: 0 },
    { label: 'Heart Notes', notes: middle, desc: 'The true character — lasts 2–4 hours', delay: 0.1 },
    { label: 'Base Notes', notes: base, desc: 'The lasting memory — lasts 6–24 hours', delay: 0.2 },
  ];
  return (
    <div className="space-y-2">
      {layers.map(({ label, notes, desc, delay }, i) => (
        <motion.div key={label} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6, delay }}
          className="border border-charcoal/10 p-6 hover:border-gold/30 transition-colors">
          <div className="flex items-start gap-6">
            <div className="text-2xl font-display text-charcoal/20 w-8 shrink-0">0{i+1}</div>
            <div className="flex-1">
              <p className="text-xs tracking-[0.2em] uppercase text-gold mb-1">{label}</p>
              <p className="text-xs text-charcoal/40 mb-3">{desc}</p>
              <div className="flex flex-wrap gap-2">
                {notes.map((note) => (
                  <button key={note}
                    onClick={() => setActive(active === note ? null : note)}
                    className={`px-3 py-1 text-xs tracking-wider border transition-colors ${active === note ? 'bg-charcoal text-ivory border-charcoal' : 'border-charcoal/20 hover:border-charcoal'}`}>
                    {note}
                  </button>
                ))}
              </div>
              {notes.some(n => n === active) && (
                <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-3 text-xs text-charcoal/60 italic">
                  {active} — a distinctive fragrance ingredient that contributes to the overall scent profile.
                </motion.p>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ReviewsSection({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ rating: 5, title: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    fetchReviews(productId).then(r => setReviews(r.reviews)).catch(() => {});
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitReview({ productId, ...form });
      toast.success('Review submitted!');
      setShowForm(false);
      fetchReviews(productId).then(r => setReviews(r.reviews)).catch(() => {});
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not submit review');
    } finally { setSubmitting(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h3 className="font-display text-2xl">Reviews ({reviews.length})</h3>
        {isAuthenticated && !showForm && (
          <button onClick={() => setShowForm(true)} className="text-xs tracking-widest uppercase underline underline-offset-4">
            Write a Review
          </button>
        )}
      </div>

      {showForm && (
        <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit} className="border border-charcoal/10 p-6 mb-8 space-y-4">
          <div>
            <label className="text-xs tracking-widest uppercase block mb-2">Rating</label>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" onClick={() => setForm(f => ({ ...f, rating: n }))}>
                  <Star size={20} className={n <= form.rating ? 'fill-gold text-gold' : 'text-charcoal/20'} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs tracking-widest uppercase block mb-2">Title</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
              className="w-full border border-charcoal/20 px-4 py-2.5 text-sm outline-none focus:border-gold/50 bg-transparent" />
          </div>
          <div>
            <label className="text-xs tracking-widest uppercase block mb-2">Review</label>
            <textarea value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} required rows={4}
              className="w-full border border-charcoal/20 px-4 py-2.5 text-sm outline-none focus:border-gold/50 bg-transparent resize-none" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={submitting}
              className="bg-charcoal text-ivory px-6 py-2.5 text-xs tracking-widest uppercase disabled:opacity-60">
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-xs tracking-widest uppercase text-charcoal/50">Cancel</button>
          </div>
        </motion.form>
      )}

      <div className="space-y-6">
        {reviews.map(r => (
          <div key={r._id} className="pb-6 border-b border-charcoal/10">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex gap-0.5 mb-1">
                  {[1,2,3,4,5].map(n => <Star key={n} size={13} className={n <= r.rating ? 'fill-gold text-gold' : 'text-charcoal/20'} />)}
                </div>
                <p className="font-medium text-sm">{r.title}</p>
              </div>
              {r.isVerifiedBuyer && (
                <span className="flex items-center gap-1 text-[10px] tracking-wider text-green-600 uppercase">
                  <Check size={10} /> Verified
                </span>
              )}
            </div>
            <p className="text-sm text-charcoal/60 leading-relaxed">{r.comment}</p>
            <p className="text-xs text-charcoal/30 mt-2">{r.user.name} · {new Date(r.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-charcoal/40 text-sm">No reviews yet. Be the first to share your experience.</p>}
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<{ product: Product; related: Product[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [qty, setQty] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [addingCart, setAddingCart] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchProductBySlug(slug).then(d => {
      setData(d);
      setSelectedSize(d.product.sizes[0]?.size ?? '');
    }).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  const product = data?.product;
  const selectedSizeData = product?.sizes.find(s => s.size === selectedSize);

  const handleAddToCart = async () => {
    if (!isAuthenticated) { toast.info('Sign in to add to cart'); return; }
    if (!selectedSize || !product) return;
    setAddingCart(true);
    try { await addItem(product._id, selectedSize, qty); }
    finally { setAddingCart(false); }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) { toast.info('Sign in to save to wishlist'); return; }
    if (!product) return;
    try {
      if (wishlisted) { await apiClient.delete(`/wishlist/${product._id}`); setWishlisted(false); }
      else { await apiClient.post(`/wishlist/${product._id}`); setWishlisted(true); }
    } catch { toast.error('Could not update wishlist'); }
  };

  if (loading) return (
    <div className="min-h-screen pt-28 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-charcoal/20 border-t-charcoal rounded-full animate-spin" />
    </div>
  );

  if (!product) return (
    <div className="min-h-screen pt-28 flex flex-col items-center justify-center gap-4">
      <p className="font-display text-3xl">Fragrance not found</p>
      <Link to="/shop" className="text-sm underline underline-offset-4">Back to shop</Link>
    </div>
  );

  return (
    <div className="bg-ivory min-h-screen pt-24">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-charcoal/40 tracking-wider mb-10">
          <Link to="/" className="hover:text-charcoal transition-colors">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-charcoal transition-colors">Shop</Link>
          <span>/</span>
          <span className="text-charcoal">{product.name}</span>
        </nav>

        {/* Main grid */}
        <div className="grid lg:grid-cols-2 gap-16 mb-24">
          {/* Product identity */}
          <div>
            <motion.div variants={staggerContainer} initial="hidden" animate="show">
              <motion.div variants={staggerFast} className="aspect-square overflow-hidden bg-beige">
                <img src={getProductImageUrl(product.thumbnail, product.images?.[0], product.slug)} alt={product.name}
                  className="w-full h-full object-contain" />
              </motion.div>
            </motion.div>
          </div>

          {/* Info */}
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col">
            <motion.p variants={fadeUp} className="text-gold text-xs tracking-[0.3em] uppercase mb-2">{product.fragranceFamily} · {product.concentration}</motion.p>
            <motion.h1 variants={fadeUp} className="font-display text-4xl md:text-5xl mb-3">{product.name}</motion.h1>

            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-6">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(n => <Star key={n} size={14} className={n <= Math.round(product.averageRating) ? 'fill-gold text-gold' : 'text-charcoal/20'} />)}
              </div>
              <span className="text-sm text-charcoal/50">{product.averageRating.toFixed(1)} ({product.reviewCount} reviews)</span>
            </motion.div>

            <motion.p variants={fadeUp} className="text-charcoal/60 leading-relaxed mb-8">{product.shortDescription}</motion.p>

            {/* Size selector */}
            <motion.div variants={fadeUp} className="mb-6">
              <p className="text-xs tracking-[0.2em] uppercase mb-3">Size</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map(s => (
                  <button key={s.size} onClick={() => setSelectedSize(s.size)} disabled={s.stock === 0}
                    className={`px-4 py-2 text-sm border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                      selectedSize === s.size ? 'bg-charcoal text-ivory border-charcoal' : 'border-charcoal/20 hover:border-charcoal'
                    }`}>
                    {s.size}
                    {s.stock === 0 && ' (OOS)'}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Price */}
            <motion.div variants={fadeUp} className="flex items-baseline gap-3 mb-8">
              <span className="font-display text-3xl">{fmt(selectedSizeData?.price ?? product.price)}</span>
              {selectedSizeData?.compareAtPrice && selectedSizeData.compareAtPrice > (selectedSizeData?.price ?? 0) && (
                <span className="text-charcoal/40 line-through text-lg">{fmt(selectedSizeData.compareAtPrice)}</span>
              )}
            </motion.div>

            {/* Qty + Add */}
            <motion.div variants={fadeUp} className="flex gap-3 mb-6">
              <div className="flex border border-charcoal/20">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-12 flex items-center justify-center hover:bg-beige transition-colors">−</button>
                <span className="w-10 h-12 flex items-center justify-center text-sm">{qty}</span>
                <button onClick={() => setQty(q => q + 1)} className="w-10 h-12 flex items-center justify-center hover:bg-beige transition-colors">+</button>
              </div>
              <button onClick={handleAddToCart} disabled={addingCart || !selectedSize || (selectedSizeData?.stock ?? 0) === 0}
                className="flex-1 bg-charcoal text-ivory flex items-center justify-center gap-3 text-xs tracking-[0.2em] uppercase py-3 hover:bg-espresso transition-colors disabled:opacity-50">
                <ShoppingBag size={16} />
                {addingCart ? 'Adding…' : 'Add to Cart'}
              </button>
              <button onClick={handleWishlist}
                className={`w-12 border flex items-center justify-center transition-colors ${wishlisted ? 'bg-charcoal border-charcoal text-ivory' : 'border-charcoal/20 hover:border-charcoal'}`}>
                <Heart size={16} className={wishlisted ? 'fill-ivory' : ''} />
              </button>
            </motion.div>

            {/* Compare with Scent Intelligence */}
            <motion.div variants={fadeUp} className="border border-gold/30 bg-gold/5 p-5 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={13} className="text-gold" />
                <span className="text-gold text-xs tracking-[0.25em] uppercase">Scent Intelligence</span>
              </div>
              <p className="text-sm text-charcoal/60 mb-4">
                Unsure between this and another fragrance? Compare them side by side.
              </p>
              <button
                onClick={() => {
                  const others = (data?.related ?? []).slice(0, 2).map((r) => r._id);
                  setCompareIds([product._id, ...others]);
                  setCompareOpen(true);
                }}
                className="flex items-center gap-2 border border-charcoal px-5 py-2.5 text-xs tracking-[0.2em] uppercase hover:bg-charcoal hover:text-ivory transition-colors"
              >
                <Scale size={12} /> Compare with Scent Intelligence
              </button>
            </motion.div>

            {/* Meta */}
            <motion.div variants={fadeUp} className="border-t border-charcoal/10 pt-6 space-y-2">
              <p className="text-xs text-charcoal/50"><span className="uppercase tracking-wider mr-2">Gender</span>{product.gender}</p>
              <p className="text-xs text-charcoal/50"><span className="uppercase tracking-wider mr-2">Family</span>{product.fragranceFamily}</p>
              {(selectedSizeData?.stock ?? 0) > 0 && (selectedSizeData?.stock ?? 0) <= 5 && (
                <p className="text-xs text-amber-600">Only {selectedSizeData?.stock} left in stock</p>
              )}
            </motion.div>
          </motion.div>
        </div>

        {/* Tabs section */}
        <div className="border-t border-charcoal/10 pt-20 space-y-24">
          {/* Full description */}
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}
            className="grid md:grid-cols-2 gap-16">
            <div>
              <motion.p variants={fadeUp} className="text-gold text-xs tracking-[0.4em] uppercase mb-4">Fragrance Story</motion.p>
              <motion.h2 variants={fadeUp} className="font-display text-3xl mb-6">About {product.name}</motion.h2>
              <motion.p variants={fadeUp} className="text-charcoal/60 leading-loose">{product.description}</motion.p>
            </div>
            <motion.div variants={staggerContainer}>
              <motion.p variants={fadeUp} className="text-gold text-xs tracking-[0.4em] uppercase mb-6">Scent Profile</motion.p>
              <div className="space-y-5">
                {Object.entries(product.scentProfile).map(([k, v]) => (
                  <ScentBar key={k} label={k} value={v} />
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Fragrance Pyramid */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <p className="text-gold text-xs tracking-[0.4em] uppercase mb-4">The Pyramid</p>
            <h2 className="font-display text-3xl mb-8">Fragrance Notes</h2>
            <FragrancePyramid top={product.topNotes} middle={product.middleNotes} base={product.baseNotes} />
          </motion.div>

          {/* Reviews */}
          <div>
            <ReviewsSection productId={product._id} />
          </div>
        </div>

        {/* Related */}
        {data?.related && data.related.length > 0 && (
          <div className="mt-24 pt-16 border-t border-charcoal/10">
            <div className="flex items-center justify-between mb-12">
              <h2 className="font-display text-3xl">You May Also Like</h2>
              <Link to="/shop" className="flex items-center gap-2 text-xs tracking-widest uppercase hover:text-gold transition-colors">
                View All <ArrowRight size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {data.related.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        )}
      </div>

      <CompareDrawer
        open={compareOpen}
        productIds={compareIds}
        onClose={() => setCompareOpen(false)}
      />
    </div>
  );
}
