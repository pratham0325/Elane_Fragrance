import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { fadeUp, staggerContainer } from '../animations/variants';
import type { Order } from '../types/api';

const fmt = (p: number) => `₹${(p / 100).toLocaleString('en-IN')}`;

const STATUS_COLORS: Record<string, string> = {
  Placed: 'bg-blue-50 text-blue-700', Confirmed: 'bg-indigo-50 text-indigo-700',
  Processing: 'bg-yellow-50 text-yellow-700', Shipped: 'bg-purple-50 text-purple-700',
  'Out for Delivery': 'bg-orange-50 text-orange-700', Delivered: 'bg-green-50 text-green-700',
  Cancelled: 'bg-red-50 text-red-600',
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/orders').then(r => setOrders(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen pt-32 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-charcoal/20 border-t-charcoal rounded-full animate-spin" />
    </div>
  );

  if (orders.length === 0) return (
    <div className="min-h-screen pt-32 flex flex-col items-center justify-center gap-6">
      <Package size={48} className="text-charcoal/20" />
      <p className="font-display text-3xl">No orders yet</p>
      <Link to="/shop" className="bg-charcoal text-ivory px-8 py-3 text-xs tracking-widest uppercase">Start Shopping</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-ivory pt-28">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <motion.div variants={staggerContainer} initial="hidden" animate="show">
          <motion.p variants={fadeUp} className="text-gold text-xs tracking-[0.4em] uppercase mb-3">Your History</motion.p>
          <motion.h1 variants={fadeUp} className="font-display text-5xl mb-12">My Orders</motion.h1>
        </motion.div>
        <div className="space-y-5">
          {orders.map((order, i) => (
            <motion.div key={order._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }} className="border border-charcoal/10 p-6 hover:border-gold/20 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs tracking-widest text-charcoal/50 uppercase mb-1">Order</p>
                  <p className="font-medium">{order.orderNumber}</p>
                  <p className="text-xs text-charcoal/40 mt-0.5">{new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block text-xs tracking-wider uppercase px-3 py-1 ${STATUS_COLORS[order.status] ?? 'bg-beige text-charcoal'}`}>
                    {order.status}
                  </span>
                  <p className="font-medium mt-2">{fmt(order.total)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {order.items.map((item, j) => (
                  <div key={j} className="flex items-center gap-2 text-xs text-charcoal/60">
                    <div className="w-8 h-10 bg-beige flex items-center justify-center text-center p-1"><span className="font-display text-[8px] leading-tight">{item.name.replace('ÉLANÉ ', '')}</span></div>
                    {item.name} ({item.size}) × {item.quantity}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-charcoal/40">{order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}</p>
                <Link to={`/orders/${order._id}`} className="text-xs tracking-widest uppercase underline underline-offset-4 hover:text-gold transition-colors">
                  View Details
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
