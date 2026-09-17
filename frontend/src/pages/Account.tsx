import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../services/apiClient';
import toast from '../store/toast';
import { staggerContainer, fadeUp } from '../animations/variants';

export default function Account() {
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    apiClient.get('/auth/me').then(r => setProfile(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: { pathname: '/account' } }} replace />;

  const handlePwChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
    setSavingPw(true);
    try {
      await apiClient.put('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not change password');
    } finally { setSavingPw(false); }
  };

  if (loading) return (
    <div className="min-h-screen pt-32 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-charcoal/20 border-t-charcoal rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-ivory pt-28">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <motion.div variants={staggerContainer} initial="hidden" animate="show">
          <motion.p variants={fadeUp} className="text-gold text-xs tracking-[0.4em] uppercase mb-3">Welcome back</motion.p>
          <motion.h1 variants={fadeUp} className="font-display text-4xl mb-10">{profile?.name ?? user?.name}</motion.h1>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {[{ label: 'Wishlist', count: profile?.wishlist?.length ?? 0, to: '/wishlist' },
            { label: 'Orders', count: '—', to: '/orders' },
            { label: 'Role', count: user?.role, to: '#' }
          ].map(s => (
            <Link key={s.label} to={s.to} className="block bg-beige p-5 hover:bg-taupe/30 transition-colors">
              <p className="text-xs tracking-widest uppercase text-charcoal/50 mb-1">{s.label}</p>
              <p className="font-display text-2xl">{s.count}</p>
            </Link>
          ))}
        </div>

        {/* Address list */}
        {profile?.addresses?.length > 0 && (
          <div className="mb-10">
            <h2 className="font-display text-2xl mb-5">Saved Addresses</h2>
            <div className="space-y-3">
              {profile.addresses.map((a: any, i: number) => (
                <div key={i} className="border border-charcoal/10 p-5 text-sm text-charcoal/70">
                  <p className="font-medium text-charcoal mb-1">{a.label ?? `Address ${i + 1}`} {a.isDefault && <span className="text-xs text-gold ml-2">Default</span>}</p>
                  <p>{a.fullName} · {a.phone}</p>
                  <p>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</p>
                  <p>{a.city}, {a.state} {a.postalCode}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Change password */}
        <div className="mb-10">
          <h2 className="font-display text-2xl mb-5">Change Password</h2>
          <form onSubmit={handlePwChange} className="space-y-4 max-w-sm">
            {[
              { k: 'currentPassword', label: 'Current Password' },
              { k: 'newPassword', label: 'New Password' },
              { k: 'confirm', label: 'Confirm New Password' },
            ].map(({ k, label }) => (
              <div key={k}>
                <label className="text-xs tracking-widest uppercase block mb-2">{label}</label>
                <input type="password" value={(pwForm as any)[k]}
                  onChange={e => setPwForm(f => ({ ...f, [k]: e.target.value }))} required
                  className="w-full border border-charcoal/20 px-4 py-3 text-sm outline-none focus:border-charcoal bg-transparent" />
              </div>
            ))}
            <button type="submit" disabled={savingPw}
              className="bg-charcoal text-ivory px-6 py-3 text-xs tracking-widest uppercase disabled:opacity-60">
              {savingPw ? 'Saving…' : 'Update Password'}
            </button>
          </form>
        </div>

        <button onClick={() => { clearAuth(); localStorage.removeItem('elane_refresh'); }}
          className="text-sm text-red-600 underline underline-offset-4">
          Sign Out
        </button>
      </div>
    </div>
  );
}
