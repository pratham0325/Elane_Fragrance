import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { fetchProducts } from '../services/product.service';
import type { Product } from '../types/api';
import ProductCard from '../components/ProductCard';
import { fadeUp, staggerContainer, staggerFast } from '../animations/variants';

const QUESTIONS = [
  { id: 'mood', label: 'What mood do you want?', options: ['Fresh', 'Romantic', 'Mysterious', 'Bold', 'Calm', 'Energetic'] },
  { id: 'family', label: 'Which scent family calls you?', options: ['Woody', 'Floral', 'Fresh', 'Oriental', 'Spicy', 'Musky'] },
  { id: 'occasion', label: 'When will you wear it?', options: ['Daily', 'Office', 'Date', 'Party', 'Evening', 'Special Occasion'] },
  { id: 'intensity', label: 'How intense do you want it?', options: ['Light', 'Medium', 'Strong'] },
];

const FAMILY_MAP: Record<string, string> = {
  Fresh: 'Fresh', Romantic: 'Floral', Mysterious: 'Oriental', Bold: 'Woody',
  Calm: 'Musky', Energetic: 'Citrus', Woody: 'Woody', Floral: 'Floral',
  Oriental: 'Oriental', Spicy: 'Spicy', Musky: 'Musky',
};

export default function FindYourScent() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const answer = (val: string) => {
    const newAnswers = { ...answers, [QUESTIONS[step].id]: val };
    setAnswers(newAnswers);
    if (step < QUESTIONS.length - 1) {
      setStep(s => s + 1);
    } else {
      findScents(newAnswers);
    }
  };

  const findScents = async (ans: Record<string, string>) => {
    setLoading(true);
    setDone(true);
    try {
      const fragranceFamily = FAMILY_MAP[ans.family] ?? FAMILY_MAP[ans.mood] ?? 'Floral';
      const sort = ans.intensity === 'Strong' ? 'rating' : ans.occasion === 'Daily' ? 'bestselling' : 'newest';
      const data = await fetchProducts({ fragranceFamily, sort, limit: 4 });
      setResults(data.items);
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  const reset = () => { setStep(0); setAnswers({}); setResults([]); setDone(false); };

  return (
    <div className="min-h-screen bg-charcoal pt-28 flex flex-col">
      <div className="mx-auto max-w-3xl px-6 py-16 flex-1 flex flex-col">
        {!done ? (
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex-1 flex flex-col justify-center">
            <motion.p variants={fadeUp} className="text-gold text-xs tracking-[0.4em] uppercase mb-4 text-center">Fragrance Discovery</motion.p>
            <motion.h1 variants={fadeUp} className="font-display text-4xl md:text-5xl text-ivory text-center mb-4">Find Your Scent</motion.h1>
            <motion.p variants={fadeUp} className="text-ivory/40 text-center mb-16">Answer a few questions and we'll curate the perfect ÉLANÉ fragrance for you.</motion.p>

            {/* Progress */}
            <motion.div variants={fadeUp} className="flex gap-1 mb-12">
              {QUESTIONS.map((_, i) => (
                <div key={i} className={`flex-1 h-px transition-colors ${i <= step ? 'bg-gold' : 'bg-ivory/10'}`} />
              ))}
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35 }}>
                <p className="text-ivory/50 text-xs tracking-[0.3em] uppercase mb-4">Question {step + 1} of {QUESTIONS.length}</p>
                <h2 className="font-display text-2xl text-ivory mb-10">{QUESTIONS[step].label}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {QUESTIONS[step].options.map(opt => (
                    <button key={opt} onClick={() => answer(opt)}
                      className="border border-ivory/20 text-ivory py-4 px-6 text-sm tracking-wider hover:border-gold hover:text-gold hover:bg-gold/5 transition-all duration-200">
                      {opt}
                    </button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="mt-10 text-ivory/30 text-xs tracking-widest uppercase hover:text-ivory/60 transition-colors self-start">
                ← Back
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="show">
            <motion.p variants={fadeUp} className="text-gold text-xs tracking-[0.4em] uppercase mb-4 text-center">Your Match</motion.p>
            <motion.h2 variants={fadeUp} className="font-display text-4xl text-ivory text-center mb-4">
              {loading ? 'Finding your perfect scent…' : 'We found your fragrances.'}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-ivory/40 text-center mb-14">
              Based on your answers — {Object.values(answers).join(', ')}
            </motion.p>

            {loading ? (
              <div className="flex justify-center"><div className="w-10 h-10 border-2 border-ivory/20 border-t-gold rounded-full animate-spin" /></div>
            ) : results.length > 0 ? (
              <motion.div variants={staggerFast} className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-12">
                {results.map(p => (
                  <motion.div key={p._id} variants={fadeUp} className="bg-ivory">
                    <ProductCard product={p} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <p className="text-ivory/40 text-center mb-12">No matches found — <Link to="/shop" className="underline">browse the full collection</Link>.</p>
            )}

            <div className="flex justify-center gap-4">
              <button onClick={reset} className="border border-ivory/20 text-ivory px-6 py-3 text-xs tracking-widest uppercase hover:border-ivory/50 transition-colors">
                Start Over
              </button>
              <Link to="/shop" className="bg-gold text-ivory px-6 py-3 text-xs tracking-widest uppercase flex items-center gap-2 hover:bg-gold-dark transition-colors">
                View All <ArrowRight size={12} />
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
