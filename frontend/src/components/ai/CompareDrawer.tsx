import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check, AlertCircle, Award } from 'lucide-react';
import { aiCompareProducts, type ComparisonResponse } from '../../services/ai.service';

interface Props {
  open: boolean;
  productIds: string[];
  onClose: () => void;
  onClear?: () => void;
}

const STAGES = ['Reading fragrance profiles…', 'Weighing trade-offs…', 'Choosing your best match…'];

export default function CompareDrawer({ open, productIds, onClose, onClear }: Props) {
  const [data, setData] = useState<ComparisonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needs, setNeeds] = useState('');
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 1000);
    return () => clearInterval(t);
  }, [loading]);

  // Reset when the selection changes
  useEffect(() => { setData(null); setError(''); }, [productIds.join(',')]);

  const run = async () => {
    if (productIds.length < 2) return;
    setLoading(true);
    setError('');
    setStage(0);
    try {
      setData(await aiCompareProducts(productIds, needs || undefined));
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not complete the comparison. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nameOf = (id: string) => data?.products.find((p) => p._id === id)?.name ?? '';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm" />

          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 inset-y-0 z-[100] w-full max-w-2xl bg-charcoal overflow-y-auto"
            role="dialog" aria-label="Scent Intelligence comparison"
          >
            {/* Header */}
            <div className="sticky top-0 bg-charcoal border-b border-ivory/10 px-7 py-5 flex items-start justify-between z-10">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles size={13} className="text-gold" />
                  <span className="text-gold text-xs tracking-[0.3em] uppercase">Scent Intelligence</span>
                </div>
                <p className="font-display text-2xl text-ivory">Let's find your best match.</p>
              </div>
              <button onClick={onClose} aria-label="Close" className="text-ivory/40 hover:text-ivory transition-colors mt-1">
                <X size={20} />
              </button>
            </div>

            <div className="px-7 py-6">
              {/* Selected products */}
              <div className="flex flex-wrap gap-2 mb-6">
                {productIds.map((id, i) => (
                  <span key={id} className="border border-ivory/20 text-ivory/60 px-3 py-1.5 text-xs tracking-wider">
                    {data ? nameOf(id) : `Fragrance ${i + 1}`}
                  </span>
                ))}
              </div>

              {!data && !loading && (
                <>
                  <label htmlFor="needs" className="block text-ivory/50 text-xs tracking-[0.2em] uppercase mb-3">
                    Tell us what matters (optional)
                  </label>
                  <textarea
                    id="needs" value={needs} onChange={(e) => setNeeds(e.target.value)} rows={3} maxLength={500}
                    placeholder="I want something for college and dates. I don't like very strong perfumes."
                    className="w-full bg-transparent border border-ivory/20 px-4 py-3 text-ivory placeholder-ivory/25 text-sm outline-none focus:border-gold/50 transition-colors resize-none mb-4"
                  />
                  <button onClick={run}
                    className="w-full bg-gold text-ivory py-3.5 text-xs tracking-[0.25em] uppercase hover:bg-gold-dark transition-colors flex items-center justify-center gap-2.5">
                    <Sparkles size={13} /> Ask Scent Intelligence
                  </button>
                </>
              )}

              {loading && (
                <div className="py-16 flex flex-col items-center gap-5">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className="w-9 h-9 border border-gold/30 border-t-gold rounded-full" />
                  <AnimatePresence mode="wait">
                    <motion.p key={stage} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                      className="text-ivory/50 text-sm tracking-wider">{STAGES[stage]}</motion.p>
                  </AnimatePresence>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-3 border border-red-500/20 bg-red-500/5 px-4 py-3">
                  <AlertCircle size={15} className="text-red-400 shrink-0" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {data && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                  {data.notice && (
                    <div className="flex items-start gap-3 border border-gold/20 bg-gold/5 px-4 py-3 mb-6">
                      <AlertCircle size={15} className="text-gold shrink-0 mt-0.5" />
                      <p className="text-ivory/60 text-xs">{data.notice}</p>
                    </div>
                  )}

                  {/* Comparison table */}
                  {data.attributes.length > 0 && (
                    <div className="mb-8 overflow-x-auto">
                      <table className="w-full text-sm border border-ivory/10">
                        <thead>
                          <tr className="border-b border-ivory/10">
                            <th className="text-left px-4 py-3 text-ivory/30 text-[10px] tracking-[0.2em] uppercase font-normal" />
                            {data.products.map((p) => (
                              <th key={p._id} className="text-left px-4 py-3 font-display text-ivory text-sm font-normal whitespace-nowrap">
                                {p.name.replace('ÉLANÉ ', '')}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {data.attributes.map((attr) => (
                            <tr key={attr.label} className="border-b border-ivory/5 last:border-0">
                              <td className="px-4 py-2.5 text-ivory/40 text-xs whitespace-nowrap">{attr.label}</td>
                              {data.products.map((p) => {
                                const v = attr.values.find((x) => x.productId === p._id)?.value ?? '—';
                                const strong = ['Excellent', 'Very Long', 'High'].includes(v);
                                return (
                                  <td key={p._id} className={`px-4 py-2.5 text-xs ${strong ? 'text-gold' : 'text-ivory/60'}`}>
                                    {v}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Recommendation */}
                  <div className="border border-gold/30 bg-gold/5 p-6 mb-8">
                    <div className="flex items-center gap-2 mb-3">
                      <Award size={14} className="text-gold" />
                      <p className="text-gold text-xs tracking-[0.3em] uppercase">Our recommendation</p>
                    </div>
                    <p className="font-display text-2xl text-ivory mb-3">{data.recommendation.productName}</p>
                    <p className="text-ivory/60 text-sm leading-relaxed italic mb-5">"{data.recommendation.reason}"</p>
                    {(() => {
                      const rec = data.products.find((p) => p._id === data.recommendation.productId);
                      return rec ? (
                        <Link to={`/product/${rec.slug}`} onClick={onClose}
                          className="inline-block bg-gold text-ivory px-6 py-2.5 text-xs tracking-[0.2em] uppercase hover:bg-gold-dark transition-colors">
                          View {rec.name.replace('ÉLANÉ ', '')}
                        </Link>
                      ) : null;
                    })()}
                  </div>

                  {/* Per-product breakdown */}
                  <div className="space-y-5">
                    {data.comparison.map((c) => (
                      <div key={c.productId} className="border border-ivory/10 p-5">
                        <p className="font-display text-lg text-ivory mb-4">{c.productName}</p>
                        <div className="grid sm:grid-cols-2 gap-5 text-xs">
                          <div>
                            <p className="text-ivory/30 tracking-[0.2em] uppercase mb-2.5">Strengths</p>
                            <ul className="space-y-1.5">
                              {c.strengths.map((s, i) => (
                                <li key={i} className="flex items-start gap-2 text-ivory/60">
                                  <Check size={11} className="text-gold shrink-0 mt-0.5" />{s}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-ivory/30 tracking-[0.2em] uppercase mb-2.5">Trade-offs</p>
                            <ul className="space-y-1.5">
                              {c.weaknesses.map((w, i) => (
                                <li key={i} className="text-ivory/50">— {w}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        {c.bestFor.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-ivory/5">
                            <p className="text-ivory/30 tracking-[0.2em] uppercase text-xs mb-2.5">Best for</p>
                            <div className="flex flex-wrap gap-1.5">
                              {c.bestFor.map((b) => (
                                <span key={b} className="border border-ivory/15 text-ivory/50 px-2.5 py-1 text-[11px]">{b}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 mt-8">
                    <button onClick={() => { setData(null); setNeeds(''); }}
                      className="flex-1 border border-ivory/20 text-ivory/70 py-3 text-xs tracking-[0.2em] uppercase hover:border-ivory/50 transition-colors">
                      Ask again
                    </button>
                    {onClear && (
                      <button onClick={onClear}
                        className="flex-1 border border-ivory/20 text-ivory/70 py-3 text-xs tracking-[0.2em] uppercase hover:border-ivory/50 transition-colors">
                        Clear selection
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
