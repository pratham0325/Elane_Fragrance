import { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Package, ShoppingCart, Users, Tag, Boxes, Menu, X, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { getProductImageUrl } from '../utils/productImage';
import { useAuthStore } from '../store/authStore';

const fmt = (p: number) => `₹${(p / 100).toLocaleString('en-IN')}`;

function readableField(field: string): string {
  const names: Record<string, string> = {
    name: 'Product name',
    category: 'Category',
    description: 'Description',
    shortDescription: 'Short description',
    gender: 'Gender',
    fragranceFamily: 'Fragrance family',
    concentration: 'Concentration',
    thumbnail: 'Thumbnail URL',
    'sizes.0.size': 'Size',
    'sizes.0.price': 'Price',
    'sizes.0.sku': 'SKU',
    'sizes.0.stock': 'Stock'
  };
  return names[field] ?? field.replace(/\.\d+/g, '').replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}

function getSaveError(err: any): string {
  const status = err?.response?.status;
  const response = err?.response?.data;
  const fieldErrors = Array.isArray(response?.errors) ? response.errors : [];
  const details = fieldErrors
    .map((item: any) => item?.field && item?.message ? `${readableField(item.field)}: ${item.message}` : item?.message)
    .filter(Boolean);

  if (details.length > 0) return `Please correct the following: ${details.join('; ')}`;
  if (status === 401) return 'Your admin session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to create products.';
  if (status === 409) return 'A product with this name or SKU already exists. Use a different value.';
  if (status === 429) return 'Too many requests right now. Please wait a moment and try again.';
  if (status >= 500) return 'The server could not save this product. Please try again shortly.';
  return response?.message ?? 'We could not save this product. Please check the form and try again.';
}

// ── Sidebar ──────────────────────────────────────────────────────────────────
const NAV = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/admin/customers', icon: Users, label: 'Customers' },
  { to: '/admin/inventory', icon: Boxes, label: 'Inventory' },
  { to: '/admin/coupons', icon: Tag, label: 'Coupons' },
  { to: '/admin/ai', icon: Sparkles, label: 'AI Management' },
];

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { pathname } = useLocation();
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onClose} />}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen z-40 lg:z-auto w-64 bg-espresso text-ivory flex flex-col transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-ivory/10 flex items-center justify-between">
          <div>
            <Link to="/" className="font-display text-xl tracking-widest block">ÉLANÉ</Link>
            <p className="text-ivory/40 text-xs tracking-widest uppercase mt-0.5">Admin</p>
          </div>
          <button onClick={onClose} className="lg:hidden"><X size={18} /></button>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to} onClick={onClose}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm tracking-wide rounded transition-colors ${pathname === to ? 'bg-ivory/10 text-ivory' : 'text-ivory/50 hover:text-ivory hover:bg-ivory/5'}`}>
              <Icon size={16} />{label}
            </Link>
          ))}
        </nav>
        <div className="p-6 border-t border-ivory/10 text-xs text-ivory/30">ÉLANÉ Admin v1</div>
      </aside>
    </>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    apiClient.get('/admin/dashboard').then(r => setData(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-charcoal/20 border-t-charcoal rounded-full animate-spin" /></div>;
  const { summary, recentOrders, charts } = data ?? {};
  const stats = [
    { label: 'Total Revenue', value: fmt(summary?.totalRevenue ?? 0), sub: 'Paid orders' },
    { label: 'Total Orders', value: summary?.totalOrders ?? 0, sub: `${summary?.newOrders7d ?? 0} this week` },
    { label: 'Customers', value: summary?.totalCustomers ?? 0, sub: `+${summary?.newCustomers7d ?? 0} this week` },
    { label: 'Active Products', value: summary?.totalProducts ?? 0, sub: `${summary?.pendingOrders ?? 0} pending orders` },
  ];
  return (
    <div>
      <h1 className="font-display text-3xl mb-8">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(s => (
          <div key={s.label} className="bg-ivory border border-charcoal/10 p-5">
            <p className="text-xs tracking-widest uppercase text-charcoal/40 mb-1">{s.label}</p>
            <p className="font-display text-2xl mb-1">{s.value}</p>
            <p className="text-xs text-charcoal/40">{s.sub}</p>
          </div>
        ))}
      </div>
      {charts?.ordersByStatus && (
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-ivory border border-charcoal/10 p-6">
            <h3 className="text-sm tracking-widest uppercase mb-4">Orders by Status</h3>
            <div className="space-y-2">
              {Object.entries(charts.ordersByStatus as Record<string, number>).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-sm">
                  <span className="text-charcoal/60">{status}</span><span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-ivory border border-charcoal/10 p-6">
            <h3 className="text-sm tracking-widest uppercase mb-4">Top Products</h3>
            <div className="space-y-3">
              {(charts.topProducts as any[])?.slice(0, 5).map((p: any) => (
                <div key={p._id} className="flex justify-between text-sm">
                  <span className="text-charcoal/70 truncate flex-1 mr-4">{p.name}</span>
                  <span className="font-medium">{fmt(p.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {recentOrders?.length > 0 && (
        <div className="bg-ivory border border-charcoal/10 p-6">
          <h3 className="text-sm tracking-widest uppercase mb-5">Recent Orders</h3>
          <div className="space-y-3">
            {recentOrders.map((o: any) => (
              <div key={o._id} className="flex items-center justify-between py-2 border-b border-charcoal/5 text-sm">
                <div><p className="font-medium">{o.orderNumber}</p><p className="text-xs text-charcoal/40">{o.user?.name}</p></div>
                <div className="text-right"><p>{fmt(o.total)}</p><p className="text-xs text-charcoal/40">{o.status}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Products ──────────────────────────────────────────────────────────────────
function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    category: '',
    brand: 'ÉLANÉ',
    shortDescription: '',
    description: '',
    gender: 'Unisex',
    fragranceFamily: 'Fresh',
    concentration: 'Eau de Parfum',
    thumbnail: '',
    images: '',
    topNotes: '',
    middleNotes: '',
    baseNotes: '',
    tags: '',
    price: '1999',
    stock: '25',
    size: '50ml',
    sku: 'EL-NEW-50'
  });

  const loadProducts = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        apiClient.get('/admin/products'),
        apiClient.get('/categories')
      ]);
      setProducts(productsRes.data.data.items ?? []);
      setCategories(categoriesRes.data.data ?? []);
    } catch (err) {
      setError('Could not load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const resetForm = () => {
    setForm({
      name: '',
      category: categories[0]?._id ?? '',
      brand: 'ÉLANÉ',
      shortDescription: '',
      description: '',
      gender: 'Unisex',
      fragranceFamily: 'Fresh',
      concentration: 'Eau de Parfum',
      thumbnail: '',
      images: '',
      topNotes: '',
      middleNotes: '',
      baseNotes: '',
      tags: '',
      price: '1999',
      stock: '25',
      size: '50ml',
      sku: 'EL-NEW-50'
    });
    setEditingId(null);
    setError('');
  };

  const openCreateForm = () => {
    setFormOpen(true);
    resetForm();
  };

  const openEditForm = (product: any) => {
    setFormOpen(true);
    setEditingId(product._id);
    setForm({
      name: product.name,
      category: product.category?._id ?? product.category ?? '',
      brand: product.brand ?? 'ÉLANÉ',
      shortDescription: product.shortDescription ?? '',
      description: product.description ?? '',
      gender: product.gender ?? 'Unisex',
      fragranceFamily: product.fragranceFamily ?? 'Fresh',
      concentration: product.concentration ?? 'Eau de Parfum',
      thumbnail: product.thumbnail ?? '',
      images: (product.images ?? []).join(', '),
      topNotes: (product.topNotes ?? []).join(', '),
      middleNotes: (product.middleNotes ?? []).join(', '),
      baseNotes: (product.baseNotes ?? []).join(', '),
      tags: (product.tags ?? []).join(', '),
      price: String((product.price ?? 0) / 100),
      stock: String(product.sizes?.[0]?.stock ?? 0),
      size: product.sizes?.[0]?.size ?? '50ml',
      sku: product.sizes?.[0]?.sku ?? 'EL-NEW-50'
    });
  };

  const parseCsv = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        name: form.name,
        category: form.category,
        brand: form.brand,
        shortDescription: form.shortDescription,
        description: form.description,
        gender: form.gender,
        fragranceFamily: form.fragranceFamily,
        concentration: form.concentration,
        thumbnail: form.thumbnail || getProductImageUrl(null, null, form.name),
        images: form.images ? parseCsv(form.images).length ? parseCsv(form.images) : [form.thumbnail || getProductImageUrl(null, null, form.name)] : [form.thumbnail || getProductImageUrl(null, null, form.name)],
        topNotes: parseCsv(form.topNotes),
        middleNotes: parseCsv(form.middleNotes),
        baseNotes: parseCsv(form.baseNotes),
        tags: parseCsv(form.tags),
        sizes: [{
          size: form.size,
          price: Math.round(Number(form.price || 0) * 100),
          sku: form.sku || `EL-${form.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}-${form.size}`,
          stock: Number(form.stock || 0)
        }],
        isFeatured: false,
        isNew: true,
        isBestSeller: false
      };

      if (editingId) await apiClient.put(`/admin/products/${editingId}`, payload);
      else await apiClient.post('/admin/products', payload);

      setFormOpen(false);
      resetForm();
      await loadProducts();
    } catch (err: any) {
      setError(getSaveError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this product from the storefront?')) return;
    try {
      await apiClient.delete(`/admin/products/${id}`);
      await loadProducts();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Unable to delete product');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-charcoal/20 border-t-charcoal rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8 gap-4">
        <h1 className="font-display text-3xl">Products ({products.length})</h1>
        <button onClick={openCreateForm} className="bg-charcoal text-ivory px-4 py-2 text-xs tracking-[0.25em] uppercase hover:bg-espresso transition-colors">
          Add Product
        </button>
      </div>

      {formOpen && (
        <form onSubmit={handleSubmit} className="bg-ivory border border-charcoal/10 p-6 mb-8 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl">{editingId ? 'Edit product' : 'New product'}</h2>
            <button type="button" onClick={() => { setFormOpen(false); resetForm(); }} className="text-sm text-charcoal/60 hover:text-charcoal">Close</button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs tracking-widest uppercase block mb-2">Product name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full border border-charcoal/20 px-3 py-2.5 text-sm outline-none focus:border-charcoal bg-transparent" />
            </div>

            <div>
              <label className="text-xs tracking-widest uppercase block mb-2">Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required className="w-full border border-charcoal/20 px-3 py-2.5 text-sm outline-none focus:border-charcoal bg-transparent">
                <option value="">Select category</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>{category.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs tracking-widest uppercase block mb-2">Brand</label>
              <input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className="w-full border border-charcoal/20 px-3 py-2.5 text-sm outline-none focus:border-charcoal bg-transparent" />
            </div>

            <div>
              <label className="text-xs tracking-widest uppercase block mb-2">Gender</label>
              <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="w-full border border-charcoal/20 px-3 py-2.5 text-sm outline-none focus:border-charcoal bg-transparent">
                {['Unisex', 'Women', 'Men'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs tracking-widest uppercase block mb-2">Fragrance family</label>
              <select value={form.fragranceFamily} onChange={e => setForm({ ...form, fragranceFamily: e.target.value })} className="w-full border border-charcoal/20 px-3 py-2.5 text-sm outline-none focus:border-charcoal bg-transparent">
                {['Fresh', 'Floral', 'Woody', 'Oriental', 'Citrus', 'Gourmand', 'Aquatic', 'Spicy', 'Musky'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs tracking-widest uppercase block mb-2">Concentration</label>
              <select value={form.concentration} onChange={e => setForm({ ...form, concentration: e.target.value })} className="w-full border border-charcoal/20 px-3 py-2.5 text-sm outline-none focus:border-charcoal bg-transparent">
                {['Eau de Parfum', 'Eau de Toilette', 'Parfum'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs tracking-widest uppercase block mb-2">Price (₹)</label>
              <input type="number" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="w-full border border-charcoal/20 px-3 py-2.5 text-sm outline-none focus:border-charcoal bg-transparent" />
            </div>

            <div>
              <label className="text-xs tracking-widest uppercase block mb-2">Stock</label>
              <input type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} className="w-full border border-charcoal/20 px-3 py-2.5 text-sm outline-none focus:border-charcoal bg-transparent" />
            </div>

            <div>
              <label className="text-xs tracking-widest uppercase block mb-2">Size</label>
              <input value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} className="w-full border border-charcoal/20 px-3 py-2.5 text-sm outline-none focus:border-charcoal bg-transparent" />
            </div>

            <div>
              <label className="text-xs tracking-widest uppercase block mb-2">SKU</label>
              <input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className="w-full border border-charcoal/20 px-3 py-2.5 text-sm outline-none focus:border-charcoal bg-transparent" />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs tracking-widest uppercase block mb-2">Short description</label>
              <textarea value={form.shortDescription} onChange={e => setForm({ ...form, shortDescription: e.target.value })} rows={2} className="w-full border border-charcoal/20 px-3 py-2.5 text-sm outline-none focus:border-charcoal bg-transparent" />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs tracking-widest uppercase block mb-2">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} className="w-full border border-charcoal/20 px-3 py-2.5 text-sm outline-none focus:border-charcoal bg-transparent" />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs tracking-widest uppercase block mb-2">Thumbnail URL</label>
              <input value={form.thumbnail} onChange={e => setForm({ ...form, thumbnail: e.target.value })} placeholder="https://...jpg" className="w-full border border-charcoal/20 px-3 py-2.5 text-sm outline-none focus:border-charcoal bg-transparent" />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs tracking-widest uppercase block mb-2">Extra image URLs (comma separated)</label>
              <input value={form.images} onChange={e => setForm({ ...form, images: e.target.value })} placeholder="https://..., https://..." className="w-full border border-charcoal/20 px-3 py-2.5 text-sm outline-none focus:border-charcoal bg-transparent" />
            </div>

            <div>
              <label className="text-xs tracking-widest uppercase block mb-2">Top notes</label>
              <input value={form.topNotes} onChange={e => setForm({ ...form, topNotes: e.target.value })} placeholder="Bergamot, Rose" className="w-full border border-charcoal/20 px-3 py-2.5 text-sm outline-none focus:border-charcoal bg-transparent" />
            </div>

            <div>
              <label className="text-xs tracking-widest uppercase block mb-2">Middle notes</label>
              <input value={form.middleNotes} onChange={e => setForm({ ...form, middleNotes: e.target.value })} placeholder="Jasmine, Amber" className="w-full border border-charcoal/20 px-3 py-2.5 text-sm outline-none focus:border-charcoal bg-transparent" />
            </div>

            <div>
              <label className="text-xs tracking-widest uppercase block mb-2">Base notes</label>
              <input value={form.baseNotes} onChange={e => setForm({ ...form, baseNotes: e.target.value })} placeholder="Sandalwood, Musk" className="w-full border border-charcoal/20 px-3 py-2.5 text-sm outline-none focus:border-charcoal bg-transparent" />
            </div>

            <div>
              <label className="text-xs tracking-widest uppercase block mb-2">Tags</label>
              <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="luxury, floral, feminine" className="w-full border border-charcoal/20 px-3 py-2.5 text-sm outline-none focus:border-charcoal bg-transparent" />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => { setFormOpen(false); resetForm(); }} className="border border-charcoal/20 px-4 py-2 text-xs tracking-[0.25em] uppercase hover:border-charcoal">Cancel</button>
            <button type="submit" disabled={saving} className="bg-charcoal text-ivory px-5 py-2 text-xs tracking-[0.25em] uppercase hover:bg-espresso transition-colors disabled:opacity-60">
              {saving ? 'Saving…' : editingId ? 'Update product' : 'Create product'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-ivory border border-charcoal/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-beige">
            <tr>{['Product','Family','Price','Stock','Status','Actions'].map(h => <th key={h} className="text-left px-5 py-3 text-xs tracking-widest uppercase text-charcoal/50 font-normal">{h}</th>)}</tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p._id} className="border-t border-charcoal/5 hover:bg-beige/50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-12 bg-beige overflow-hidden"><img src={getProductImageUrl(p.thumbnail, p.images?.[0], p.slug)} alt={p.name} className="w-full h-full object-cover" /></div>
                    <div><p className="font-medium">{p.name}</p><p className="text-xs text-charcoal/40">{p.concentration}</p></div>
                  </div>
                </td>
                <td className="px-5 py-3 text-charcoal/60">{p.fragranceFamily}</td>
                <td className="px-5 py-3">{fmt(p.price)}</td>
                <td className="px-5 py-3">{p.sizes?.reduce((s: number, sz: any) => s + sz.stock, 0) ?? 0} total</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 ${p.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditForm(p)} className="text-xs text-charcoal/70 hover:text-charcoal underline">Edit</button>
                    <button onClick={() => handleDelete(p._id)} className="text-xs text-red-600 hover:text-red-700 underline">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Orders ────────────────────────────────────────────────────────────────────
function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const STATUSES = ['Placed','Confirmed','Processing','Shipped','Out for Delivery','Delivered','Cancelled'];
  useEffect(() => { apiClient.get('/admin/orders').then(r => setOrders(r.data.data.orders)).catch(() => {}).finally(() => setLoading(false)); }, []);
  const updateStatus = async (id: string, status: string) => {
    await apiClient.patch(`/admin/orders/${id}/status`, { status });
    setOrders(o => o.map(x => x._id === id ? { ...x, status } : x));
  };
  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-charcoal/20 border-t-charcoal rounded-full animate-spin" /></div>;
  return (
    <div>
      <h1 className="font-display text-3xl mb-8">Orders ({orders.length})</h1>
      <div className="bg-ivory border border-charcoal/10 overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-beige">
            <tr>{['Order #','Customer','Date','Total','Status','Action'].map(h => <th key={h} className="text-left px-5 py-3 text-xs tracking-widest uppercase text-charcoal/50 font-normal">{h}</th>)}</tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o._id} className="border-t border-charcoal/5 hover:bg-beige/50">
                <td className="px-5 py-3 font-medium">{o.orderNumber}</td>
                <td className="px-5 py-3 text-charcoal/60">{o.user?.name ?? '—'}</td>
                <td className="px-5 py-3 text-charcoal/50 text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className="px-5 py-3">{fmt(o.total)}</td>
                <td className="px-5 py-3">
                  <select value={o.status} onChange={e => updateStatus(o._id, e.target.value)}
                    className="text-xs border border-charcoal/20 px-2 py-1 bg-transparent outline-none">
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-5 py-3 text-xs text-charcoal/40">{o.paymentMethod}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Customers ─────────────────────────────────────────────────────────────────
function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { apiClient.get('/admin/customers').then(r => setCustomers(r.data.data.customers)).catch(() => {}).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-charcoal/20 border-t-charcoal rounded-full animate-spin" /></div>;
  return (
    <div>
      <h1 className="font-display text-3xl mb-8">Customers ({customers.length})</h1>
      <div className="bg-ivory border border-charcoal/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-beige">
            <tr>{['Name','Email','Joined','Status'].map(h => <th key={h} className="text-left px-5 py-3 text-xs tracking-widest uppercase text-charcoal/50 font-normal">{h}</th>)}</tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c._id} className="border-t border-charcoal/5 hover:bg-beige/50">
                <td className="px-5 py-3 font-medium">{c.name}</td>
                <td className="px-5 py-3 text-charcoal/60">{c.email}</td>
                <td className="px-5 py-3 text-xs text-charcoal/40">{new Date(c.createdAt).toLocaleDateString()}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 ${c.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Inventory ─────────────────────────────────────────────────────────────────
function AdminInventory() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { apiClient.get('/admin/inventory').then(r => setProducts(r.data.data)).catch(() => {}).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-charcoal/20 border-t-charcoal rounded-full animate-spin" /></div>;
  return (
    <div>
      <h1 className="font-display text-3xl mb-8">Inventory</h1>
      <div className="space-y-3">
        {products.map(p => (
          <div key={p._id} className="bg-ivory border border-charcoal/10 p-5">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-12 bg-beige flex items-center justify-center text-center p-1"><span className="font-display text-[9px] leading-tight">{p.name.replace('ÉLANÉ ', '')}</span></div>
              <p className="font-display text-lg">{p.name}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {p.sizes?.map((s: any) => (
                <div key={s.size} className={`border px-3 py-2 text-sm ${s.stock < 5 ? 'border-red-200 bg-red-50' : 'border-charcoal/10'}`}>
                  <p className="text-xs text-charcoal/50 mb-0.5">{s.size}</p>
                  <p className="font-medium">{s.stock} units</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Coupons ───────────────────────────────────────────────────────────────────
function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { apiClient.get('/coupons').then(r => setCoupons(r.data.data)).catch(() => {}).finally(() => setLoading(false)); }, []);
  const toggle = async (id: string, isActive: boolean) => {
    await apiClient.patch(`/coupons/${id}/toggle`, { isActive: !isActive });
    setCoupons(c => c.map(x => x._id === id ? { ...x, isActive: !isActive } : x));
  };
  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-charcoal/20 border-t-charcoal rounded-full animate-spin" /></div>;
  return (
    <div>
      <h1 className="font-display text-3xl mb-8">Coupons</h1>
      <div className="space-y-3">
        {coupons.map(c => (
          <div key={c._id} className="bg-ivory border border-charcoal/10 p-5 flex items-center justify-between">
            <div>
              <p className="font-medium tracking-widest">{c.code}</p>
              <p className="text-xs text-charcoal/50 mt-0.5">
                {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% off` : fmt(c.discountValue)} · Min ₹{(c.minCartAmount/100).toLocaleString()} · 
                {c.usageLimit > 0 ? ` ${c.usedCount}/${c.usageLimit} used` : ` ${c.usedCount} used`} · 
                Expires {new Date(c.expiresAt).toLocaleDateString()}
              </p>
            </div>
            <button onClick={() => toggle(c._id, c.isActive)}
              className={`text-xs px-3 py-1.5 border transition-colors ${c.isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
              {c.isActive ? 'Disable' : 'Enable'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}


// ── AI Management (Scent Intelligence) ───────────────────────────────────────
function AdminAI() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reindexing, setReindexing] = useState(false);
  const [message, setMessage] = useState('');

  const load = () => {
    setLoading(true);
    apiClient.get('/admin/ai/status')
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const reindex = async (force: boolean) => {
    setReindexing(true);
    setMessage('');
    try {
      const { data: res } = await apiClient.post('/admin/ai/reindex', { force });
      setMessage(res.message);
      load();
    } catch (err: any) {
      setMessage(err?.response?.data?.message ?? 'Re-indexing failed');
    } finally {
      setReindexing(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-charcoal/20 border-t-charcoal rounded-full animate-spin" /></div>;

  const idx = data?.index ?? {};
  const usage = data?.usage ?? {};
  const search = usage.byFeature?.fragrance_search;
  const compare = usage.byFeature?.product_comparison;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={16} className="text-gold" />
        <span className="text-gold text-xs tracking-[0.3em] uppercase">Scent Intelligence</span>
      </div>
      <h1 className="font-display text-3xl mb-8">AI Management</h1>

      {!idx.providerConfigured && (
        <div className="flex items-start gap-3 border border-amber-200 bg-amber-50 p-5 mb-8">
          <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-900 mb-1">No AI provider configured</p>
            <p className="text-amber-700">
              Set <code className="bg-amber-100 px-1">AI_PROVIDER</code> and <code className="bg-amber-100 px-1">AI_API_KEY</code> in
              backend/.env to enable Scent Intelligence. The storefront continues to work using lexical fallback search.
            </p>
          </div>
        </div>
      )}

      {/* Index status */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Indexed Products', value: `${idx.indexedProducts ?? 0} / ${idx.totalProducts ?? 0}` },
          { label: 'Pending', value: idx.pendingProducts ?? 0 },
          { label: 'Provider', value: idx.providerName ?? 'None' },
          { label: 'Embedding Model', value: idx.embeddingModel ?? '—' },
        ].map(s => (
          <div key={s.label} className="bg-ivory border border-charcoal/10 p-5">
            <p className="text-xs tracking-widest uppercase text-charcoal/40 mb-1">{s.label}</p>
            <p className="font-display text-xl truncate">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-ivory border border-charcoal/10 p-6 mb-8">
        <h3 className="text-sm tracking-widest uppercase mb-4">Embedding Index</h3>
        <p className="text-sm text-charcoal/60 mb-2">
          Last indexed: {idx.lastIndexedAt ? new Date(idx.lastIndexedAt).toLocaleString() : 'Never'}
        </p>
        <p className="text-sm text-charcoal/60 mb-5">
          Embeddings supported: {idx.embeddingsSupported ? 'Yes' : 'No — using lexical fallback'}
        </p>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => reindex(false)} disabled={reindexing || !idx.providerConfigured}
            className="flex items-center gap-2 bg-charcoal text-ivory px-5 py-2.5 text-xs tracking-widest uppercase disabled:opacity-40 hover:bg-espresso transition-colors">
            <RefreshCw size={12} className={reindexing ? 'animate-spin' : ''} />
            {reindexing ? 'Indexing…' : 'Index pending products'}
          </button>
          <button onClick={() => reindex(true)} disabled={reindexing || !idx.providerConfigured}
            className="flex items-center gap-2 border border-charcoal/30 px-5 py-2.5 text-xs tracking-widest uppercase disabled:opacity-40 hover:border-charcoal transition-colors">
            Re-index all (force)
          </button>
        </div>
        {message && <p className="text-sm text-charcoal/70 mt-4">{message}</p>}
      </div>

      {/* Usage stats */}
      <div className="grid lg:grid-cols-2 gap-6">
        {[
          { title: 'AI Fragrance Search', stats: search },
          { title: 'Product Comparison', stats: compare },
        ].map(({ title, stats }) => (
          <div key={title} className="bg-ivory border border-charcoal/10 p-6">
            <h3 className="text-sm tracking-widest uppercase mb-4">{title}</h3>
            {stats ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-charcoal/60">Total requests</span><span>{stats.total}</span></div>
                <div className="flex justify-between"><span className="text-charcoal/60">Successful</span><span className="text-green-700">{stats.successful}</span></div>
                <div className="flex justify-between"><span className="text-charcoal/60">Failed</span><span className="text-red-600">{stats.failed}</span></div>
                <div className="flex justify-between"><span className="text-charcoal/60">Used fallback</span><span>{stats.fallbacks}</span></div>
                <div className="flex justify-between"><span className="text-charcoal/60">Avg response</span><span>{stats.avgLatencyMs}ms</span></div>
                <div className="flex justify-between"><span className="text-charcoal/60">Total tokens</span><span>{(stats.totalTokens ?? 0).toLocaleString()}</span></div>
              </div>
            ) : (
              <p className="text-charcoal/40 text-sm">No requests recorded yet.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Root Admin ────────────────────────────────────────────────────────────────
export default function Admin() {
  const { user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />;
  return (
    <div className="flex min-h-screen bg-beige">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-ivory border-b border-charcoal/10 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden"><Menu size={20} /></button>
          <span className="text-xs tracking-[0.3em] uppercase text-charcoal/50">Admin Panel</span>
        </header>
        <main className="flex-1 p-6 lg:p-10">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="ai" element={<AdminAI />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
