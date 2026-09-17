import { Link } from 'react-router-dom';
import { Instagram, Twitter, Youtube } from 'lucide-react';

const LINKS = {
  Shop: [['Collections', '/collections'], ['New Arrivals', '/shop?isNew=true'], ['Best Sellers', '/shop?isBestSeller=true'], ['Find Your Scent', '/find-your-scent']],
  About: [['Our Story', '/our-story'], ['Contact', '#'], ['FAQ', '#']],
  Support: [['Shipping', '#'], ['Returns', '#'], ['Privacy Policy', '#'], ['Terms', '#']],
};

export default function Footer() {
  return (
    <footer className="bg-charcoal text-ivory">
      <div className="mx-auto max-w-7xl px-6 py-16 grid grid-cols-2 md:grid-cols-5 gap-10">
        <div className="col-span-2 md:col-span-2">
          <Link to="/" className="font-display text-2xl tracking-[0.3em] block mb-4">ÉLANÉ</Link>
          <p className="text-ivory/40 text-sm leading-relaxed max-w-xs mb-6">
            A luxury fragrance house for those who understand that scent is the most intimate form of self-expression.
          </p>
          <div className="flex gap-4">
            {[Instagram, Twitter, Youtube].map((Icon, i) => (
              <a key={i} href="#" aria-label="Social" className="text-ivory/30 hover:text-ivory transition-colors">
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

        {Object.entries(LINKS).map(([section, links]) => (
          <div key={section}>
            <p className="text-xs tracking-[0.25em] uppercase text-ivory/40 mb-5">{section}</p>
            <ul className="space-y-3">
              {links.map(([label, to]) => (
                <li key={label}>
                  <Link to={to as string} className="text-sm text-ivory/60 hover:text-ivory transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-ivory/10 py-6">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-ivory/30">© {new Date().getFullYear()} ÉLANÉ. All rights reserved.</p>
          <p className="text-xs text-ivory/20 tracking-widest">WEAR THE UNFORGETTABLE</p>
        </div>
      </div>
    </footer>
  );
}
