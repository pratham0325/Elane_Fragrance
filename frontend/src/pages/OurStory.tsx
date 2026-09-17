import { motion } from 'framer-motion';
import { fadeUp, staggerContainer, imageReveal } from '../animations/variants';

export default function OurStory() {
  return (
    <div className="bg-ivory min-h-screen pt-28">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="text-center mb-24">
          <motion.p variants={fadeUp} className="text-gold text-xs tracking-[0.4em] uppercase mb-4">About ÉLANÉ</motion.p>
          <motion.h1 variants={fadeUp} className="font-display text-6xl md:text-7xl mb-6">Our Story</motion.h1>
          <motion.p variants={fadeUp} className="text-charcoal/50 max-w-xl mx-auto text-lg leading-relaxed">
            Born from a conviction that fragrance is the most intimate form of self-expression.
          </motion.p>
        </motion.div>

        <motion.div variants={imageReveal} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="aspect-[21/9] overflow-hidden mb-24 bg-charcoal text-ivory flex items-center justify-center">
          <div className="text-center">
            <p className="text-gold text-xs tracking-[0.45em] uppercase mb-6">The ÉLANÉ Atelier</p>
            <p className="font-display text-5xl md:text-7xl">Made to be remembered.</p>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-16 mb-24">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <motion.h2 variants={fadeUp} className="font-display text-3xl mb-6">The Founding Vision</motion.h2>
            <motion.p variants={fadeUp} className="text-charcoal/60 leading-loose mb-4">
              ÉLANÉ was conceived in a small apartment in Paris, where our founder — a perfumer trained in Grasse — grew frustrated with the compromise between accessibility and artistry in modern fragrance.
            </motion.p>
            <motion.p variants={fadeUp} className="text-charcoal/60 leading-loose">
              The vision was clear: create fragrances using the finest raw materials — genuine oud, rose absolutes, iris butter — without the theatrical pricing that gatekeeps luxury from those who simply love beautiful things.
            </motion.p>
          </motion.div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <motion.h2 variants={fadeUp} className="font-display text-3xl mb-6">Our Philosophy</motion.h2>
            <motion.p variants={fadeUp} className="text-charcoal/60 leading-loose mb-4">
              Every ÉLANÉ composition begins not with a market brief but with an emotion. We ask: how should this make the wearer feel? What memory should it evoke? What version of themselves will it reveal?
            </motion.p>
            <motion.p variants={fadeUp} className="text-charcoal/60 leading-loose">
              The result is a collection where every fragrance has a clear identity — opinionated, unhurried, and deeply considered.
            </motion.p>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.8 }} className="bg-charcoal text-ivory p-16 text-center">
          <p className="font-display text-3xl md:text-4xl leading-relaxed">
            "Scent is not something you wear.<br />It is something you become."
          </p>
          <p className="text-ivory/40 mt-6 text-sm tracking-widest uppercase">— Élané, Founder</p>
        </motion.div>
      </div>
    </div>
  );
}
