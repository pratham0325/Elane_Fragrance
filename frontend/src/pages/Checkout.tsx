import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../services/apiClient';
import toast from '../store/toast';
import { fadeUp, staggerContainer } from '../animations/variants';

const fmt = (p: number) => `₹${(p / 100).toLocaleString('en-IN')}`;
const STEPS = ['Address', 'Review', 'Payment', 'Confirm'];

export default function Checkout() {
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState({ fullName: '', phone: '', line1: '', city: '', state: '', postalCode: '', country: 'India' });
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState<{ discount: number; code: string } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  const [placing, setPlacing] = useState(false);
  const { items, subtotal, fetchCart } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const sub = subtotal();
  const shipping = sub >= 100000 ? 0 : 9900;
  const tax = Math.round(sub * 0.18);
  const discount = couponResult?.discount ?? 0;
  const total = sub + shipping + tax - discount;

  const setAddr = (k: keyof typeof address) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddress(a => ({ ...a, [k]: e.target.value }));

  const validateCoupon = async () => {
    setCouponError('');
    try {
      const { data } = await apiClient.post('/coupons/validate', { code: couponCode, cartSubtotal: sub });
      setCouponResult(data.data);
      toast.success(`Coupon applied! You save ${fmt(data.data.discount)}`);
    } catch (err: any) {
      setCouponError(err?.response?.data?.message ?? 'Invalid coupon');
      setCouponResult(null);
    }
  };

  const placeOrder = async () => {
    setPlacing(true);
    try {
      const addrIdx = 0;
      await apiClient.post('/orders', {
        shippingAddress: address,
        paymentMethod,
        couponCode: couponResult?.code,
        shippingAddressIndex: addrIdx
      });
      await fetchCart();
      toast.success('Order placed successfully!');
      navigate('/orders');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not place order');
    } finally { setPlacing(false); }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-ivory pt-28">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <motion.div variants={staggerContainer} initial="hidden" animate="show">
          <motion.p variants={fadeUp} className="text-gold text-xs tracking-[0.4em] uppercase mb-3">Secure Checkout</motion.p>
          <motion.h1 variants={fadeUp} className="font-display text-4xl mb-10">Complete Your Order</motion.h1>
        </motion.div>

        {/* Step indicators */}
        <div className="flex items-center gap-0 mb-12">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors ${i <= step ? 'bg-charcoal text-ivory' : 'border border-charcoal/20 text-charcoal/30'}`}>
                {i < step ? <Check size={12} /> : i + 1}
              </div>
              <span className={`ml-2 text-xs tracking-widest uppercase ${i === step ? 'text-charcoal' : 'text-charcoal/30'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 mx-4 h-px ${i < step ? 'bg-charcoal' : 'bg-charcoal/10'}`} />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            {/* Step 0: Address */}
            {step === 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="font-display text-2xl mb-6">Shipping Address</h2>
                <div className="grid grid-cols-2 gap-4">
                  {([
                    { k: 'fullName', label: 'Full Name', span: 2 },
                    { k: 'phone', label: 'Phone', span: 1 },
                    { k: 'line1', label: 'Address Line', span: 2 },
                    { k: 'city', label: 'City', span: 1 },
                    { k: 'state', label: 'State', span: 1 },
                    { k: 'postalCode', label: 'Postal Code', span: 1 },
                  ] as { k: keyof typeof address; label: string; span: number }[]).map(({ k, label, span }) => (
                    <div key={k} className={span === 2 ? 'col-span-2' : ''}>
                      <label className="text-xs tracking-widest uppercase block mb-2">{label}</label>
                      <input value={address[k]} onChange={setAddr(k)} required
                        className="w-full border border-charcoal/20 px-4 py-3 text-sm outline-none focus:border-charcoal bg-transparent" />
                    </div>
                  ))}
                </div>
                <button onClick={() => { if (Object.values(address).some(v => !v && v !== 'India')) { toast.error('Please fill all fields'); return; } setStep(1); }}
                  className="mt-8 bg-charcoal text-ivory px-8 py-4 text-xs tracking-[0.25em] uppercase hover:bg-espresso transition-colors">
                  Continue to Review
                </button>
              </motion.div>
            )}

            {/* Step 1: Review */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="font-display text-2xl mb-6">Review Your Order</h2>
                <div className="space-y-4 mb-8">
                  {items.map(item => (
                    <div key={item._id} className="flex gap-4 py-3 border-b border-charcoal/10">
                      <div className="w-16 h-20 bg-beige flex items-center justify-center text-center p-2 shrink-0">
                        <span className="font-display text-xs leading-tight">{item.product.name.replace('ÉLANÉ ', '')}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-display">{item.product.name}</p>
                        <p className="text-xs text-charcoal/50 mt-0.5">{item.size} · Qty {item.quantity}</p>
                        <p className="text-sm mt-1">{fmt(item.priceAtAdd * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon */}
                <div className="mb-8">
                  <label className="text-xs tracking-widest uppercase block mb-2">Coupon Code</label>
                  <div className="flex gap-3">
                    <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="ELANE10"
                      className="flex-1 border border-charcoal/20 px-4 py-3 text-sm outline-none focus:border-charcoal bg-transparent uppercase" />
                    <button onClick={validateCoupon} className="border border-charcoal px-5 text-xs tracking-widest uppercase hover:bg-charcoal hover:text-ivory transition-colors">
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
                  {couponResult && <p className="text-green-600 text-xs mt-1">✓ {couponResult.code} applied — saving {fmt(couponResult.discount)}</p>}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(0)} className="border border-charcoal/20 px-6 py-3 text-xs tracking-widest uppercase hover:border-charcoal transition-colors">Back</button>
                  <button onClick={() => setStep(2)} className="bg-charcoal text-ivory px-8 py-3 text-xs tracking-[0.25em] uppercase hover:bg-espresso transition-colors">Continue to Payment</button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="font-display text-2xl mb-6">Payment Method</h2>
                <div className="space-y-3 mb-8">
                  {([{ value: 'COD', label: 'Cash on Delivery', sub: 'Pay when your order arrives' },
                     { value: 'ONLINE', label: 'Online Payment', sub: 'Razorpay — coming soon' }
                  ] as { value: 'COD' | 'ONLINE'; label: string; sub: string }[]).map(opt => (
                    <label key={opt.value} onClick={() => setPaymentMethod(opt.value)}
                      className={`flex items-center gap-4 p-5 border cursor-pointer transition-colors ${paymentMethod === opt.value ? 'border-charcoal bg-beige' : 'border-charcoal/20 hover:border-charcoal/50'}`}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === opt.value ? 'border-charcoal' : 'border-charcoal/30'}`}>
                        {paymentMethod === opt.value && <div className="w-2.5 h-2.5 rounded-full bg-charcoal" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{opt.label}</p>
                        <p className="text-xs text-charcoal/50">{opt.sub}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="border border-charcoal/20 px-6 py-3 text-xs tracking-widest uppercase hover:border-charcoal transition-colors">Back</button>
                  <button onClick={() => setStep(3)} className="bg-charcoal text-ivory px-8 py-3 text-xs tracking-[0.25em] uppercase hover:bg-espresso transition-colors">Review & Place Order</button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="font-display text-2xl mb-6">Confirm Your Order</h2>
                <div className="bg-beige p-6 mb-6 space-y-2 text-sm">
                  <p className="font-medium mb-3">Shipping to</p>
                  <p className="text-charcoal/70">{address.fullName} · {address.phone}</p>
                  <p className="text-charcoal/70">{address.line1}, {address.city}, {address.state} {address.postalCode}</p>
                  <p className="text-charcoal/70 mt-3">Payment: {paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="border border-charcoal/20 px-6 py-3 text-xs tracking-widest uppercase hover:border-charcoal transition-colors">Back</button>
                  <button onClick={placeOrder} disabled={placing}
                    className="bg-gold text-ivory px-10 py-3 text-xs tracking-[0.25em] uppercase hover:bg-gold-dark transition-colors disabled:opacity-60">
                    {placing ? 'Placing Order…' : `Place Order · ${fmt(total)}`}
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Order summary sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-beige p-6 sticky top-28">
              <h3 className="font-display text-lg mb-5">Summary</h3>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between"><span className="text-charcoal/60">Subtotal</span><span>{fmt(sub)}</span></div>
                {discount > 0 && <div className="flex justify-between text-green-600"><span>Coupon</span><span>−{fmt(discount)}</span></div>}
                <div className="flex justify-between"><span className="text-charcoal/60">Shipping</span><span>{shipping === 0 ? 'Free' : fmt(shipping)}</span></div>
                <div className="flex justify-between"><span className="text-charcoal/60">GST</span><span>{fmt(tax)}</span></div>
              </div>
              <div className="border-t border-charcoal/20 pt-4">
                <div className="flex justify-between font-medium"><span>Total</span><span>{fmt(total)}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
