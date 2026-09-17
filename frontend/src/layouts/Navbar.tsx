import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

const NAV_LINKS = [
  { label: 'Shop', to: '/shop' },
  { label: 'Collections', to: '/collections' },
  { label: 'Our Story', to: '/our-story' },
  { label: 'Find Your Scent', to: '/find-your-scent' },
  { label: 'AI Search', to: '/scent-intelligence' }
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { isAuthenticated, user, logout } = useAuthStore();
  const { itemCount, fetchCart } = useCartStore();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchCart();
  }, [isAuthenticated]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const count = itemCount();

  return (
    <>
      <motion.header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled ? 'py-3 bg-ivory/95 backdrop-blur-md shadow-sm' : 'py-5 bg-transparent'
        }`}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <nav className="mx-auto max-w-7xl px-6 flex items-center justify-between">
          <Link to="/" className={`font-display text-2xl tracking-[0.3em] hover:text-gold transition-colors ${scrolled ? 'text-charcoal' : 'text-ivory/90'}`}>
            ÉLANÉ
          </Link>
          <div className="hidden md:flex items-center gap-10">
            {NAV_LINKS.map((l) => (
              <Link key={l.to} to={l.to}
                className={`text-xs tracking-[0.2em] uppercase hover:text-gold transition-colors ${scrolled ? 'text-charcoal/70 hover:text-charcoal' : 'text-ivory/75'}`}>
                {l.label}
              </Link>
            ))}
          </div>
          <div className={`flex items-center gap-5 ${scrolled ? 'text-charcoal' : 'text-ivory/90'}`}>
            <button aria-label="Search" onClick={() => setSearchOpen(true)} className="hover:text-gold transition-colors">
              <Search size={18} />
            </button>
            {isAuthenticated && (
              <Link to="/wishlist" aria-label="Wishlist" className="hover:text-gold transition-colors">
                <Heart size={18} />
              </Link>
            )}
            <Link to="/cart" aria-label="Cart" className="relative hover:text-gold transition-colors">
              <ShoppingBag size={18} />
              {count > 0 && (
                <span className="absolute -top-2 -right-2 bg-charcoal text-ivory text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </Link>
            {isAuthenticated ? (
              <div className="relative group">
                <button className="hover:text-gold transition-colors"><User size={18} /></button>
                <div className="absolute right-0 top-full mt-2 w-56 bg-ivory text-charcoal border border-charcoal/10 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="px-4 py-3 border-b border-charcoal/10">
                    <p className="text-xs text-charcoal/50 uppercase tracking-widest">Signed in as</p>
                    <p className="text-sm font-medium truncate">{user?.name}</p>
                  </div>
                  {user?.role === 'ADMIN' && (
                    <Link to="/admin" className="block px-4 py-2 text-sm hover:bg-beige transition-colors">Admin Dashboard</Link>
                  )}
                  <Link to="/account" className="block px-4 py-2 text-sm hover:bg-beige transition-colors">My Account</Link>
                  <Link to="/orders" className="block px-4 py-2 text-sm hover:bg-beige transition-colors">My Orders</Link>
                  <button onClick={() => logout()} className="block w-full text-left px-4 py-2 text-sm hover:bg-beige transition-colors text-red-600">
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="hover:text-gold transition-colors"><User size={18} /></Link>
            )}
            <button className="md:hidden" onClick={() => setMobileOpen(true)} aria-label="Menu">
              <Menu size={20} />
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {searchOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-charcoal/80 backdrop-blur-sm flex items-start justify-center pt-32 px-6"
            onClick={() => setSearchOpen(false)}>
            <motion.form initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3 }} onSubmit={handleSearch} onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl">
              <div className="flex items-center border-b-2 border-ivory pb-4 gap-4">
                <Search size={24} className="text-ivory/60" />
                <input autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search fragrances, notes, families…"
                  className="flex-1 bg-transparent text-ivory text-xl placeholder-ivory/40 outline-none" />
                <button type="button" onClick={() => setSearchOpen(false)}>
                  <X size={24} className="text-ivory/60 hover:text-ivory" />
                </button>
              </div>
              <p className="text-ivory/40 text-sm mt-4">Press Enter to search</p>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-charcoal/50" onClick={() => setMobileOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.35 }}
              className="fixed right-0 top-0 bottom-0 z-[80] w-72 bg-ivory flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-charcoal/10">
                <span className="font-display text-xl tracking-widest">ÉLANÉ</span>
                <button onClick={() => setMobileOpen(false)}><X size={20} /></button>
              </div>
              <nav className="flex-1 flex flex-col p-6 gap-6">
                {NAV_LINKS.map((l) => (
                  <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)}
                    className="text-sm tracking-[0.2em] uppercase">{l.label}</Link>
                ))}
              </nav>
              <div className="p-6 border-t border-charcoal/10">
                {isAuthenticated ? (
                  <button onClick={() => { logout(); setMobileOpen(false); }} className="w-full text-sm text-red-600">Sign Out</button>
                ) : (
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="block text-sm text-center">Sign In / Register</Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
