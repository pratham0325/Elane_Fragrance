import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { staggerContainer, fadeUp, staggerFast } from '../animations/variants';

export default function Collections() {
  const [categories, setCategories] = useState<any[]>([]);
  useEffect(() => { apiClient.get('/categories').then(r => setCategories(r.data.data)).catch(() => {}); }, []);

  return (
    <div className="min-h-screen bg-ivory pt-28">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="mb-16 text-center">
          <motion.p variants={fadeUp} className="text-gold text-xs tracking-[0.4em] uppercase mb-4">ÉLANÉ</motion.p>
          <motion.h1 variants={fadeUp} className="font-display text-6xl mb-4">Collections</motion.h1>
          <motion.p variants={fadeUp} className="text-charcoal/50 max-w-md mx-auto">
            Five distinct worlds of scent — each with its own identity, mood, and moment.
          </motion.p>
        </motion.div>

        <motion.div variants={staggerFast} initial="hidden" animate="show" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, i) => (
            <motion.div key={cat._id} variants={fadeUp}>
              <Link to={`/shop?category=${cat._id}`}
                className="group block relative overflow-hidden aspect-[4/5] bg-beige">
                <div className="absolute inset-0 bg-charcoal" />
                <div className="absolute inset-0 flex flex-col justify-end p-8">
                  <span className="text-gold text-[10px] tracking-[0.35em] uppercase mb-3">Collection {String(i + 1).padStart(2, '0')}</span>
                  <h2 className="font-display text-2xl text-ivory mb-2">{cat.name}</h2>
                  {cat.description && <p className="text-ivory/60 text-sm mb-4 line-clamp-2">{cat.description}</p>}
                  <div className="flex items-center gap-2 text-ivory/80 text-xs tracking-widest uppercase group-hover:text-gold transition-colors">
                    Explore <ArrowRight size={12} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
