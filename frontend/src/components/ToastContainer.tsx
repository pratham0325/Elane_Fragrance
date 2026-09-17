import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { ToastEvent } from '../store/toast';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastEvent[]>([]);

  useEffect(() => {
    return toast.subscribe((event) => {
      setToasts((prev) => [...prev, event]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== event.id)), 3500);
    });
  }, []);

  const icons = { success: CheckCircle, error: XCircle, info: Info };
  const colors = { success: 'text-green-600', error: 'text-red-500', info: 'text-gold' };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = icons[t.level];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="pointer-events-auto bg-ivory border border-charcoal/10 shadow-lg px-4 py-3 flex items-center gap-3 min-w-[260px] max-w-sm"
            >
              <Icon size={16} className={colors[t.level]} />
              <span className="text-sm text-charcoal flex-1">{t.message}</span>
              <button onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}>
                <X size={14} className="text-charcoal/40 hover:text-charcoal" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
