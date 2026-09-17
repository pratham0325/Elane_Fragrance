import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { apiClient } from './services/apiClient';
import Navbar from './layouts/Navbar';
import Footer from './layouts/Footer';
import ToastContainer from './components/ToastContainer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Login from './pages/Login';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import FindYourScent from './pages/FindYourScent';
import Admin from './pages/Admin';
import ScentIntelligence from './pages/ScentIntelligence';
import NotFound from './pages/NotFound';
import OurStory from './pages/OurStory';
import Collections from './pages/Collections';
import Account from './pages/Account';

// Restore access token on app load from persisted store
function AuthInit() {
  const { accessToken, clearAuth } = useAuthStore();
  useEffect(() => {
    if (accessToken) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    }
    // Response interceptor: auto-refresh on 401
    const id = apiClient.interceptors.response.use(
      r => r,
      async err => {
        const original = err.config;
        if (err.response?.status === 401 && !original._retry) {
          original._retry = true;
          const refreshToken = localStorage.getItem('elane_refresh');
          if (!refreshToken) { clearAuth(); return Promise.reject(err); }
          try {
            const { data } = await apiClient.post('/auth/refresh', { refreshToken });
            const { accessToken: newToken, refreshToken: newRefresh } = data.data;
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            localStorage.setItem('elane_refresh', newRefresh);
            useAuthStore.setState({ accessToken: newToken });
            original.headers['Authorization'] = `Bearer ${newToken}`;
            return apiClient(original);
          } catch {
            clearAuth();
            localStorage.removeItem('elane_refresh');
          }
        }
        return Promise.reject(err);
      }
    );
    return () => apiClient.interceptors.response.eject(id);
  }, []);
  return null;
}

const HIDE_NAV_FOOTER = ['/admin', '/login'];

export default function App() {
  const location = useLocation();
  const hideChrome = HIDE_NAV_FOOTER.some(p => location.pathname.startsWith(p));

  return (
    <>
      <AuthInit />
      <ToastContainer />
      {!hideChrome && <Navbar />}
      <AnimatePresence mode="wait">
        <main key={location.pathname} className={hideChrome ? '' : 'flex-1'}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/login" element={<Login />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<Orders />} />
            <Route path="/find-your-scent" element={<FindYourScent />} />
            <Route path="/scent-intelligence" element={<ScentIntelligence />} />
            <Route path="/our-story" element={<OurStory />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/account" element={<Account />} />
            <Route path="/admin/*" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </AnimatePresence>
      {!hideChrome && <Footer />}
    </>
  );
}
