import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, AlertCircle, ShoppingBag, ArrowRight, Scale } from 'lucide-react';
import { aiFragranceSearch, intentToChips, type AiSearchResponse } from '../services/ai.service';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import toast from '../store/toast';
import { fadeUp, staggerContainer, staggerFast } from '../animations/variants';
import CompareDrawer from '../components/ai/CompareDrawer';
const fmt = (p: number) => `₹${(p / 100).toLocaleString('en-IN')}`;

const EXAMPLES = [
  'Something fresh and subtle for college under ₹2000',
  'A mature fragrance for office, not too sweet, under ₹3000',
  'Dark and seductive for date night',
  'Powerful and long-lasting for winter',
  "I don't like sweet perfumes — show me something woody and fresh"
];

const STAGES = [
  'Understanding your preferences…',
  'Exploring fragrance profiles…',
  'Finding your best matches…'
];

function LoadingStages() {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 1100);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="py-20">
      <div className="flex flex-col items-center gap-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border border-gold/30 border-t-gold rounded-full"
        />
        <AnimatePresence mode="wait">
          <motion.p
            key={stage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="text-ivory/50 text-sm tracking-wider"
          >
            {STAGES[stage]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-16 max-w-4xl mx-auto">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 border border-ivory/10 animate-pulse">
            <div className="w-20 h-24 bg-ivory/5 shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3 bg-ivory/5 w-1/3" />
              <div className="h-4 bg-ivory/5 w-2/3" />
              <div className="h-3 bg-ivory/5 w-full" />
              <div className="h-3 bg-ivory/5 w-4/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ScentIntelligence() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AiSearchResponse | null>(null);
  const [error, setError] = useState('');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const runSearch = async (q: string) => {
    if (q.trim().length < 3) {
      setError('Please describe what you are looking for.');
      return;
    }
    setError('');
    setLoading(true);
    setData(null);
    try {
      const res = await aiFragranceSearch(q);
      setData(res);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    } catch (err: any) {
      const status = err?.response?.status;
      setError(
        status === 429
          ? 'You are searching very quickly. Please wait a moment and try again.'
          : err?.response?.data?.message ?? 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) {
        toast.info('You can compare up to 3 fragrances');
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleAdd = async (productId: string, size: string) => {
    if (!isAuthenticated) {
      toast.info('Sign in to add to cart');
      return;
    }
    await addItem(productId, size, 1);
  };

  const chips = data ? intentToChips(data.intent) : [];

  return (
    <div className="min-h-screen bg-charcoal pt-28">
      <div className="mx-auto max-w-5xl px-6 py-16">
        {/* ── Header ── */}
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="text-center mb-12">
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-2 mb-5">
            <Sparkles size={14} className="text-gold" />
            <span className="text-gold text-xs tracking-[0.4em] uppercase">Scent Intelligence</span>
          </motion.div>
          <motion.h1 variants={fadeUp} className="font-display text-5xl md:text-6xl text-ivory mb-5">
            Find your fragrance
          </motion.h1>
          <motion.p variants={fadeUp} className="text-ivory/40 max-w-lg mx-auto leading-relaxed">
            Describe what you're looking for in your own words. No filters, no guesswork —
            we'll interpret your request and match it against our collection.
          </motion.p>
        </motion.div>

        {/* ── Search box ── */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-6">
          <label htmlFor="ai-query" className="sr-only">Describe what you're looking for</label>
          <textarea
            id="ai-query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                runSearch(query);
              }
            }}
            rows={3}
            maxLength={500}
            placeholder="I want something mature, fresh and subtle for office under ₹3000…"
            className="w-full bg-transparent border border-ivory/20 px-5 py-4 text-ivory placeholder-ivory/25 text-base outline-none focus:border-gold/50 transition-colors resize-none"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-ivory/20 text-xs">{query.length}/500</span>
            <button
              onClick={() => runSearch(query)}
              disabled={loading}
              className="bg-gold text-ivory px-8 py-3.5 text-xs tracking-[0.25em] uppercase hover:bg-gold-dark transition-colors disabled:opacity-50 flex items-center gap-2.5"
            >
              <Sparkles size={13} />
              {loading ? 'Searching…' : 'Find my fragrance'}
            </button>
          </div>
        </motion.div>

        {/* ── Example prompts ── */}
        {!data && !loading && (
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-10">
            <p className="text-ivory/25 text-xs tracking-widest uppercase mb-3">Try</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => { setQuery(ex); runSearch(ex); }}
                  className="text-left border border-ivory/10 text-ivory/50 px-4 py-2 text-xs hover:border-gold/40 hover:text-ivory/80 transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-3 border border-red-500/20 bg-red-500/5 px-5 py-4 mb-8">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </motion.div>
        )}

        {loading && <LoadingStages />}

        {/* ── Results ── */}
        <AnimatePresence>
          {data && !loading && (
            <motion.div ref={resultsRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              {data.notice && (
                <div className="flex items-start gap-3 border border-gold/20 bg-gold/5 px-5 py-4 mb-8">
                  <AlertCircle size={16} className="text-gold shrink-0 mt-0.5" />
                  <p className="text-ivory/60 text-sm">{data.notice}</p>
                </div>
              )}

              {/* Understood chips */}
              <div className="border-b border-ivory/10 pb-8 mb-8">
                <p className="text-gold text-xs tracking-[0.3em] uppercase mb-4">We understood your request</p>
                {chips.length > 0 ? (
                  <motion.div variants={staggerFast} initial="hidden" animate="show" className="flex flex-wrap gap-2 mb-4">
                    {chips.map((c) => (
                      <motion.span key={c} variants={fadeUp}
                        className="border border-ivory/20 text-ivory/70 px-3 py-1.5 text-xs tracking-wider">
                        {c}
                      </motion.span>
                    ))}
                  </motion.div>
                ) : (
                  <p className="text-ivory/30 text-sm mb-4">Interpreting your request broadly across the collection.</p>
                )}
                <p className="text-ivory/50 text-sm leading-relaxed">{data.explanation}</p>
              </div>

              {data.results.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="font-display text-2xl text-ivory/40 mb-4">We couldn't find an exact match.</p>
                  <Link to="/shop" className="text-ivory/60 text-sm underline underline-offset-4 hover:text-gold transition-colors">
                    Browse the full collection
                  </Link>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-display text-2xl text-ivory">
                      {data.results.length} matches
                    </h2>
                    {compareIds.length >= 2 && (
                      <button onClick={() => setCompareOpen(true)}
                        className="flex items-center gap-2 border border-gold text-gold px-5 py-2.5 text-xs tracking-[0.2em] uppercase hover:bg-gold hover:text-ivory transition-colors">
                        <Scale size={13} /> Compare {compareIds.length}
                      </button>
                    )}
                  </div>

                  <motion.div variants={staggerFast} initial="hidden" animate="show" className="space-y-4">
                    {data.results.map((r) => {
                      const p = r.product;
                      const firstSize = p.sizes?.[0];
                      const selected = compareIds.includes(r.productId);
                      return (
                        <motion.div key={r.productId} variants={fadeUp}
                          className={`border p-5 flex flex-col sm:flex-row gap-5 transition-colors ${selected ? 'border-gold/50 bg-gold/5' : 'border-ivory/10 hover:border-ivory/25'}`}>
                          <Link to={`/product/${p.slug}`} className="w-full sm:w-24 h-32 sm:h-28 bg-ivory/5 overflow-hidden shrink-0">
                            <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 bg-beige">
                              <span className="text-[9px] tracking-[0.3em] uppercase text-charcoal/40 mb-3">ÉLANÉ</span>
                              <span className="font-display text-xl leading-tight">{p.name.replace('ÉLANÉ ', '')}</span>
                            </div>
                          </Link>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-1.5">
                              <div>
                                <p className="text-ivory/35 text-[10px] tracking-[0.25em] uppercase mb-1">
                                  {p.fragranceFamily} · {p.concentration}
                                </p>
                                <Link to={`/product/${p.slug}`}
                                  className="font-display text-xl text-ivory hover:text-gold transition-colors">
                                  {p.name}
                                </Link>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-gold font-display text-lg">{Math.round(r.matchScore * 100)}%</div>
                                <div className="text-ivory/30 text-[10px] tracking-widest uppercase">Match</div>
                              </div>
                            </div>

                            <p className="text-ivory/50 text-sm leading-relaxed mb-3 italic">"{r.reason}"</p>

                            <div className="flex items-center gap-4 mb-4 text-xs text-ivory/40">
                              <span className="text-ivory font-medium text-sm">{fmt(p.price)}</span>
                              <span>★ {p.averageRating?.toFixed(1)} ({p.reviewCount})</span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Link to={`/product/${p.slug}`}
                                className="flex items-center gap-2 border border-ivory/20 text-ivory/80 px-4 py-2 text-xs tracking-[0.15em] uppercase hover:border-ivory/50 transition-colors">
                                View fragrance <ArrowRight size={11} />
                              </Link>
                              {firstSize && (
                                <button onClick={() => handleAdd(r.productId, firstSize.size)}
                                  className="flex items-center gap-2 bg-ivory/10 text-ivory px-4 py-2 text-xs tracking-[0.15em] uppercase hover:bg-ivory/20 transition-colors">
                                  <ShoppingBag size={11} /> Add to cart
                                </button>
                              )}
                              <button onClick={() => toggleCompare(r.productId)}
                                className={`flex items-center gap-2 px-4 py-2 text-xs tracking-[0.15em] uppercase transition-colors ${selected ? 'bg-gold text-ivory' : 'border border-ivory/20 text-ivory/60 hover:border-gold/50 hover:text-gold'}`}>
                                <Scale size={11} /> {selected ? 'Selected' : 'Compare'}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CompareDrawer
        open={compareOpen}
        productIds={compareIds}
        onClose={() => setCompareOpen(false)}
        onClear={() => { setCompareIds([]); setCompareOpen(false); }}
      />
    </div>
  );
}
