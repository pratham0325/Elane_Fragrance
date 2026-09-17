import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ChevronDown, Sparkles } from 'lucide-react';
import { fadeUp, staggerContainer, imageReveal, staggerFast } from '../animations/variants';
import { fetchFeatured, fetchBestSellers, fetchNewArrivals } from '../services/product.service';
import type { Product } from '../types/api';
import ProductCard from '../components/ProductCard';

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const words = ['WEAR', 'THE', 'UNFORGETTABLE.'];

  return (
    <section ref={ref} className="relative min-h-screen flex items-center overflow-hidden bg-charcoal">
      <motion.div style={{ y }} className="absolute inset-0 bg-gradient-to-br from-espresso via-charcoal to-black" />
      <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.03, 0.08, 0.03] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 right-1/4 w-[600px] h-[600px] rounded-full bg-gold/10" />
      <motion.div style={{ opacity }} className="relative z-10 mx-auto max-w-7xl px-6 w-full pt-24">
        <motion.div variants={staggerContainer} initial="hidden" animate="show">
          <motion.p variants={fadeUp} className="text-gold text-xs tracking-[0.4em] uppercase mb-8">ÉLANÉ — Luxury Fragrance</motion.p>
          <h1 className="font-display text-ivory leading-none mb-8">
            {words.map((word, i) => (
              <motion.span key={word}
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="block text-6xl md:text-8xl">{word}</motion.span>
            ))}
          </h1>
          <motion.p variants={fadeUp} className="text-ivory/50 text-lg max-w-md leading-relaxed mb-10">
            Scent is a signature. Each ÉLANÉ fragrance is a composition of rare materials — designed to be worn, remembered, and never forgotten.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
            <Link to="/shop" className="bg-gold text-ivory px-8 py-4 text-xs tracking-[0.25em] uppercase hover:bg-gold-dark transition-colors flex items-center gap-3">
              Discover the Collection <ArrowRight size={14} />
            </Link>
            <Link to="/scent-intelligence" className="border border-ivory/30 text-ivory px-8 py-4 text-xs tracking-[0.25em] uppercase hover:border-ivory/70 transition-colors flex items-center gap-2.5">
              <Sparkles size={13} className="text-gold" /> Ask Scent Intelligence
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-ivory/30">
        <span className="text-xs tracking-[0.3em] uppercase">Scroll</span>
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <ChevronDown size={16} />
        </motion.div>
      </motion.div>
    </section>
  );
}

const FAMILIES = [
  { name: 'Woody', desc: 'Sandalwood, Cedarwood, Oud', color: 'bg-amber-900/10' },
  { name: 'Floral', desc: 'Rose, Jasmine, Iris', color: 'bg-pink-200/20' },
  { name: 'Oriental', desc: 'Amber, Vanilla, Spice', color: 'bg-orange-900/10' },
  { name: 'Fresh', desc: 'Citrus, Green, Aquatic', color: 'bg-teal-100/20' },
  { name: 'Musky', desc: 'White Musk, Ambrette', color: 'bg-stone-200/30' },
  { name: 'Gourmand', desc: 'Vanilla, Caramel, Tonka', color: 'bg-yellow-100/20' }
];

function FragranceFamilies() {
  return (
    <section className="py-32 bg-ivory">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
          <motion.p variants={fadeUp} className="text-gold text-xs tracking-[0.4em] uppercase mb-4">Explore</motion.p>
          <motion.h2 variants={fadeUp} className="font-display text-5xl md:text-6xl mb-16">Shop by Family</motion.h2>
        </motion.div>
        <motion.div variants={staggerFast} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {FAMILIES.map((f) => (
            <motion.div key={f.name} variants={fadeUp}>
              <Link to={`/shop?fragranceFamily=${f.name}`}
                className={`group block p-8 ${f.color} border border-charcoal/5 hover:border-gold/30 transition-all duration-300`}>
                <h3 className="font-display text-2xl mb-2 group-hover:text-gold transition-colors">{f.name}</h3>
                <p className="text-sm text-charcoal/50">{f.desc}</p>
                <div className="mt-6 flex items-center gap-2 text-xs tracking-widest text-charcoal/40 group-hover:text-gold transition-colors">
                  Explore <ArrowRight size={12} />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function FragranceJourney() {
  const notes = [
    { layer: 'Top Notes', sub: 'The first impression', examples: 'Bergamot · Lemon · Pink Pepper' },
    { layer: 'Heart Notes', sub: 'The soul of the fragrance', examples: 'Rose · Jasmine · Iris' },
    { layer: 'Base Notes', sub: 'The lasting memory', examples: 'Oud · Musk · Sandalwood' }
  ];
  return (
    <section className="py-32 bg-charcoal">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <motion.p variants={fadeUp} className="text-gold text-xs tracking-[0.4em] uppercase mb-4 text-center">The Architecture</motion.p>
          <motion.h2 variants={fadeUp} className="font-display text-5xl text-ivory text-center mb-4">Fragrance Journey</motion.h2>
          <motion.p variants={fadeUp} className="text-ivory/40 text-center max-w-md mx-auto mb-20">
            Every ÉLANÉ fragrance unfolds in three acts.
          </motion.p>
        </motion.div>
        <div className="space-y-1">
          {notes.map((note, i) => (
            <motion.div key={note.layer}
              initial={{ opacity: 0, x: i % 2 === 0 ? -60 : 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="border border-ivory/10 p-10 flex flex-col md:flex-row items-start md:items-center gap-6 hover:border-gold/30 transition-colors group">
              <div className="text-5xl font-display text-ivory/10 group-hover:text-ivory/20 transition-colors w-16 shrink-0">0{i + 1}</div>
              <div className="flex-1">
                <p className="text-gold text-xs tracking-widest uppercase mb-2">{note.sub}</p>
                <h3 className="font-display text-3xl text-ivory mb-3">{note.layer}</h3>
                <p className="text-ivory/50 text-sm tracking-wider">{note.examples}</p>
              </div>
              <ArrowRight size={24} className="text-ivory/20 group-hover:text-gold transition-colors" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EditorialBanner() {
  return (
    <section className="py-32 bg-beige">
      <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-2 gap-16 items-center">
        <motion.div variants={imageReveal} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="aspect-[4/5] overflow-hidden">
          <img src="/perfumes/rosaline-detail.jpg"
            alt="ÉLANÉ fragrance bottle detail" className="w-full h-full object-cover" />
        </motion.div>
        <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <motion.p variants={fadeUp} className="text-gold text-xs tracking-[0.4em] uppercase mb-6">Our Philosophy</motion.p>
          <motion.h2 variants={fadeUp} className="font-display text-4xl md:text-5xl leading-tight mb-8">More than<br />a fragrance.</motion.h2>
          <motion.p variants={fadeUp} className="text-charcoal/60 leading-relaxed mb-6">
            ÉLANÉ was founded on a single belief: that scent is the most intimate form of self-expression. Unlike fashion — fragrance is what the world feels when you pass through a room.
          </motion.p>
          <motion.p variants={fadeUp} className="text-charcoal/60 leading-relaxed mb-10">
            Every composition begins not with a brief, but with an emotion. We ask not "what should this smell like?" but "how should this make you feel?"
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link to="/our-story" className="inline-flex items-center gap-3 text-xs tracking-[0.25em] uppercase border-b border-charcoal pb-1 hover:border-gold hover:text-gold transition-colors">
              Read Our Story <ArrowRight size={12} />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function Newsletter() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  return (
    <section className="py-24 bg-charcoal">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <motion.p variants={fadeUp} className="text-gold text-xs tracking-[0.4em] uppercase mb-4">Stay Close</motion.p>
          <motion.h2 variants={fadeUp} className="font-display text-4xl text-ivory mb-4">Enter the World of ÉLANÉ</motion.h2>
          <motion.p variants={fadeUp} className="text-ivory/40 mb-10">New collections and rare editions — delivered quietly to your inbox.</motion.p>
          {sent ? (
            <p className="text-gold">Welcome to ÉLANÉ. You will hear from us soon.</p>
          ) : (
            <motion.form variants={fadeUp} onSubmit={(e) => { e.preventDefault(); if (email.includes('@')) setSent(true); }}
              className="flex flex-col sm:flex-row gap-0">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" required
                className="flex-1 bg-transparent border border-ivory/20 px-5 py-4 text-ivory placeholder-ivory/30 text-sm outline-none focus:border-gold/50 transition-colors" />
              <button type="submit" className="bg-gold text-ivory px-8 py-4 text-xs tracking-[0.25em] uppercase hover:bg-gold-dark transition-colors whitespace-nowrap">
                Subscribe
              </button>
            </motion.form>
          )}
        </motion.div>
      </div>
    </section>
  );
}

function ProductSection({ title, subtitle, products, link }: { title: string; subtitle: string; products: Product[]; link: string }) {
  return (
    <section className="py-24 bg-ivory">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="flex items-end justify-between mb-14">
          <div>
            <motion.p variants={fadeUp} className="text-gold text-xs tracking-[0.4em] uppercase mb-3">{subtitle}</motion.p>
            <motion.h2 variants={fadeUp} className="font-display text-4xl md:text-5xl">{title}</motion.h2>
          </div>
          <motion.div variants={fadeUp}>
            <Link to={link} className="hidden md:flex items-center gap-2 text-xs tracking-widest uppercase hover:text-gold transition-colors">
              View All <ArrowRight size={12} />
            </Link>
          </motion.div>
        </motion.div>
        <motion.div variants={staggerFast} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {products.slice(0, 4).map((p) => (
            <motion.div key={p._id} variants={fadeUp}><ProductCard product={p} /></motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default function Home() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  useEffect(() => {
    fetchFeatured().then(setFeatured).catch(() => {});
    fetchBestSellers().then(setBestSellers).catch(() => {});
    fetchNewArrivals().then(setNewArrivals).catch(() => {});
  }, []);
  return (
    <div>
      <Hero />
      {featured.length > 0 && <ProductSection title="The Collection" subtitle="Featured" products={featured} link="/shop?isFeatured=true" />}
      <FragranceFamilies />
      {bestSellers.length > 0 && <ProductSection title="Best Sellers" subtitle="Most Loved" products={bestSellers} link="/shop?isBestSeller=true" />}
      <FragranceJourney />
      <EditorialBanner />
      {newArrivals.length > 0 && <ProductSection title="New Arrivals" subtitle="Just Landed" products={newArrivals} link="/shop?isNew=true" />}
      <Newsletter />
    </div>
  );
}
