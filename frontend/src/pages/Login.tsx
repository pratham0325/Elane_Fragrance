import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { staggerContainer, fadeUp } from '../animations/variants';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const { login, register, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname ?? '/';

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-ivory flex">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex flex-1 bg-charcoal items-center justify-center p-16">
        <div className="text-center">
          <p className="font-display text-6xl text-ivory leading-tight mb-6">Your scent.<br />Your story.</p>
          <p className="text-ivory/40 max-w-xs">Sign in to unlock your personal ÉLANÉ experience — wishlists, orders, and exclusive access.</p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="w-full max-w-sm">
          <motion.div variants={fadeUp} className="mb-10">
            <Link to="/" className="font-display text-2xl tracking-[0.3em]">ÉLANÉ</Link>
          </motion.div>

          <motion.h1 variants={fadeUp} className="font-display text-3xl mb-2">
            {mode === 'login' ? 'Welcome back.' : 'Create account.'}
          </motion.h1>
          <motion.p variants={fadeUp} className="text-charcoal/50 text-sm mb-8">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}
              className="underline underline-offset-4 hover:text-charcoal transition-colors">
              {mode === 'login' ? 'Register' : 'Sign in'}
            </button>
          </motion.p>

          <motion.form variants={fadeUp} onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="text-xs tracking-widest uppercase block mb-2">Full Name</label>
                <input type="text" value={form.name} onChange={set('name')} required
                  className="w-full border border-charcoal/20 px-4 py-3 text-sm outline-none focus:border-charcoal bg-transparent transition-colors" />
              </div>
            )}
            <div>
              <label className="text-xs tracking-widest uppercase block mb-2">Email</label>
              <input type="email" value={form.email} onChange={set('email')} required placeholder="priya@example.com"
                className="w-full border border-charcoal/20 px-4 py-3 text-sm outline-none focus:border-charcoal bg-transparent transition-colors" />
            </div>
            <div>
              <label className="text-xs tracking-widest uppercase block mb-2">Password</label>
              <input type="password" value={form.password} onChange={set('password')} required minLength={8} placeholder="Customer@1234"
                className="w-full border border-charcoal/20 px-4 py-3 text-sm outline-none focus:border-charcoal bg-transparent transition-colors" />
            </div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-600 text-sm">{error}</motion.p>
            )}

            <button type="submit" disabled={isLoading}
              className="w-full bg-charcoal text-ivory py-4 text-xs tracking-[0.25em] uppercase hover:bg-espresso transition-colors disabled:opacity-60 mt-2">
              {isLoading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </motion.form>
        </motion.div>
      </div>
    </div>
  );
}
