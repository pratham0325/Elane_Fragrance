import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { fetchProducts, type ProductFilters } from '../services/product.service';
import type { Product } from '../types/api';
import ProductCard from '../components/ProductCard';
import { fadeUp, staggerFast } from '../animations/variants';

const FAMILIES = ['Woody','Floral','Oriental','Fresh','Citrus','Gourmand','Aquatic','Spicy','Musky'];
const GENDERS = ['Men','Women','Unisex'];
const CONCENTRATIONS = ['Eau de Parfum','Eau de Toilette','Parfum','Cologne'];
const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'bestselling', label: 'Best Selling' },
];

function FilterPanel({ filters, setFilters, onClose }: { filters: ProductFilters; setFilters: (f: ProductFilters) => void; onClose?: () => void }) {
  const set = (key: keyof ProductFilters, val: unknown) => setFilters({ ...filters, [key]: val, page: 1 });
  const toggle = (key: keyof ProductFilters, val: string) => set(key, (filters[key] as string) === val ? undefined : val);

  const CheckGroup = ({ label, options, filterKey }: { label: string; options: string[]; filterKey: keyof ProductFilters }) => (
    <div className="mb-8">
      <p className="text-xs tracking-[0.2em] uppercase mb-4 font-medium">{label}</p>
      <div className="space-y-2">
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-3 cursor-pointer group" onClick={() => toggle(filterKey, opt)}>
            <div className={`w-4 h-4 border transition-colors ${(filters[filterKey] as string) === opt ? 'bg-charcoal border-charcoal' : 'border-charcoal/30 group-hover:border-charcoal'}`} />
            <span className="text-sm text-charcoal/70 group-hover:text-charcoal transition-colors">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xs tracking-[0.3em] uppercase font-medium">Filters</h3>
        {onClose && <button onClick={onClose}><X size={18} /></button>}
      </div>
      <div className="flex-1 overflow-y-auto pr-2">
        <CheckGroup label="Gender" options={GENDERS} filterKey="gender" />
        <CheckGroup label="Fragrance Family" options={FAMILIES} filterKey="fragranceFamily" />
        <CheckGroup label="Concentration" options={CONCENTRATIONS} filterKey="concentration" />
        <div className="mb-8">
          <p className="text-xs tracking-[0.2em] uppercase mb-4 font-medium">Min Rating</p>
          {[4, 3, 2].map((r) => (
            <label key={r} className="flex items-center gap-3 cursor-pointer group mb-2" onClick={() => set('minRating', filters.minRating === r ? undefined : r)}>
              <div className={`w-4 h-4 border transition-colors ${filters.minRating === r ? 'bg-charcoal border-charcoal' : 'border-charcoal/30'}`} />
              <span className="text-sm text-charcoal/70">{'★'.repeat(r)} & above</span>
            </label>
          ))}
        </div>
      </div>
      <button onClick={() => setFilters({ sort: 'newest', page: 1, limit: 12 })}
        className="text-xs tracking-widest uppercase text-charcoal/50 hover:text-charcoal transition-colors mt-4">
        Clear All Filters
      </button>
    </div>
  );
}

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const buildFilters = useCallback((): ProductFilters => ({
    search: searchParams.get('search') || undefined,
    gender: searchParams.get('gender') || undefined,
    fragranceFamily: searchParams.get('fragranceFamily') || undefined,
    concentration: searchParams.get('concentration') || undefined,
    minRating: searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined,
    isFeatured: searchParams.get('isFeatured') === 'true' || undefined,
    isNew: searchParams.get('isNew') === 'true' || undefined,
    isBestSeller: searchParams.get('isBestSeller') === 'true' || undefined,
    sort: (searchParams.get('sort') as ProductFilters['sort']) || 'newest',
    page: Number(searchParams.get('page')) || 1,
    limit: 12,
  }), [searchParams]);

  const [filters, setFiltersState] = useState<ProductFilters>(buildFilters());

  const applyFilters = (f: ProductFilters) => {
    setFiltersState(f);
    const params: Record<string, string> = {};
    Object.entries(f).forEach(([k, v]) => { if (v !== undefined && v !== '' && v !== false) params[k] = String(v); });
    setSearchParams(params);
  };

  useEffect(() => {
    setLoading(true);
    fetchProducts(filters).then(({ items, pagination: pg }) => {
      setProducts(items);
      setPagination({ total: pg.total, totalPages: pg.totalPages, page: pg.page });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [filters]);

  const activeFilterCount = [filters.gender, filters.fragranceFamily, filters.concentration, filters.minRating].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-ivory pt-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12">
          <p className="text-gold text-xs tracking-[0.4em] uppercase mb-3">
            {filters.search ? `Results for "${filters.search}"` : 'Our Fragrances'}
          </p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="font-display text-5xl">
            {filters.fragranceFamily ? `${filters.fragranceFamily} Fragrances` : 'The Collection'}
          </motion.h1>
          <p className="text-charcoal/50 mt-2 text-sm">{pagination.total} fragrances</p>
        </div>

        <div className="flex gap-10">
          <aside className="hidden lg:block w-56 shrink-0">
            <FilterPanel filters={filters} setFilters={applyFilters} />
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-charcoal/10">
              <button onClick={() => setFiltersOpen(true)} className="lg:hidden flex items-center gap-2 text-xs tracking-widest uppercase">
                <SlidersHorizontal size={14} />Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
              </button>
              <div className="flex items-center gap-3 ml-auto">
                <span className="text-xs text-charcoal/40 uppercase tracking-widest">Sort:</span>
                <div className="relative">
                  <select value={filters.sort ?? 'newest'}
                    onChange={(e) => applyFilters({ ...filters, sort: e.target.value as ProductFilters['sort'], page: 1 })}
                    className="appearance-none bg-transparent text-sm pr-6 outline-none cursor-pointer">
                    {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-charcoal/40" />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[3/4] bg-beige" />
                    <div className="mt-4 space-y-2"><div className="h-3 bg-beige w-2/3" /><div className="h-4 bg-beige w-full" /><div className="h-3 bg-beige w-1/3" /></div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="py-32 text-center">
                <p className="font-display text-3xl text-charcoal/30 mb-4">No fragrances found</p>
                <button onClick={() => applyFilters({ sort: 'newest', page: 1, limit: 12 })} className="text-sm underline underline-offset-4">Clear filters</button>
              </div>
            ) : (
              <motion.div variants={staggerFast} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {products.map((p) => (
                  <motion.div key={p._id} variants={fadeUp}><ProductCard product={p} /></motion.div>
                ))}
              </motion.div>
            )}

            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-16">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pg) => (
                  <button key={pg} onClick={() => applyFilters({ ...filters, page: pg })}
                    className={`w-10 h-10 text-sm transition-colors ${pg === pagination.page ? 'bg-charcoal text-ivory' : 'border border-charcoal/20 hover:border-charcoal'}`}>
                    {pg}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {filtersOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-charcoal/40" onClick={() => setFiltersOpen(false)} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-ivory p-8 overflow-y-auto">
              <FilterPanel filters={filters} setFilters={(f) => { applyFilters(f); setFiltersOpen(false); }} onClose={() => setFiltersOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
