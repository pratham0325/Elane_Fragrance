// Tiny event-based toast — consumed by <ToastContainer />
type ToastLevel = 'success' | 'error' | 'info';

interface ToastEvent { message: string; level: ToastLevel; id: number }

const listeners: ((e: ToastEvent) => void)[] = [];
let counter = 0;

function emit(message: string, level: ToastLevel) {
  const event: ToastEvent = { message, level, id: ++counter };
  listeners.forEach((l) => l(event));
}

const toast = {
  success: (msg: string) => emit(msg, 'success'),
  error: (msg: string) => emit(msg, 'error'),
  info: (msg: string) => emit(msg, 'info'),
  subscribe: (fn: (e: ToastEvent) => void) => {
    listeners.push(fn);
    return () => { const i = listeners.indexOf(fn); if (i > -1) listeners.splice(i, 1); };
  }
};

export default toast;
export type { ToastEvent };
